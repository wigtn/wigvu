/**
 * 비디오 자막 추출 서비스
 * YouTube 자막 스크래핑 + AI 서비스 STT fallback
 */

import { getEnvConfig } from "@/shared/lib/config/env";
import { createLogger } from "@/shared/lib/logger";
import { ERROR_CODES } from "@/shared/lib/errors/error-codes";

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

/**
 * 한국어 자막 코드 확인
 */
function isKoreanCode(code: string): boolean {
  return ["ko", "ko-KR"].includes(code);
}

/**
 * HTML entity 디코딩
 */
function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/\n/g, " ")
    .trim();
}

/**
 * YouTube 캡션 XML 파싱 → 세그먼트 배열
 */
function parseYouTubeCaptionXml(xml: string): STTSegment[] {
  const segments: STTSegment[] = [];
  const textRegex =
    /<text start="([^"]+)" dur="([^"]+)"[^>]*>([^<]*)<\/text>/g;
  let match;

  while ((match = textRegex.exec(xml)) !== null) {
    const start = parseFloat(match[1]);
    const duration = parseFloat(match[2]);
    const text = decodeHtmlEntities(match[3].trim());

    if (text) {
      segments.push({
        start,
        end: start + duration,
        text,
      });
    }
  }

  return segments;
}

/**
 * YouTube 페이지에서 자막 추출 (HTML 스크래핑)
 */
async function fetchYouTubeTranscript(
  videoId: string,
  language: string
): Promise<{
  source: TranscriptSource;
  language: string;
  isKorean: boolean;
  segments: STTSegment[];
}> {
  try {
    const videoPageUrl = `https://www.youtube.com/watch?v=${videoId}`;
    const pageResponse = await fetch(videoPageUrl, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36",
        "Accept-Language": "en-US,en;q=0.9,ko;q=0.8",
      },
    });

    if (!pageResponse.ok) {
      logger.error("YouTube 페이지 로드 실패", {
        videoId,
        status: pageResponse.status,
      });
      return { source: "none", language: "unknown", isKorean: false, segments: [] };
    }

    const pageHtml = await pageResponse.text();

    // captionTracks 추출
    const captionTracksMatch = pageHtml.match(
      /"captionTracks":\s*(\[.*?\])/
    );

    if (!captionTracksMatch) {
      logger.debug("캡션 트랙 없음", { videoId });
      return { source: "none", language: "unknown", isKorean: false, segments: [] };
    }

    const captionTracks = JSON.parse(captionTracksMatch[1]) as Array<{
      baseUrl: string;
      languageCode: string;
      name?: { simpleText?: string };
    }>;

    // 최적 캡션 트랙 선택
    let selectedTrack = captionTracks[0];
    const targetLang = language === "auto" ? "ko" : language;

    const targetTrack = captionTracks.find(
      (track) => track.languageCode === targetLang
    );
    if (targetTrack) {
      selectedTrack = targetTrack;
    }

    // 캡션 XML 다운로드
    const captionUrl = selectedTrack.baseUrl.replace(/\\u0026/g, "&");
    const captionResponse = await fetch(captionUrl);

    if (!captionResponse.ok) {
      logger.error("캡션 XML 다운로드 실패", { videoId });
      return { source: "none", language: "unknown", isKorean: false, segments: [] };
    }

    const captionXml = await captionResponse.text();
    const segments = parseYouTubeCaptionXml(captionXml);
    const detectedLanguage = selectedTrack.languageCode;

    return {
      source: "youtube",
      language: detectedLanguage,
      isKorean: isKoreanCode(detectedLanguage),
      segments,
    };
  } catch (error) {
    logger.error(
      "YouTube 자막 추출 실패",
      error instanceof Error ? error.message : "Unknown error"
    );
    return { source: "none", language: "unknown", isKorean: false, segments: [] };
  }
}

/**
 * AI 서비스 STT fallback 호출
 */
async function fetchSTTFromAI(
  videoId: string,
  language: string
): Promise<{
  source: TranscriptSource;
  language: string;
  isKorean: boolean;
  segments: STTSegment[];
} | null> {
  const config = getEnvConfig();

  try {
    const response = await fetch(
      `${config.AI_SERVICE_URL}/stt/video/${videoId}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ language }),
      }
    );

    if (response.status === 413 || response.status === 422) {
      throw new TranscriptError(
        ERROR_CODES.AUDIO_TOO_LONG,
        "Video is too long! Please try a shorter video.",
        { status: response.status }
      );
    }

    const result = await response.json();

    if (!response.ok || !result.success) {
      if (result.error?.code) {
        throw new TranscriptError(
          result.error.code,
          result.error.message || "An error occurred during STT processing",
          { status: response.status }
        );
      }
      return null;
    }

    if (result.data?.segments?.length > 0) {
      return {
        source: "stt",
        language: result.data.language,
        isKorean: isKoreanCode(result.data.language),
        segments: result.data.segments.map(
          (seg: { start: number; end: number; text: string }) => ({
            start: seg.start,
            end: seg.end,
            text: seg.text,
          })
        ),
      };
    }

    return null;
  } catch (error) {
    if (error instanceof TranscriptError) throw error;
    logger.error("STT fallback 실패", error);
    return null;
  }
}

/**
 * 자막 추출 (YouTube 스크래핑 → STT fallback)
 */
export async function fetchTranscript(
  videoId: string,
  duration: number,
  language: string = "auto"
): Promise<TranscriptResult> {
  const config = getEnvConfig();

  logger.info("자막 추출 시작", { videoId, duration });

  try {
    // 1. YouTube 자막 시도
    const youtubeResult = await fetchYouTubeTranscript(videoId, language);

    if (youtubeResult.segments.length > 0) {
      const transcript = youtubeResult.segments
        .map((seg) => seg.text)
        .join(" ");

      logger.info("YouTube 자막 추출 성공", {
        videoId,
        language: youtubeResult.language,
        segmentsCount: youtubeResult.segments.length,
      });

      return {
        transcript,
        source: "youtube",
        segments: youtubeResult.segments,
        captionLanguage: youtubeResult.language,
        isKorean: youtubeResult.isKorean,
        detectedLanguage: {
          code: youtubeResult.language,
          probability: 1.0,
        },
      };
    }

    // 2. STT fallback
    logger.debug("YouTube 자막 없음, STT fallback 시도", { videoId });

    const maxDurationSeconds = config.STT_MAX_DURATION_MINUTES * 60;
    if (duration > maxDurationSeconds) {
      logger.warn("영상 길이 초과, STT 건너뜀", {
        videoId,
        duration,
        maxDurationSeconds,
      });
      return { transcript: null, source: "none" };
    }

    const sttResult = await fetchSTTFromAI(videoId, language);

    if (sttResult) {
      const transcript = sttResult.segments.map((seg) => seg.text).join(" ");

      logger.info("STT fallback 성공", {
        videoId,
        language: sttResult.language,
        segmentsCount: sttResult.segments.length,
      });

      return {
        transcript,
        source: "stt",
        segments: sttResult.segments,
        captionLanguage: sttResult.language,
        isKorean: sttResult.isKorean,
        detectedLanguage: {
          code: sttResult.language,
          probability: 1.0,
        },
      };
    }

    logger.info("자막 없음", { videoId });
    return { transcript: null, source: "none" };
  } catch (error) {
    if (error instanceof TranscriptError) {
      logger.error("자막 추출 실패 - 에러 전파", {
        code: error.code,
        message: error.message,
      });
      throw error;
    }

    logger.error("자막 추출 실패", error);
    return { transcript: null, source: "none" };
  }
}

/**
 * STT 제한 시간 확인
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
