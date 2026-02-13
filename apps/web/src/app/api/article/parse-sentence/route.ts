import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createLogger } from "@/shared/lib/logger";

const logger = createLogger("ArticleParseSentenceAPI");

const ParseSentenceSchema = z.object({
  sentence: z.string().min(1).max(2000),
  context: z.string().optional(),
});

export async function POST(request: NextRequest) {
  try {
    const rawBody = await request.json();

    const parseResult = ParseSentenceSchema.safeParse(rawBody);
    if (!parseResult.success) {
      return NextResponse.json(
        { success: false, error: { code: "INVALID_REQUEST", message: parseResult.error.issues[0].message } },
        { status: 400 },
      );
    }

    const { sentence, context } = parseResult.data;

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

    const response = await fetch(`${aiServiceUrl}/api/v1/article/parse-sentence`, {
      method: "POST",
      headers,
      body: JSON.stringify({ sentence, context: context || undefined }),
    });

    const result = await response.json();

    if (!response.ok || !result.success) {
      logger.error("AI parse-sentence error", { status: response.status, error: result.error });
      return NextResponse.json(
        { success: false, error: result.error || { code: "ANALYSIS_FAILED", message: "Sentence parsing failed" } },
        { status: response.status },
      );
    }

    return NextResponse.json(result);
  } catch (error) {
    logger.error("Parse sentence error", error);
    return NextResponse.json(
      { success: false, error: { code: "INTERNAL_ERROR", message: "An unexpected error occurred" } },
      { status: 500 },
    );
  }
}
