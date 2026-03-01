"use client";

import { useState, useCallback, useRef } from "react";
import { VideoAnalysis } from "@/features/video/types/analysis";
import { analyzeVideoStream } from "@/shared/lib/api/video-api";

// SSE 이벤트 타입 (서버와 동일)
export type AnalysisStep =
  | "metadata"
  | "transcript"
  | "translation"
  | "analysis"
  | "complete";

export type StepStatus = "pending" | "active" | "done" | "skipped";

export interface StepState {
  step: AnalysisStep;
  status: StepStatus;
  message: string;
}

export interface AnalysisStreamState {
  steps: StepState[];
  currentStep: AnalysisStep | null;
  isLoading: boolean;
  isComplete: boolean;
  error: { code: string; message: string } | null;
  result: VideoAnalysis | null;
}

const INITIAL_STEPS: StepState[] = [
  { step: "metadata", status: "pending", message: "Fetching video info" },
  { step: "transcript", status: "pending", message: "Extracting subtitles" },
  { step: "translation", status: "pending", message: "Translation" },
  { step: "analysis", status: "pending", message: "AI Analysis" },
  { step: "complete", status: "pending", message: "Complete" },
];

export function useAnalysisStream() {
  const [state, setState] = useState<AnalysisStreamState>({
    steps: INITIAL_STEPS,
    currentStep: null,
    isLoading: false,
    isComplete: false,
    error: null,
    result: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    setState({
      steps: INITIAL_STEPS.map((s) => ({ ...s })),
      currentStep: null,
      isLoading: false,
      isComplete: false,
      error: null,
      result: null,
    });
  }, []);

  const startAnalysis = useCallback(async (url: string, language = "auto") => {
    // 이전 요청 취소
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }

    abortControllerRef.current = new AbortController();

    // 상태 초기화
    setState({
      steps: INITIAL_STEPS.map((s) => ({ ...s })),
      currentStep: null,
      isLoading: true,
      isComplete: false,
      error: null,
      result: null,
    });

    try {
      const response = await analyzeVideoStream(url, language, abortControllerRef.current.signal);

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body?.getReader();
      if (!reader) {
        throw new Error("No response body");
      }

      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();

        if (done) break;

        buffer += decoder.decode(value, { stream: true });

        // SSE 이벤트 파싱
        const lines = buffer.split("\n\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          if (line.startsWith("data: ")) {
            const jsonStr = line.slice(6);
            try {
              const event = JSON.parse(jsonStr);
              handleSSEEvent(event);
            } catch (e) {
              console.error("Failed to parse SSE event:", e);
            }
          }
        }
      }
    } catch (error) {
      if (error instanceof Error && error.name === "AbortError") {
        return;
      }

      setState((prev) => ({
        ...prev,
        isLoading: false,
        error: {
          code: "CONNECTION_ERROR",
          message:
            error instanceof Error
              ? error.message
              : "A connection error occurred",
        },
      }));
    }
  }, []);

  const handleSSEEvent = useCallback(
    (event: {
      type: string;
      step?: AnalysisStep;
      status?: "start" | "done";
      message?: string;
      progress?: number;
      code?: string;
      data?: VideoAnalysis;
    }) => {
      switch (event.type) {
        case "step":
          if (event.step && event.status && event.message) {
            setState((prev) => {
              const newSteps = prev.steps.map((s) => {
                if (s.step === event.step) {
                  return {
                    ...s,
                    status:
                      event.status === "start"
                        ? ("active" as StepStatus)
                        : ("done" as StepStatus),
                    message: event.message!,
                  };
                }
                return s;
              });

              // 한국어라서 번역 단계가 스킵된 경우 처리
              // analysis가 시작되었는데 translation이 아직 pending이면 skipped로 처리
              if (event.step === "analysis" && event.status === "start") {
                const translationStep = newSteps.find(
                  (s) => s.step === "translation"
                );
                if (translationStep && translationStep.status === "pending") {
                  translationStep.status = "skipped";
                  translationStep.message = "Korean - no translation needed";
                }
              }

              return {
                ...prev,
                steps: newSteps,
                currentStep: event.step!,
                isComplete: event.step === "complete" && event.status === "done",
              };
            });
          }
          break;

        case "progress":
          // 추후 세밀한 진행률 표시에 사용 가능
          break;

        case "result":
          if (event.data) {
            setState((prev) => ({
              ...prev,
              isLoading: false,
              isComplete: true,
              result: event.data as VideoAnalysis,
            }));
          }
          break;

        case "error":
          setState((prev) => ({
            ...prev,
            isLoading: false,
            error: {
              code: event.code || "UNKNOWN_ERROR",
              message: event.message || "An unknown error occurred",
            },
          }));
          break;
      }
    },
    []
  );

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setState((prev) => ({
      ...prev,
      isLoading: false,
    }));
  }, []);

  return {
    ...state,
    startAnalysis,
    cancel,
    reset,
  };
}
