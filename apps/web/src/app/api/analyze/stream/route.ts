import { NextRequest } from "next/server";
import { z } from "zod";
import { extractVideoId } from "@/lib/youtube";
import { fetchVideoMetadata } from "@/lib/services/youtube-metadata";
import { fetchTranscript, TranscriptError } from "@/lib/services/transcript";
import { analyzeWithAI } from "@/lib/services/ai-analysis";
import {
  translateSegments,
  needsTranslation,
  TranslationError,
} from "@/lib/services/translation";
import { createLogger } from "@/lib/logger";
import { TranscriptSegment } from "@/types/analysis";
import { ERROR_CODES } from "@/lib/errors/error-codes";

const logger = createLogger("AnalyzeStreamAPI");

// Request body 스키마 검증
const AnalyzeRequestSchema = z.object({
  url: z.string().min(1, "URL을 입력해주세요"),
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
            message: "올바른 YouTube URL을 입력해주세요",
          });
          controller.close();
          return;
        }

        // Step 1: 메타데이터 추출
        sendEvent(controller, {
          type: "step",
          step: "metadata",
          status: "start",
          message: "영상 정보를 가져오는 중...",
        });

        let metadata;
        try {
          metadata = await fetchVideoMetadata(videoId);
        } catch (error) {
          if (error instanceof Error && error.message === "VIDEO_NOT_FOUND") {
            sendEvent(controller, {
              type: "error",
              code: ERROR_CODES.VIDEO_NOT_FOUND,
              message: "영상을 찾을 수 없습니다",
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
          message: `"${metadata.title}" 정보 확인 완료`,
        });

        // Step 2: 자막 추출
        sendEvent(controller, {
          type: "step",
          step: "transcript",
          status: "start",
          message: "자막을 추출하는 중...",
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
            ? "음성 인식으로 자막 추출 완료"
            : transcriptSource === "youtube"
              ? "YouTube 자막 추출 완료"
              : "자막을 찾을 수 없습니다";

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
              en: "영어",
              ja: "일본어",
              zh: "중국어",
              es: "스페인어",
              fr: "프랑스어",
              de: "독일어",
              ko: "한국어",
            };
            const languageName = languageNames[languageCode] || "외국어";

            sendEvent(controller, {
              type: "step",
              step: "translation",
              status: "start",
              message: `${languageName} → 한국어 번역 중...`,
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
                message: `${translatedSegments.length}개 자막 번역 완료`,
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
                message: "번역 실패, 원본 자막 사용",
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
          message: "AI가 영상을 분석하는 중...",
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
          message: "AI 분석 완료",
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
          message: "분석이 완료되었습니다!",
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
        let errorMessage = "분석 중 오류가 발생했습니다.";

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
