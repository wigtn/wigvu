/**
 * 비디오 자막 추출 서비스
 * NestJS API Gateway를 통해 YouTube 자막 또는 STT fallback
 */

import { getEnvConfig } from "@/lib/config/env";
import { createLogger } from "@/lib/logger";
import { ERROR_CODES } from "@/lib/errors/error-codes";

const logger = createLogger("Transcript");

/**
 * Transcript 서비스 에러 - 상위 레이어에서 처리
 */
export class TranscriptError extends Error {
  constructor(
    public readonly code: string,
    message: string,
    public readonly details?: Record<string, unknown>
  ) {
    super(message);
    this.name = "TranscriptError";
  }
}

export type TranscriptSource = "youtube" | "stt" | "none";

export interface STTSegment {
  start: number;
  end: number;
  text: string;
}

export interface TranscriptResult {
  transcript: string | null;
  source: TranscriptSource;
  segments?: STTSegment[];
  detectedLanguage?: {
    code: string;
    probability: number;
  };
  /** 자막 언어 코드 */
  captionLanguage?: string;
  /** 한국어 자막 여부 (번역 불필요) */
  isKorean?: boolean;
}

interface TranscriptApiResponse {
  success: boolean;
  data?: {
    source: TranscriptSource;
    language: string;
    isKorean: boolean;
    segments: STTSegment[];
  };
  meta?: {
    cached: boolean;
    segmentCount: number;
  };
  error?: {
    code: string;
    message: string;
  };
}

/**
 * 한국어 자막 코드 확인
 */
function isKoreanCode(code: string): boolean {
  return ["ko", "ko-KR"].includes(code);
}

/**
 * 자막 추출 (NestJS API Gateway 경유)
 * - YouTube 자막 우선, STT fallback
 * - 캐싱, Rate Limiting 적용
 */
export async function fetchTranscript(
  videoId: string,
  duration: number,
  language: string = "auto"
): Promise<TranscriptResult> {
  const config = getEnvConfig();

  // API_URL 우선, 없으면 fallback으로 직접 처리
  const baseUrl = config.API_URL;

  if (!baseUrl) {
    logger.warn("API_URL not configured, transcript fetching disabled");
    return { transcript: null, source: "none" };
  }

  logger.info("자막 추출 시작 (via NestJS Gateway)", { videoId, duration });

  try {
    const url = new URL(`${baseUrl}/api/v1/transcript/${videoId}`);
    url.searchParams.set("language", language);
    url.searchParams.set("useStt", "true");

    const response = await fetch(url.toString(), {
      method: "GET",
      headers: {
        "Content-Type": "application/json",
      },
    });

    const result: TranscriptApiResponse = await response.json();

    if (!response.ok || !result.success || !result.data) {
      logger.error("자막 API 실패", {
        status: response.status,
        error: result.error,
      });

      // 에러 코드가 있으면 상위로 전파
      if (result.error?.code) {
        throw new TranscriptError(
          result.error.code,
          result.error.message || "자막 추출 중 오류가 발생했습니다",
          { status: response.status }
        );
      }

      // 특정 HTTP 상태 코드에 대한 처리
      if (response.status === 413 || response.status === 422) {
        throw new TranscriptError(
          ERROR_CODES.AUDIO_TOO_LONG,
          "영상이 너무 길어요! 더 짧은 영상을 시도해주세요.",
          { status: response.status }
        );
      }

      return { transcript: null, source: "none" };
    }

    const { data } = result;

    if (data.source === "none" || data.segments.length === 0) {
      logger.info("자막 없음");
      return { transcript: null, source: "none" };
    }

    // segments에서 전체 텍스트 생성
    const transcript = data.segments.map((seg) => seg.text).join(" ");

    logger.info("자막 추출 성공", {
      source: data.source,
      language: data.language,
      segmentsCount: data.segments.length,
      cached: result.meta?.cached,
    });

    return {
      transcript,
      source: data.source,
      segments: data.segments,
      captionLanguage: data.language,
      isKorean: data.isKorean || isKoreanCode(data.language),
      detectedLanguage: {
        code: data.language,
        probability: 1.0,
      },
    };
  } catch (error) {
    // TranscriptError는 상위로 전파 (AUDIO_TOO_LONG, TRANSCRIPT_TOO_LONG 등)
    if (error instanceof TranscriptError) {
      logger.error("자막 추출 실패 - 에러 전파", {
        code: error.code,
        message: error.message
      });
      throw error;
    }

    logger.error("자막 API 호출 실패", error);
    return { transcript: null, source: "none" };
  }
}

/**
 * STT 제한 시간 확인 (deprecated - API Gateway에서 처리)
 */
export function isWithinSTTLimit(durationSeconds: number): boolean {
  const config = getEnvConfig();
  return durationSeconds <= config.STT_MAX_DURATION_MINUTES * 60;
}

/**
 * 번역이 필요한지 확인
 */
export function needsTranslation(languageCode: string): boolean {
  return !isKoreanCode(languageCode);
}
