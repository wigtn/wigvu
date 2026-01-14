"use client";

import { VideoAnalysis } from "@/types/analysis";

/**
 * 분석 결과를 페이지 간 전달하기 위한 간단한 store
 * 라우트 전환 시 데이터를 임시 저장합니다.
 */
class AnalysisStore {
  private data: VideoAnalysis | null = null;

  set(analysis: VideoAnalysis) {
    this.data = analysis;
  }

  get(): VideoAnalysis | null {
    return this.data;
  }

  clear() {
    this.data = null;
  }
}

export const analysisStore = new AnalysisStore();
