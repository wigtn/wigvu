/**
 * Study 분석 서비스
 * Web BFF의 /api/study/analyze 엔드포인트를 호출
 */

import { createLogger } from "@/shared/lib/logger";
import { StudyAnalysisResult, StudyAnalyzeResponse } from "@/features/study/types/study";

const logger = createLogger("StudyService");

export class StudyAnalysisError extends Error {
  constructor(
    public readonly code: string,
    message: string,
  ) {
    super(message);
    this.name = "StudyAnalysisError";
  }
}

/**
 * 한국어 기사 분석 요청
 */
export async function analyzeArticle(
  text: string,
  targetLanguage: string,
  title?: string,
): Promise<StudyAnalysisResult> {
  logger.debug("Study analysis request", {
    textLength: text.length,
    targetLanguage,
    hasTitle: !!title,
  });

  const response = await fetch("/api/study/analyze", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      text,
      targetLanguage,
      title,
    }),
  });

  const result: StudyAnalyzeResponse = await response.json();

  if (!response.ok || !result.success) {
    const errorCode = result.error?.code || "UNKNOWN_ERROR";
    const errorMsg = result.error?.message || `Study analysis failed: ${response.status}`;
    logger.error("Study analysis failed", { status: response.status, error: result.error });
    throw new StudyAnalysisError(errorCode, errorMsg);
  }

  if (!result.data) {
    throw new StudyAnalysisError("EMPTY_RESPONSE", "Study analysis returned empty data");
  }

  logger.debug("Study analysis complete", {
    sentenceCount: result.data.meta.sentenceCount,
    expressionCount: result.data.meta.expressionCount,
  });

  return result.data;
}
