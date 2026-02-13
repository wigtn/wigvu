import { NextRequest } from "next/server";
import { z } from "zod";
import { extractVideoId } from "@/features/video/lib/youtube";
import { fetchVideoMetadata } from "@/features/video/services/youtube-metadata";
import { fetchTranscript, TranscriptError } from "@/features/video/services/transcript";
import { analyzeWithAI } from "@/features/video/services/ai-analysis";
import {
  translateSegments,
  needsTranslation,
  TranslationError,
} from "@/features/video/services/translation";
import { createLogger } from "@/shared/lib/logger";
import { TranscriptSegment } from "@/features/video/types/analysis";
import { ERROR_CODES } from "@/shared/lib/errors/error-codes";

const logger = createLogger("AnalyzeStreamAPI");

// Request body 스키마 검증
const AnalyzeRequestSchema = z.object({
  url: z.string().min(1, "Please enter a URL"),
  language: z.string().optional().default("auto"),
});

// SSE 이벤트 타입
export type AnalysisStep =
  | "metadata"
  | "transcript"
  | "translation"
  | "analysis"
  | "complete";

export type SSEEvent =
  | { type: "step"; step: AnalysisStep; status: "start" | "done"; message: string }
  | { type: "progress"; step: AnalysisStep; progress: number; message: string }
  | { type: "result"; data: unknown }
  | { type: "error"; code: string; message: string };

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();
  let isClosed = false;

  // SSE 이벤트 전송 헬퍼 (연결이 끊어졌는지 확인)
  const sendEvent = (controller: ReadableStreamDefaultController, event: SSEEvent): boolean => {
    if (isClosed) return false;
    try {
      const data = `data: ${JSON.stringify(event)}\n\n`;
      controller.enqueue(encoder.encode(data));
      return true;
    } catch {
      isClosed = true;
      logger.info("클라이언트 연결 끊김");
      return false;
    }
  };

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const rawBody = await request.json();

        // Zod 스키마 검증
        const parseResult = AnalyzeRequestSchema.safeParse(rawBody);
        if (!parseResult.success) {
          const firstIssue = parseResult.error.issues[0];
          sendEvent(controller, {
            type: "error",
            code: ERROR_CODES.INVALID_REQUEST,
            message: firstIssue.message,
          });
          controller.close();
          return;
        }

        const { url, language } = parseResult.data;

        const videoId = extractVideoId(url);
        if (!videoId) {
          sendEvent(controller, {
            type: "error",
            code: ERROR_CODES.INVALID_URL,
            message: "Please enter a valid YouTube URL",
          });
          controller.close();
          return;
        }

        // Step 1: 메타데이터 추출
        sendEvent(controller, {
          type: "step",
          step: "metadata",
          status: "start",
          message: "Fetching video info...",
        });

        let metadata;
        try {
          metadata = await fetchVideoMetadata(videoId);
        } catch (error) {
          if (error instanceof Error && error.message === "VIDEO_NOT_FOUND") {
            sendEvent(controller, {
              type: "error",
              code: ERROR_CODES.VIDEO_NOT_FOUND,
              message: "Video not found",
            });
            controller.close();
            return;
          }
          throw error;
        }

        sendEvent(controller, {
          type: "step",
          step: "metadata",
          status: "done",
          message: `Video info loaded: "${metadata.title}"`,
        });

        // Step 2: 자막 추출
        sendEvent(controller, {
          type: "step",
          step: "transcript",
          status: "start",
          message: "Extracting subtitles...",
        });

        const transcriptResult = await fetchTranscript(
          videoId,
          metadata.duration,
          language
        );
        const {
          transcript,
          source: transcriptSource,
          segments,
          detectedLanguage,
          isKorean,
        } = transcriptResult;

        const transcriptMessage =
          transcriptSource === "stt"
            ? "Subtitles extracted via speech recognition"
            : transcriptSource === "youtube"
              ? "YouTube subtitles extracted"
              : "No subtitles found";

        sendEvent(controller, {
          type: "step",
          step: "transcript",
          status: "done",
          message: transcriptMessage,
        });

        logger.info("자막 추출 완료", {
          source: transcriptSource,
          hasSegments: !!segments,
          segmentCount: segments?.length || 0,
          isKorean,
        });

        // Step 3: 번역 처리
        let translatedSegments: TranscriptSegment[] | undefined;

        if (segments && segments.length > 0) {
          const languageCode = detectedLanguage?.code || "en";

          if (!isKorean && needsTranslation(languageCode)) {
            // 언어 코드를 이름으로 변환
            const languageNames: Record<string, string> = {
              en: "English",
              ja: "Japanese",
              zh: "Chinese",
              es: "Spanish",
              fr: "French",
              de: "German",
              ko: "Korean",
            };
            const languageName = languageNames[languageCode] || "Foreign";

            sendEvent(controller, {
              type: "step",
              step: "translation",
              status: "start",
              message: `Translating ${languageName} → Korean...`,
            });

            logger.info("번역 시작", {
              languageCode,
              segmentCount: segments.length,
            });

            try {
              const translated = await translateSegments(segments);

              translatedSegments = translated.map((seg) => ({
                start: seg.start,
                end: seg.end,
                text: seg.translatedText,
                originalText: seg.originalText,
                translatedText: seg.translatedText,
              }));

              sendEvent(controller, {
                type: "step",
                step: "translation",
                status: "done",
                message: `${translatedSegments.length} subtitles translated`,
              });

              logger.info("번역 완료", {
                translatedCount: translatedSegments.length,
              });
            } catch (error) {
              if (error instanceof TranslationError) {
                const fatalErrors: string[] = [
                  ERROR_CODES.TRANSCRIPT_TOO_LONG,
                  ERROR_CODES.RATE_LIMIT_EXCEEDED,
                  ERROR_CODES.SERVICE_UNAVAILABLE,
                ];

                if (fatalErrors.includes(error.code)) {
                  logger.error("번역 실패 - 치명적 에러", { code: error.code });
                  sendEvent(controller, {
                    type: "error",
                    code: error.code,
                    message: error.message,
                  });
                  controller.close();
                  return;
                }
              }

              logger.error("번역 실패, 원본 사용", error);
              translatedSegments = segments.map((seg) => ({
                ...seg,
                originalText: seg.text,
                translatedText: seg.text,
              }));

              sendEvent(controller, {
                type: "step",
                step: "translation",
                status: "done",
                message: "Translation failed, using original subtitles",
              });
            }
          } else {
            // 한국어인 경우 번역 불필요 - 번역 단계 스킵
            logger.info("한국어 자막 - 번역 불필요");
            translatedSegments = segments.map((seg) => ({
              ...seg,
              originalText: seg.text,
              translatedText: seg.text,
            }));
          }
        }

        // Step 4: AI 분석
        sendEvent(controller, {
          type: "step",
          step: "analysis",
          status: "start",
          message: "AI is analyzing the video...",
        });

        const analysisTranscript = translatedSegments
          ? translatedSegments.map((seg) => seg.translatedText).join(" ")
          : transcript;

        const analysis = await analyzeWithAI(
          metadata,
          analysisTranscript,
          translatedSegments || segments
        );

        sendEvent(controller, {
          type: "step",
          step: "analysis",
          status: "done",
          message: "AI analysis complete",
        });

        // Step 5: 결과 반환
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

        sendEvent(controller, {
          type: "step",
          step: "complete",
          status: "done",
          message: "Analysis complete!",
        });

        sendEvent(controller, {
          type: "result",
          data: result,
        });

        isClosed = true;
        controller.close();
      } catch (error) {
        // 이미 닫혔으면 무시
        if (isClosed) {
          logger.info("분석 중단됨 (클라이언트 연결 끊김)");
          return;
        }

        logger.error("Analysis stream error", error);

        let errorCode: string = ERROR_CODES.INTERNAL_ERROR;
        let errorMessage = "An error occurred during analysis.";

        if (error instanceof TranscriptError) {
          errorCode = error.code;
          errorMessage = error.message;
        } else if (error instanceof TranslationError) {
          errorCode = error.code;
          errorMessage = error.message;
        } else if (error instanceof Error) {
          const errorWithCode = error as Error & { code?: string };
          if (errorWithCode.code) {
            errorCode = errorWithCode.code;
          }
          errorMessage = error.message;
        }

        sendEvent(controller, {
          type: "error",
          code: errorCode,
          message: errorMessage,
        });

        isClosed = true;
        try {
          controller.close();
        } catch {
          // 이미 닫혔으면 무시
        }
      }
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
