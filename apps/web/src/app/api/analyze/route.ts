import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { extractVideoId } from "@/features/video/lib/youtube";
import { fetchVideoMetadata } from "@/features/video/services/youtube-metadata";
import { fetchTranscript, TranscriptError } from "@/features/video/services/transcript";
import { analyzeWithAI } from "@/features/video/services/ai-analysis";
import { translateSegments, needsTranslation, TranslationError } from "@/features/video/services/translation";
import { createLogger } from "@/shared/lib/logger";
import { TranscriptSegment } from "@/features/video/types/analysis";
import { ERROR_CODES } from "@/shared/lib/errors/error-codes";

const logger = createLogger("AnalyzeAPI");

// Request body 스키마 검증
const AnalyzeRequestSchema = z.object({
  url: z.string().min(1, "Please enter a URL"),
  language: z.string().optional().default("auto"),
});

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json();

    // Zod 스키마 검증
    const parseResult = AnalyzeRequestSchema.safeParse(rawBody);
    if (!parseResult.success) {
      const firstIssue = parseResult.error.issues[0];
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ERROR_CODES.INVALID_REQUEST,
            message: firstIssue.message,
          },
        },
        { status: 400 }
      );
    }

    const { url, language } = parseResult.data;

    const videoId = extractVideoId(url);
    if (!videoId) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: ERROR_CODES.INVALID_URL,
            message: "Please enter a valid YouTube URL",
          },
        },
        { status: 400 }
      );
    }

    // 메타데이터 조회
    let metadata;
    try {
      metadata = await fetchVideoMetadata(videoId);
    } catch (error) {
      if (error instanceof Error && error.message === "VIDEO_NOT_FOUND") {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: ERROR_CODES.VIDEO_NOT_FOUND,
              message: "Video not found",
            },
          },
          { status: 404 }
        );
      }
      throw error;
    }

    // 자막 추출 (YouTube 우선, STT fallback)
    const transcriptResult = await fetchTranscript(videoId, metadata.duration, language);
    const {
      transcript,
      source: transcriptSource,
      segments,
      detectedLanguage,
      isKorean,
    } = transcriptResult;

    logger.info("자막 추출 완료", {
      source: transcriptSource,
      hasSegments: !!segments,
      segmentCount: segments?.length || 0,
      isKorean,
    });

    // 번역 처리 (한국어가 아닌 경우에만)
    let translatedSegments: TranscriptSegment[] | undefined;

    if (segments && segments.length > 0) {
      const languageCode = detectedLanguage?.code || "en";

      if (!isKorean && needsTranslation(languageCode)) {
        logger.info("번역 시작", { languageCode, segmentCount: segments.length });

        try {
          const translated = await translateSegments(segments);

          // TranscriptSegment 형식으로 변환
          translatedSegments = translated.map((seg) => ({
            start: seg.start,
            end: seg.end,
            text: seg.translatedText, // 하위 호환성
            originalText: seg.originalText,
            translatedText: seg.translatedText,
          }));

          logger.info("번역 완료", { translatedCount: translatedSegments.length });
        } catch (error) {
          // TranslationError인 경우 에러 코드 확인
          if (error instanceof TranslationError) {
            // 치명적인 에러는 전파 (TRANSCRIPT_TOO_LONG 등)
            const fatalErrors: string[] = [
              ERROR_CODES.TRANSCRIPT_TOO_LONG,
              ERROR_CODES.RATE_LIMIT_EXCEEDED,
              ERROR_CODES.SERVICE_UNAVAILABLE,
            ];
            
            if (fatalErrors.includes(error.code)) {
              logger.error("번역 실패 - 치명적 에러", { code: error.code });
              throw error; // 에러 전파
            }
          }
          
          logger.error("번역 실패, 원본 사용", error);
          // 번역 실패 시 원본 세그먼트 사용
          translatedSegments = segments.map((seg) => ({
            ...seg,
            originalText: seg.text,
            translatedText: seg.text,
          }));
        }
      } else {
        // 한국어인 경우 번역 불필요
        logger.info("한국어 자막 - 번역 불필요");
        translatedSegments = segments.map((seg) => ({
          ...seg,
          originalText: seg.text,
          translatedText: seg.text,
        }));
      }
    }

    // AI 분석 (번역된 텍스트로 분석)
    const analysisTranscript = translatedSegments
      ? translatedSegments.map((seg) => seg.translatedText).join(" ")
      : transcript;

    const analysis = await analyzeWithAI(
      metadata,
      analysisTranscript,
      translatedSegments || segments
    );

    const result = {
      id: crypto.randomUUID(),
      url,
      ...metadata,
      ...analysis,
      language,
      transcriptSource,
      detectedLanguage: detectedLanguage || undefined,
      transcript: transcript || undefined,
      transcriptSegments: translatedSegments || segments || undefined,
      isKorean: isKorean || false,
      analyzedAt: new Date().toISOString(),
    };

    return NextResponse.json({
      success: true,
      data: result,
    });
  } catch (error) {
    logger.error("Analysis error", error);

    // TranscriptError 처리 (자막 추출 중 발생한 에러)
    if (error instanceof TranscriptError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: error.code,
            message: error.message,
            details: error.details,
          },
        },
        { status: getStatusCodeForErrorCode(error.code) }
      );
    }

    // TranslationError 처리 (번역 중 발생한 에러)
    if (error instanceof TranslationError) {
      return NextResponse.json(
        {
          success: false,
          error: {
            code: error.code,
            message: error.message,
            details: error.details,
          },
        },
        { status: getStatusCodeForErrorCode(error.code) }
      );
    }

    // 백엔드 에러 코드를 그대로 전달
    if (error instanceof Error) {
      // 에러 객체에 code 속성이 있으면 사용 (ai-analysis.ts에서 설정)
      const errorWithCode = error as Error & { code?: string };
      if (errorWithCode.code && typeof errorWithCode.code === 'string') {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: errorWithCode.code,
              message: error.message,
            },
          },
          { status: getStatusCodeForErrorCode(errorWithCode.code) }
        );
      }

      // 에러 메시지에서 코드 추출 시도 (예: "VIDEO_TOO_LONG: ...")
      const errorMessage = error.message;

      // 타임아웃 에러 감지
      if (errorMessage.toLowerCase().includes('timeout') || errorMessage.includes('시간 초과')) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: ERROR_CODES.PROCESSING_TIMEOUT,
              message: errorMessage,
            },
          },
          { status: 408 }
        );
      }

      // 영상 길이 초과 에러 감지
      if (errorMessage.includes('VIDEO_TOO_LONG') || errorMessage.includes('영상 길이')) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: ERROR_CODES.VIDEO_TOO_LONG,
              message: errorMessage,
            },
          },
          { status: 400 }
        );
      }

      // 오디오 길이 초과 에러 감지
      if (errorMessage.includes('AUDIO_TOO_LONG') || errorMessage.includes('오디오')) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: ERROR_CODES.AUDIO_TOO_LONG,
              message: errorMessage,
            },
          },
          { status: 422 }
        );
      }

      // 자막 텍스트 초과 에러 감지
      if (errorMessage.includes('TRANSCRIPT_TOO_LONG') || errorMessage.includes('텍스트가 너무')) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: ERROR_CODES.TRANSCRIPT_TOO_LONG,
              message: errorMessage,
            },
          },
          { status: 400 }
        );
      }

      // Rate limit 에러 감지
      if (errorMessage.includes('RATE_LIMIT') || errorMessage.includes('요청 한도')) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
              message: errorMessage,
            },
          },
          { status: 429 }
        );
      }

      // 서비스 불가 에러 감지
      if (errorMessage.includes('SERVICE_UNAVAILABLE') || errorMessage.includes('일시적으로')) {
        return NextResponse.json(
          {
            success: false,
            error: {
              code: ERROR_CODES.SERVICE_UNAVAILABLE,
              message: errorMessage,
            },
          },
          { status: 503 }
        );
      }
    }

    return NextResponse.json(
      {
        success: false,
        error: {
          code: ERROR_CODES.INTERNAL_ERROR,
          message: "An error occurred during analysis. Please try again shortly.",
        },
      },
      { status: 500 }
    );
  }
}

/**
 * 에러 코드에 따른 HTTP 상태 코드 매핑
 */
function getStatusCodeForErrorCode(code: string): number {
  const statusMap: Record<string, number> = {
    [ERROR_CODES.VIDEO_TOO_LONG]: 400,
    [ERROR_CODES.AUDIO_TOO_LONG]: 422,
    [ERROR_CODES.TRANSCRIPT_TOO_LONG]: 400,
    [ERROR_CODES.PROCESSING_TIMEOUT]: 408,
    [ERROR_CODES.RATE_LIMIT_EXCEEDED]: 429,
    [ERROR_CODES.SERVICE_UNAVAILABLE]: 503,
    [ERROR_CODES.STT_UNAVAILABLE]: 503,
    [ERROR_CODES.INVALID_URL]: 400,
    [ERROR_CODES.VIDEO_NOT_FOUND]: 404,
    [ERROR_CODES.NO_TRANSCRIPT]: 422,
  };
  return statusMap[code] || 500;
}
