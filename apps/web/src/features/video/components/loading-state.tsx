"use client";

import { useEffect, useState, useRef } from "react";
import { StepState, AnalysisStep } from "@/features/video/hooks/use-analysis-stream";

// SVG 아이콘 컴포넌트
const Icons = {
  metadata: (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7 4v16M17 4v16M3 8h4m10 0h4M3 12h18M3 16h4m10 0h4M4 20h16a1 1 0 001-1V5a1 1 0 00-1-1H4a1 1 0 00-1 1v14a1 1 0 001 1z"
      />
    </svg>
  ),
  transcript: (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z"
      />
    </svg>
  ),
  translation: (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 5h12M9 3v2m1.048 9.5A18.022 18.022 0 016.412 9m6.088 9h7M11 21l5-10 5 10M12.751 5C11.783 10.77 8.07 15.61 3 18.129"
      />
    </svg>
  ),
  analysis: (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
      />
    </svg>
  ),
  complete: (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M9 12.75L11.25 15 15 9.75M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
      />
    </svg>
  ),
  check: (
    <svg
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M4.5 12.75l6 6 9-13.5"
      />
    </svg>
  ),
  skip: (
    <svg
      className="w-4 h-4"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={2}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M3 8.688c0-.864.933-1.405 1.683-.977l7.108 4.062a1.125 1.125 0 010 1.953l-7.108 4.062A1.125 1.125 0 013 16.81V8.688zM12.75 8.688c0-.864.933-1.405 1.683-.977l7.108 4.062a1.125 1.125 0 010 1.953l-7.108 4.062a1.125 1.125 0 01-1.683-.977V8.688z"
      />
    </svg>
  ),
};

const STEP_LABELS: Record<AnalysisStep, string> = {
  metadata: "Video Info",
  transcript: "Audio Extraction",
  translation: "Translation",
  analysis: "AI Analysis",
  complete: "Complete",
};

interface LoadingStateProps {
  steps?: StepState[];
  currentStep?: AnalysisStep | null;
}

