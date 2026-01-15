/**
 * 번역 서비스 - AI Service를 통한 번역
 */

import { getEnvConfig } from "@/lib/config/env";
import { createLogger } from "@/lib/logger";

const logger = createLogger("Translation");

/** 번역할 세그먼트 */
export interface TranslationSegment {
  start: number;
  end: number;
  text: string;
}

/** 번역된 세그먼트 */
export interface TranslatedSegment {
  start: number;
  end: number;
  originalText: string;
  translatedText: string;
}

interface TranslateResponse {
  success: boolean;
  data?: {
    segments: TranslatedSegment[];
  };
  meta?: {
    translatedCount: number;
    processingTime: number;
  };
  error?: {
    code: string;
    message: string;
  };
}

/**
 * AI Service를 통한 세그먼트 번역
 */
export async function translateSegments(
  segments: TranslationSegment[],
  sourceLanguage: string = "en",
  targetLanguage: string = "ko"
): Promise<TranslatedSegment[]> {
  if (segments.length === 0) {
    return [];
  }

  const config = getEnvConfig();

  // API_URL (NestJS Gateway) 우선, 없으면 AI_SERVICE_URL 직접 호출
  const baseUrl = config.API_URL || config.AI_SERVICE_URL;
  if (!baseUrl) {
    throw new Error("API_URL or AI_SERVICE_URL is not configured");
  }

  logger.info("번역 시작", {
    totalSegments: segments.length,
    sourceLanguage,
    targetLanguage,
    via: config.API_URL ? "NestJS Gateway" : "AI Service Direct",
  });

  const response = await fetch(`${baseUrl}/api/v1/translate`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      segments,
      sourceLanguage,
      targetLanguage,
    }),
  });

  const result: TranslateResponse = await response.json();

  if (!response.ok || !result.success) {
    const errorMsg = result.error?.message || `Translation error: ${response.status}`;
    logger.error("번역 실패", {
      status: response.status,
      error: result.error,
    });
    throw new Error(errorMsg);
  }

  if (!result.data?.segments) {
    throw new Error("AI Service returned empty translation data");
  }

  logger.info("번역 완료", {
    translatedCount: result.meta?.translatedCount || result.data.segments.length,
    processingTime: result.meta?.processingTime,
  });

  return result.data.segments;
}

/**
 * 번역이 필요한지 확인
 */
export function needsTranslation(languageCode: string): boolean {
  const koreanCodes = ["ko", "ko-KR"];
  return !koreanCodes.includes(languageCode);
}
