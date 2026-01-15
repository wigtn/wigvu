"use client";

import { useEffect, useState } from "react";
import { useRouter, useParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { AnalysisView } from "@/components/analysis-view";
import { LoadingState } from "@/components/loading-state";
import { FullPageError } from "@/components/error-display";
import { VideoAnalysis, AnalyzeResponse } from "@/types/analysis";
import { analysisStore } from "@/store/analysis-store";
import { ApiError } from "@/lib/errors";
import { AlertCircle, RotateCcw } from "lucide-react";

async function analyzeVideo(url: string): Promise<VideoAnalysis> {
  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });

  const data: AnalyzeResponse = await response.json();

  if (!data.success || !data.data) {
    // ApiError로 변환하여 사용자 친화적 메시지 사용
    throw ApiError.fromResponse(data, response.status);
  }

  return data.data;
}

export default function AnalyzePage() {
  const router = useRouter();
  const params = useParams();
  const videoId = params.videoId as string;

  // useState의 lazy initialization으로 초기 데이터를 한 번만 가져옴
  const [initialAnalysis] = useState<VideoAnalysis | null>(() => {
    const data = analysisStore.get();
    if (data) {
      analysisStore.clear();
    }
    return data;
  });

  const mutation = useMutation({
    mutationFn: analyzeVideo,
    onSuccess: (data) => {
      // URL도 새 videoId로 업데이트
      if (data.videoId !== videoId) {
        // store에 저장 후 라우트 이동
        analysisStore.set(data);
        router.replace(`/analyze/${data.videoId}`);
      }
    },
  });

  // 현재 표시할 분석 데이터 (mutation 결과 우선)
  const analysis = mutation.data ?? initialAnalysis;

  // store에 데이터가 없으면 홈으로 리다이렉트
  useEffect(() => {
    if (!initialAnalysis && !mutation.data) {
      router.replace("/");
    }
  }, [initialAnalysis, mutation.data, router]);

  const handleReset = () => {
    router.push("/");
  };

  const handleNewAnalyze = (url: string) => {
    mutation.mutate(url);
  };

  // 로딩 중
  if (mutation.isPending) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <LoadingState />
      </div>
    );
  }

  // 에러 상태 - ApiError 기반의 사용자 친화적 에러 표시
  if (mutation.isError) {
    const error = mutation.error instanceof ApiError
      ? mutation.error
      : ApiError.fromFetchError(mutation.error);

    return (
      <FullPageError
        error={error}
        onRetry={() => mutation.reset()}
        onReset={handleReset}
        autoRedirectDelay={error.shouldRedirect ? 5 : 0}
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
        isLoading={mutation.isPending}
      />
    );
  }

  return null;
}
