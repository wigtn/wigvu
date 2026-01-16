"use client";

import { useEffect, useState, useRef } from "react";
import { StepState, AnalysisStep } from "@/hooks/use-analysis-stream";

const STEP_ICONS: Record<AnalysisStep, string> = {
  metadata: "📋",
  transcript: "📝",
  translation: "🌐",
  analysis: "🤖",
  complete: "✨",
};

const STEP_LABELS: Record<AnalysisStep, string> = {
  metadata: "영상 정보",
  transcript: "자막 추출",
  translation: "번역",
  analysis: "AI 분석",
  complete: "완료",
};

interface LoadingStateProps {
  steps?: StepState[];
  currentStep?: AnalysisStep | null;
}

export function LoadingState({ steps, currentStep }: LoadingStateProps) {
  const [elapsedTime, setElapsedTime] = useState(0);
  const elapsedTimeRef = useRef(0);

  // 경과 시간 타이머
  useEffect(() => {
    const timer = setInterval(() => {
      elapsedTimeRef.current += 1;
      setElapsedTime(elapsedTimeRef.current);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 시간 포맷 (mm:ss)
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, "0")}`;
  };

  // 진행률 계산
  const getProgress = () => {
    if (!steps) return 0;
    const doneSteps = steps.filter((s) => s.status === "done" || s.status === "skipped").length;
    // complete 단계는 제외하고 계산 (4단계)
    const totalSteps = steps.length - 1;
    return Math.round((doneSteps / totalSteps) * 100);
  };

  return (
    <div className="bento-card p-8 text-center max-w-lg w-full">
      {/* 단계별 진행 상황 */}
      {steps && (
        <div className="mb-6">
          {/* 프로그레스 바 */}
          <div className="relative h-2 bg-muted rounded-full overflow-hidden mb-6">
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-accent to-accent/80 rounded-full transition-all duration-500 ease-out"
              style={{ width: `${getProgress()}%` }}
            />
            {/* 애니메이션 효과 */}
            <div
              className="absolute inset-y-0 left-0 bg-gradient-to-r from-transparent via-white/30 to-transparent rounded-full"
              style={{
                width: `${getProgress()}%`,
                animation: "shimmer 2s infinite",
              }}
            />
          </div>

          {/* 단계 표시 */}
          <div className="flex justify-between items-start gap-1 relative">
            {steps
              .filter((s) => s.step !== "complete")
              .map((step, index, arr) => (
                <div
                  key={step.step}
                  className={`flex-1 flex flex-col items-center transition-all duration-300 ${
                    step.status === "active"
                      ? "scale-105"
                      : step.status === "done"
                        ? "opacity-100"
                        : step.status === "skipped"
                          ? "opacity-50"
                          : "opacity-40"
                  }`}
                >
                  {/* 연결선 (아이콘 뒤에) */}
                  {index < arr.length - 1 && (
                    <div
                      className={`absolute h-0.5 top-5 -z-10 transition-colors duration-300 ${
                        step.status === "done" || step.status === "skipped"
                          ? "bg-green-500/50"
                          : "bg-muted"
                      }`}
                      style={{
                        left: `calc(${(100 / arr.length) * index}% + ${100 / arr.length / 2}%)`,
                        width: `${100 / arr.length}%`,
                      }}
                    />
                  )}

                  {/* 아이콘 */}
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center mb-2 transition-all duration-300 ${
                      step.status === "active"
                        ? "bg-accent text-white shadow-lg shadow-accent/30 animate-pulse"
                        : step.status === "done"
                          ? "bg-green-500/20 text-green-500"
                          : step.status === "skipped"
                            ? "bg-muted text-muted-foreground"
                            : "bg-muted text-muted-foreground"
                    }`}
                  >
                    {step.status === "done" ? (
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M5 13l4 4L19 7"
                        />
                      </svg>
                    ) : step.status === "skipped" ? (
                      <svg
                        className="w-5 h-5"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={2}
                          d="M13 5l7 7-7 7M5 5l7 7-7 7"
                        />
                      </svg>
                    ) : (
                      <span className="text-lg">{STEP_ICONS[step.step]}</span>
                    )}
                  </div>

                  {/* 라벨 */}
                  <span
                    className={`text-xs font-medium ${
                      step.status === "active"
                        ? "text-accent"
                        : step.status === "done"
                          ? "text-green-500"
                          : "text-muted-foreground"
                    }`}
                  >
                    {STEP_LABELS[step.step]}
                  </span>
                </div>
              ))}
          </div>

          {/* 현재 단계 메시지 */}
          {currentStep && currentStep !== "complete" && (
            <div className="mt-6 py-3 px-4 bg-accent/10 rounded-lg border border-accent/20">
              <p className="text-sm text-foreground flex items-center justify-center gap-2">
                <span className="inline-block w-2 h-2 bg-accent rounded-full animate-pulse" />
                {steps.find((s) => s.step === currentStep)?.message}
              </p>
            </div>
          )}
        </div>
      )}

      {/* 경과 시간 타이머 */}
      <p className="text-sm text-muted-foreground">
        경과 시간:{" "}
        <span className="font-mono text-accent">{formatTime(elapsedTime)}</span>
      </p>

      {/* Shimmer 애니메이션 */}
      <style jsx>{`
        @keyframes shimmer {
          0% {
            transform: translateX(-100%);
          }
          100% {
            transform: translateX(200%);
          }
        }
      `}</style>
    </div>
  );
}
