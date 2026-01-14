"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

const STEPS = [
  { label: "URL 검증", duration: 500 },
  { label: "메타데이터 수집", duration: 1500 },
  { label: "자막 추출", duration: 2000 },
  { label: "오디오 처리", duration: 8000 },
  { label: "AI 분석", duration: 4000 },
  { label: "결과 생성", duration: 1000 },
];

export function LoadingState() {
  const [currentStep, setCurrentStep] = useState(0);
  const [progress, setProgress] = useState(0);

  useEffect(() => {
    let elapsed = 0;
    const totalDuration = STEPS.reduce((sum, step) => sum + step.duration, 0);

    const interval = setInterval(() => {
      elapsed += 100;

      let cumulativeDuration = 0;
      let stepIndex = 0;
      for (let i = 0; i < STEPS.length; i++) {
        cumulativeDuration += STEPS[i].duration;
        if (elapsed < cumulativeDuration) {
          stepIndex = i;
          break;
        }
      }
      setCurrentStep(stepIndex);

      const newProgress = Math.min((elapsed / totalDuration) * 100, 95);
      setProgress(newProgress);
    }, 100);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="bento-card p-8 text-center max-w-md w-full">
      {/* Spinner */}
      <div className="relative w-20 h-20 mx-auto mb-6">
        <div className="absolute inset-0 rounded-full border-2 border-accent/20" />
        <div className="absolute inset-0 rounded-full border-2 border-transparent border-t-accent animate-spin" />
        <Loader2 className="absolute inset-0 m-auto w-8 h-8 text-accent animate-pulse" />
      </div>

      {/* Current Step */}
      <h3 className="text-lg font-semibold mb-2">{STEPS[currentStep]?.label}</h3>
      <p className="text-sm text-muted-foreground mb-6">
        영상을 분석하고 있습니다
      </p>

      {/* Progress Bar */}
      <div className="space-y-2">
        <div className="h-1.5 bg-muted rounded-full overflow-hidden">
          <div
            className="h-full bg-accent transition-all duration-100 rounded-full"
            style={{ width: `${progress}%` }}
          />
        </div>
        <div className="flex justify-between text-xs text-muted-foreground">
          <span>{Math.round(progress)}%</span>
          <span>{currentStep + 1} / {STEPS.length}</span>
        </div>
      </div>

      {/* Step Indicators */}
      <div className="flex justify-center gap-1.5 mt-6">
        {STEPS.map((_, index) => (
          <div
            key={index}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index <= currentStep
                ? "bg-accent"
                : "bg-muted"
            } ${index === currentStep ? "scale-125" : ""}`}
          />
        ))}
      </div>
    </div>
  );
}
