"use client";

import { useEffect, useState, useRef } from "react";
import { useRouter, useParams } from "next/navigation";
import { AnalysisView } from "@/components/analysis-view";
import { LoadingState } from "@/components/loading-state";
import { FullPageError } from "@/components/error-display";
import { VideoAnalysis } from "@/types/analysis";
import { analysisStore } from "@/store/analysis-store";
import { ApiError } from "@/lib/errors";
import { useAnalysisStream } from "@/hooks/use-analysis-stream";

export default function AnalyzePage() {
  const router = useRouter();
  const params = useParams();
  const videoId = params.videoId as string;
  const analysisStartedRef = useRef(false);

  // SSE 스트림 훅
  const {
    steps,
    currentStep,
    isLoading,
    isComplete,
    error,
    result,
    startAnalysis,
    reset: resetStream,
  } = useAnalysisStream();

  // useState의 lazy initialization으로 초기 데이터를 한 번만 가져옴
  const [initialAnalysis] = useState<VideoAnalysis | null>(() => {
    const data = analysisStore.get();
    if (data) {
      analysisStore.clear();
    }
    return data;
  });

  // 현재 표시할 분석 데이터 (SSE 결과 우선)
  const analysis = result ?? initialAnalysis;

  // 페이지 진입 시 pendingAnalysisUrl이 있으면 SSE 분석 시작
  useEffect(() => {
    if (analysisStartedRef.current) return;

    const pendingUrl = sessionStorage.getItem("pendingAnalysisUrl");
    if (pendingUrl && !initialAnalysis) {
      sessionStorage.removeItem("pendingAnalysisUrl");
      analysisStartedRef.current = true;
      startAnalysis(pendingUrl);
    }
  }, [initialAnalysis, startAnalysis]);

  // store에 데이터가 없고, pending URL도 없고, 분석도 시작 안했으면 홈으로 리다이렉트
  useEffect(() => {
    // 약간의 지연을 두어 sessionStorage 체크할 시간 확보
    const timer = setTimeout(() => {
      const pendingUrl = sessionStorage.getItem("pendingAnalysisUrl");
      if (!initialAnalysis && !result && !isLoading && !pendingUrl && !analysisStartedRef.current) {
        router.replace("/");
      }
    }, 100);

    return () => clearTimeout(timer);
  }, [initialAnalysis, result, isLoading, router]);

  // 결과의 videoId가 현재 URL과 다르면 URL 업데이트
  useEffect(() => {
    if (result && result.videoId !== videoId) {
      analysisStore.set(result);
      router.replace(`/analyze/${result.videoId}`);
    }
  }, [result, videoId, router]);

  const handleReset = () => {
    router.push("/");
  };

  const handleNewAnalyze = (url: string) => {
    startAnalysis(url);
  };

  // 로딩 중
  if (isLoading) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <LoadingState steps={steps} currentStep={currentStep} />
      </div>
    );
  }

  // 에러 상태
  if (error) {
    const apiError = ApiError.fromCode(error.code, {
      originalMessage: error.message,
    });

    return (
      <FullPageError
        error={apiError}
        onRetry={() => resetStream()}
        onReset={handleReset}
        autoRedirectDelay={apiError.shouldRedirect ? 5 : 0}
      />
    );
  }

  // 분석 결과 표시
  if (analysis) {
    return (
      <AnalysisView
        key={analysis.videoId}
        analysis={analysis}
        onReset={handleReset}
        onNewAnalyze={handleNewAnalyze}
        isLoading={isLoading}
      />
    );
  }

  return null;
}
