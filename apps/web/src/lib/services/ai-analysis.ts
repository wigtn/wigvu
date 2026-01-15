/**
 * AI 기반 비디오 분석 서비스
 * AI Service (apps/ai)의 /analyze 엔드포인트를 호출
 */

import { getEnvConfig } from "@/lib/config/env";
import { createLogger } from "@/lib/logger";
import { STTSegment } from "@/lib/services/transcript";

const logger = createLogger("AIAnalysis");

interface VideoMetadata {
  title: string;
  channelName: string;
  description: string;
}

export interface AnalysisResult {
  summary: string;
  watchScore: number;
  watchScoreReason: string;
  keywords: string[];
  highlights: Array<{
    timestamp: number;
    title: string;
    description: string;
  }>;
}

interface AIServiceResponse {
  success: boolean;
  data?: AnalysisResult;
  error?: {
    code: string;
    message: string;
    details?: Record<string, unknown>;
  };
}

/**
 * AI 분석 수행 (AI Service 호출)
 */
export async function analyzeWithAI(
  metadata: VideoMetadata,
  transcript: string | null,
  segments?: STTSegment[]
): Promise<AnalysisResult> {
  const config = getEnvConfig();

  logger.debug("AI 분석 요청", {
    title: metadata.title.slice(0, 50),
    hasTranscript: !!transcript,
    segmentsCount: segments?.length || 0,
  });

  const requestBody = {
    metadata: {
      title: metadata.title,
      channelName: metadata.channelName,
      description: metadata.description || "",
    },
    transcript: transcript || undefined,
    segments: segments || undefined,
  };

  const response = await fetch(`${config.API_URL}/api/v1/analyze`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify(requestBody),
  });

  const result: AIServiceResponse = await response.json();

  if (!response.ok || !result.success) {
    const errorMsg = result.error?.message || `AI Service error: ${response.status}`;
    logger.error("AI 분석 실패", {
      status: response.status,
      error: result.error,
    });
    throw new Error(errorMsg);
  }

  if (!result.data) {
    throw new Error("AI Service returned empty data");
  }

  logger.debug("AI 분석 완료", {
    watchScore: result.data.watchScore,
    keywordsCount: result.data.keywords.length,
    highlightsCount: result.data.highlights.length,
  });

  return result.data;
}
