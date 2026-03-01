"use client";

import { useState, useCallback, useRef } from "react";
import type { ArticleAnalysisResult } from "@/features/article/types/article";
import { analyzeArticleStream } from "@/shared/lib/api/article-api";

export type ArticleStep = "crawling" | "analyzing" | "complete";
export type StepStatus = "pending" | "active" | "done";

export interface StepState {
  step: ArticleStep;
  status: StepStatus;
  message: string;
}

export interface ArticleAnalysisState {
  steps: StepState[];
  isLoading: boolean;
  isComplete: boolean;
  error: { code: string; message: string } | null;
  result: ArticleAnalysisResult | null;
}

const INITIAL_STEPS: StepState[] = [
  { step: "crawling", status: "pending", message: "Fetching article" },
  { step: "analyzing", status: "pending", message: "Translating & extracting expressions" },
  { step: "complete", status: "pending", message: "Complete" },
];

export function useArticleAnalysis() {
  const [state, setState] = useState<ArticleAnalysisState>({
    steps: INITIAL_STEPS,
    isLoading: false,
    isComplete: false,
    error: null,
    result: null,
  });

  const abortControllerRef = useRef<AbortController | null>(null);

  const reset = useCallback(() => {
    setState({
      steps: INITIAL_STEPS.map((s) => ({ ...s })),
      isLoading: false,
      isComplete: false,
      error: null,
      result: null,
    });
  }, []);

  const startAnalysis = useCallback(
    async (input: { url?: string; text?: string; title?: string }) => {
      if (abortControllerRef.current) {
        abortControllerRef.current.abort();
      }

      abortControllerRef.current = new AbortController();

      setState({
        steps: INITIAL_STEPS.map((s) => ({ ...s })),
        isLoading: true,
        isComplete: false,
        error: null,
        result: null,
      });

      try {
        const response = await analyzeArticleStream(input, abortControllerRef.current.signal);

        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }

        const reader = response.body?.getReader();
        if (!reader) throw new Error("No response body");

        const decoder = new TextDecoder();
        let buffer = "";

        while (true) {
          const { done, value } = await reader.read();
          if (done) break;

          buffer += decoder.decode(value, { stream: true });
          const lines = buffer.split("\n\n");
          buffer = lines.pop() || "";

          for (const line of lines) {
            if (line.startsWith("data: ")) {
              try {
                const event = JSON.parse(line.slice(6));
                handleSSEEvent(event);
              } catch {
                // ignore parse errors
              }
            }
          }
        }
      } catch (error) {
        if (error instanceof Error && error.name === "AbortError") return;

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
    },
    [],
  );

  const handleSSEEvent = useCallback(
    (event: {
      type: string;
      step?: string;
      status?: "start" | "done";
      message?: string;
      code?: string;
      data?: ArticleAnalysisResult;
    }) => {
      switch (event.type) {
        case "step":
          if (event.step && event.status && event.message) {
            setState((prev) => ({
              ...prev,
              steps: prev.steps.map((s) =>
                s.step === event.step
                  ? {
                      ...s,
                      status:
                        event.status === "start"
                          ? ("active" as StepStatus)
                          : ("done" as StepStatus),
                      message: event.message!,
                    }
                  : s,
              ),
              isComplete:
                event.step === "complete" && event.status === "done",
            }));
          }
          break;

        case "result":
          if (event.data) {
            setState((prev) => ({
              ...prev,
              isLoading: false,
              isComplete: true,
              result: event.data as ArticleAnalysisResult,
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
    [],
  );

  const cancel = useCallback(() => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
      abortControllerRef.current = null;
    }
    setState((prev) => ({ ...prev, isLoading: false }));
  }, []);

  return {
    ...state,
    startAnalysis,
    cancel,
    reset,
  };
}
