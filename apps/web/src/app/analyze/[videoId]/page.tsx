"use client";

import { useEffect, useMemo } from "react";
import { useRouter, useParams } from "next/navigation";
import { useMutation } from "@tanstack/react-query";
import { AnalysisView } from "@/components/analysis-view";
import { LoadingState } from "@/components/loading-state";
import { VideoAnalysis, AnalyzeResponse } from "@/types/analysis";
import { analysisStore } from "@/store/analysis-store";
import { AlertCircle, RotateCcw } from "lucide-react";

async function analyzeVideo(url: string): Promise<VideoAnalysis> {
  const response = await fetch("/api/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ url }),
  });

  const data: AnalyzeResponse = await response.json();

  if (!data.success || !data.data) {
    throw new Error(data.error?.message || "Analysis failed");
  }

  return data.data;
}

// store에서 초기 데이터 가져오기 (렌더링 전에 동기적으로)
function getInitialAnalysis(): VideoAnalysis | null {
  const storedData = analysisStore.get();
  if (storedData) {
    analysisStore.clear();
    return storedData;
  }
  return null;
}

export default function AnalyzePage() {
  const router = useRouter();
  const params = useParams();
  const videoId = params.videoId as string;

  // 초기 데이터를 동기적으로 가져옴 (한 번만 실행)
  const initialAnalysis = useMemo(() => getInitialAnalysis(), []);

  const mutation = useMutation({
    mutationFn: analyzeVideo,
    onSuccess: (data) => {
      // URL도 새 videoId로 업데이트
      if (data.videoId !== videoId) {
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

  // 에러 상태
  if (mutation.isError) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="bento-card p-8 max-w-md w-full text-center">
          <AlertCircle className="w-12 h-12 text-destructive mx-auto mb-4" />
          <h2 className="text-xl font-semibold mb-2">분석 실패</h2>
          <p className="text-muted-foreground mb-6">
            {mutation.error instanceof Error
              ? mutation.error.message
              : "알 수 없는 오류가 발생했습니다"}
          </p>
          <button onClick={handleReset} className="btn-primary">
            <RotateCcw className="w-4 h-4" />
            처음으로
          </button>
        </div>
      </div>
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
