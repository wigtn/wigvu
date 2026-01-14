"use client";

import { useState } from "react";
import { useMutation } from "@tanstack/react-query";
import { UrlInput } from "@/components/url-input";
import { AnalysisView } from "@/components/analysis-view";
import { LoadingState } from "@/components/loading-state";
import { VideoAnalysis, AnalyzeResponse } from "@/types/analysis";
import { sampleVideos } from "@/mocks/sample-videos";
import { RotateCcw, AlertCircle, Zap, TestTube } from "lucide-react";

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
  const [showTestMenu, setShowTestMenu] = useState(false);

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

  const handleTrySample = (video: VideoAnalysis) => {
    setResult(video);
    setShowTestMenu(false);
  };

  // 분석 결과가 있을 때: 전체 화면 분석 뷰
  if (result) {
    return (
      <AnalysisView
      key={result.videoId}
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

        {/* Mock Data Test Menu */}
        <div className="text-center relative">
          <button
            onClick={() => setShowTestMenu(!showTestMenu)}
            className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground transition-colors"
          >
            <TestTube className="w-4 h-4" />
            <span className="underline underline-offset-2">
              샘플 영상으로 테스트
            </span>
          </button>

          {showTestMenu && (
            <div className="absolute top-full left-1/2 -translate-x-1/2 mt-2 w-80 bg-card border border-border rounded-lg shadow-lg z-10 p-2 max-h-80 overflow-y-auto">
              {sampleVideos.map((video) => (
                <button
                  key={video.id}
                  onClick={() => handleTrySample(video)}
                  className="w-full text-left p-3 rounded-md hover:bg-muted transition-colors"
                >
                  <p className="text-sm font-medium truncate">{video.title}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {video.channelName} · {video.language.toUpperCase()}
                    {video.isKorean && " · 한국어"}
                  </p>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
