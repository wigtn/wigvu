"use client";

import { useState, useEffect } from "react";
import { useMutation } from "@tanstack/react-query";
import { UrlInput } from "@/components/url-input";
import { AnalysisView } from "@/components/analysis-view";
import { LoadingState } from "@/components/loading-state";
import { VideoAnalysis, AnalyzeResponse } from "@/types/analysis";
import { getRandomSampleVideo } from "@/mocks/sample-videos";
import { RotateCcw, AlertCircle, Zap } from "lucide-react";

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

export default function Home() {
  const [result, setResult] = useState<VideoAnalysis | null>(null);
  const [sampleVideo, setSampleVideo] = useState<VideoAnalysis | null>(null);

  useEffect(() => {
    setSampleVideo(getRandomSampleVideo());
  }, []);

  const mutation = useMutation({
    mutationFn: analyzeVideo,
    onSuccess: (data) => {
      setResult(data);
    },
  });

  const handleAnalyze = (url: string) => {
    setResult(null);
    mutation.mutate(url);
  };

  const handleReset = () => {
    setResult(null);
    mutation.reset();
  };

  const handleTrySample = () => {
    if (sampleVideo) {
      setResult(sampleVideo);
    }
  };

  // 분석 결과가 있을 때: 전체 화면 분석 뷰
  if (result) {
    return (
      <AnalysisView
        analysis={result}
        onReset={handleReset}
        onNewAnalyze={handleAnalyze}
        isLoading={mutation.isPending}
      />
    );
  }

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
            다시 시도
          </button>
        </div>
      </div>
    );
  }

  // 초기 상태: 심플한 랜딩
  return (
    <div className="flex-1 flex flex-col items-center justify-center p-6">
      <div className="w-full max-w-2xl space-y-8 fade-in">
        {/* Logo & Title */}
        <div className="text-center space-y-3">
          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-accent/10 border border-accent/20 text-accent text-sm">
            <Zap className="w-4 h-4" />
            AI 영상 분석
          </div>
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight">
            QuickPreview
          </h1>
          <p className="text-muted-foreground">
            YouTube 영상의 핵심을 빠르게 파악하세요
          </p>
        </div>

        {/* URL Input */}
        <div className="bento-card p-4">
          <UrlInput onAnalyze={handleAnalyze} isLoading={mutation.isPending} />
        </div>

        {/* Sample Button */}
        {sampleVideo && (
          <div className="text-center">
            <button
              onClick={handleTrySample}
              className="text-sm text-muted-foreground hover:text-accent transition-colors"
            >
              또는{" "}
              <span className="underline underline-offset-2">
                샘플 영상으로 체험하기
              </span>
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
