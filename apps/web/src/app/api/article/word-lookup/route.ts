import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createLogger } from "@/shared/lib/logger";

const logger = createLogger("ArticleWordLookupAPI");

const WordLookupSchema = z.object({
  word: z.string().min(1).max(200),
  sentence: z.string().min(1),
});

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json();

    const parseResult = WordLookupSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_REQUEST", message: parseResult.error.issues[0].message } },
        { status: 400 },
      );
    }

    const { word, sentence } = parseResult.data;

    const aiServiceUrl = process.env.AI_SERVICE_URL;
    if (!aiServiceUrl) {
      return NextResponse.json(
        { success: false, error: { code: "CONFIGURATION_ERROR", message: "Service not configured" } },
        { status: 500 },
      );
    }

    const headers: Record<string, string> = { "Content-Type": "application/json" };
    if (process.env.INTERNAL_API_KEY) {
      headers["X-Internal-API-Key"] = process.env.INTERNAL_API_KEY;
    }

    const response = await fetch(`${aiServiceUrl}/api/v1/article/word-lookup`, {
      method: "POST",
      headers,
      body: JSON.stringify({ word, sentence }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      logger.error("AI word-lookup error", { status: response.status, error: result.error });
      return NextResponse.json(
        { success: false, error: result.error || { code: "ANALYSIS_FAILED", message: "Word lookup failed" } },
        { status: response.status },
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    logger.error("Word lookup error", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } },
      { status: 500 },
    );
  }
}