export function LoadingState({ steps }: LoadingStateProps) {
  const [elapsedTime, setElapsedTime] = useState(0);
  const elapsedTimeRef = useRef(0);
  const [dots, setDots] = useState("");

  // 경과 시간 타이머
  useEffect(() => {
    const timer = setInterval(() => {
      elapsedTimeRef.current += 1;
      setElapsedTime(elapsedTimeRef.current);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // 점 애니메이션
  useEffect(() => {
    const timer = setInterval(() => {
      setDots((prev) => (prev.length >= 3 ? "" : prev + "."));
    }, 500);
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
    const doneSteps = steps.filter(
      (s) => s.status === "done" || s.status === "skipped"
    ).length;
    const totalSteps = steps.length - 1;
    return Math.round((doneSteps / totalSteps) * 100);
  };

  const visibleSteps = steps?.filter((s) => s.step !== "complete") || [];

  return (
    <div className="w-full max-w-md mx-auto">
      {/* 메인 카드 */}
      <div className="relative overflow-hidden rounded-2xl bg-gradient-to-b from-card to-card/80 border border-border/50 shadow-2xl shadow-black/10">
        {/* 배경 글로우 효과 */}
        <div className="absolute inset-0 bg-gradient-to-br from-accent/5 via-transparent to-accent/5 pointer-events-none" />

        {/* 콘텐츠 */}
        <div className="relative p-8">
          {/* 헤더 */}
          <div className="text-center mb-8">
            <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-gradient-to-br from-accent/20 to-accent/5 mb-4 ring-1 ring-accent/20">
              <div className="animate-spin-slow">{Icons.analysis}</div>
            </div>
            <h2 className="text-lg font-semibold text-foreground mb-1">
              Analyzing video{dots}
            </h2>
            <p className="text-sm text-muted-foreground">Please wait a moment</p>
          </div>

          {/* 프로그레스 바 */}
          {steps && (
            <div className="mb-8">
              <div className="flex items-center justify-between text-xs text-muted-foreground mb-2">
                <span>Progress</span>
                <span className="font-mono">{getProgress()}%</span>
              </div>
              <div className="relative h-1.5 bg-muted/50 rounded-full overflow-hidden">
                <div
                  className="absolute inset-y-0 left-0 bg-gradient-to-r from-accent via-accent to-accent/80 rounded-full transition-all duration-700 ease-out"
                  style={{ width: `${getProgress()}%` }}
                />
                {/* 글로우 효과 */}
                <div
                  className="absolute inset-y-0 left-0 rounded-full transition-all duration-700"
                  style={{
                    width: `${getProgress()}%`,
                    boxShadow: "0 0 20px var(--accent), 0 0 40px var(--accent)",
                  }}
                />
              </div>
            </div>
          )}

          {/* 단계 리스트 */}
          {steps && (
            <div className="space-y-3">
              {visibleSteps.map((step, index) => (
                <div
                  key={step.step}
                  className={`
                    relative flex items-center gap-4 p-3 rounded-xl transition-all duration-300
                    ${
                      step.status === "active"
                        ? "bg-accent/10 ring-1 ring-accent/30"
                        : step.status === "done"
                        ? "bg-emerald-500/5"
                        : step.status === "skipped"
                        ? "bg-muted/30"
                        : "bg-transparent"
                    }
                  `}
                >
                  {/* 연결선 */}
                  {index < visibleSteps.length - 1 && (
                    <div
                      className={`
                        absolute left-[1.625rem] top-[3.25rem] w-0.5 h-3 transition-colors duration-300
                        ${
                          step.status === "done" || step.status === "skipped"
                            ? "bg-emerald-500/30"
                            : "bg-border"
                        }
                      `}
                    />
                  )}

                  {/* 아이콘 */}
                  <div
                    className={`
                      relative flex-shrink-0 w-10 h-10 rounded-xl flex items-center justify-center transition-all duration-300
                      ${
                        step.status === "active"
                          ? "bg-accent text-white shadow-lg shadow-accent/25"
                          : step.status === "done"
                          ? "bg-emerald-500/15 text-emerald-500"
                          : step.status === "skipped"
                          ? "bg-muted text-muted-foreground"
                          : "bg-muted/50 text-muted-foreground/50"
                      }
                    `}
                  >
                    {step.status === "done" ? (
                      Icons.check
                    ) : step.status === "skipped" ? (
                      Icons.skip
                    ) : step.status === "active" ? (
                      <div className="animate-pulse">{Icons[step.step]}</div>
                    ) : (
                      Icons[step.step]
                    )}
                  </div>

                  {/* 텍스트 */}
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <span
                        className={`
                          text-sm font-medium transition-colors duration-300
                          ${
                            step.status === "active"
                              ? "text-accent"
                              : step.status === "done"
                              ? "text-emerald-500"
                              : step.status === "skipped"
                              ? "text-muted-foreground"
                              : "text-muted-foreground/50"
                          }
                        `}
                      >
                        {STEP_LABELS[step.step]}
                      </span>
                      {step.status === "done" && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-emerald-500/10 text-emerald-500 font-medium">
                          Done
                        </span>
                      )}
                      {step.status === "skipped" && (
                        <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-muted text-muted-foreground font-medium">
                          Skipped
                        </span>
                      )}
                    </div>
                    {step.status === "active" && step.message && (
                      <p className="text-xs text-muted-foreground mt-0.5 truncate">
                        {step.message}
                      </p>
                    )}
                  </div>

                  {/* 활성 표시 애니메이션 */}
                  {step.status === "active" && (
                    <div className="flex-shrink-0 flex gap-1">
                      <span
                        className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce"
                        style={{ animationDelay: "0ms" }}
                      />
                      <span
                        className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce"
                        style={{ animationDelay: "150ms" }}
                      />
                      <span
                        className="w-1.5 h-1.5 rounded-full bg-accent animate-bounce"
                        style={{ animationDelay: "300ms" }}
                      />
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        {/* 푸터 */}
        <div className="relative px-8 py-4 border-t border-border/50 bg-muted/20">
          <div className="flex items-center justify-center gap-2 text-sm text-muted-foreground">
            <svg
              className="w-4 h-4"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
            <span>Elapsed time</span>
            <span className="font-mono font-medium text-foreground tabular-nums">
              {formatTime(elapsedTime)}
            </span>
          </div>
        </div>
      </div>

      {/* 스타일 */}
      <style jsx>{`
        @keyframes spin-slow {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .animate-spin-slow {
          animation: spin-slow 3s linear infinite;
        }
      `}</style>
    </div>
  );
}
