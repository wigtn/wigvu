import { NextRequest } from "next/server";
import { z } from "zod";
import { createLogger } from "@/shared/lib/logger";
import { crawlArticle, CrawlError } from "@/features/article/services/crawler";

const logger = createLogger("ArticleStreamAPI");

const ArticleRequestSchema = z
  .object({
    url: z.string().url().optional(),
    text: z.string().min(1).max(15000).optional(),
    title: z.string().optional(),
  })
  .refine((data) => data.url || data.text, {
    message: "Please enter a URL or text",
  });

type SSEEvent =
  | { type: "step"; step: string; status: "start" | "done"; message: string }
  | { type: "result"; data: unknown }
  | { type: "error"; code: string; message: string };

export async function POST(request: NextRequest) {
  const encoder = new TextEncoder();
  let isClosed = false;

  const sendEvent = (
    controller: ReadableStreamDefaultController,
    event: SSEEvent,
  ): boolean => {
    if (isClosed) return false;
    try {
      const data = `data: ${JSON.stringify(event)}\n\n`;
      controller.enqueue(encoder.encode(data));
      return true;
    } catch {
      isClosed = true;
      return false;
    }
  };

  const stream = new ReadableStream({
    async start(controller) {
      try {
        const rawBody = await request.json();

        const parseResult = ArticleRequestSchema.safeParse(rawBody);
        if (!parseResult.success) {
          const firstIssue = parseResult.error.issues[0];
          sendEvent(controller, {
            type: "error",
            code: "INPUT_REQUIRED",
            message: firstIssue.message,
          });
          controller.close();
          return;
        }

        const { url, text, title } = parseResult.data;

        let articleText: string;
        let articleTitle: string = title || "";
        let articleSource: string = "";
        let articleAuthor: string | null = null;
        let articleDate: string | null = null;
        let articleUrl: string | null = url || null;

        // Step 1: Crawl or use text
        if (url) {
          sendEvent(controller, {
            type: "step",
            step: "crawling",
            status: "start",
            message: "Crawling article...",
          });

          try {
            const crawled = await crawlArticle(url);
            articleText = crawled.content;
            articleTitle = crawled.title;
            articleSource = crawled.source;
            articleAuthor = crawled.author;
            articleDate = crawled.publishedDate;

            sendEvent(controller, {
              type: "step",
              step: "crawling",
              status: "done",
              message: `Fetched: "${articleTitle}"`,
            });
          } catch (error) {
            if (error instanceof CrawlError) {
              sendEvent(controller, {
                type: "error",
                code: error.code,
                message: error.message,
              });
              controller.close();
              return;
            }
            throw error;
          }
        } else {
          articleText = text!;
          sendEvent(controller, {
            type: "step",
            step: "crawling",
            status: "done",
            message: "Text input received",
          });
        }

        // Step 2: Analyze with AI
        sendEvent(controller, {
          type: "step",
          step: "analyzing",
          status: "start",
          message: "AI is translating and extracting expressions...",
        });

        const aiServiceUrl = process.env.AI_SERVICE_URL;
        if (!aiServiceUrl) {
          sendEvent(controller, {
            type: "error",
            code: "CONFIGURATION_ERROR",
            message: "AI service not configured",
          });
          controller.close();
          return;
        }

        const headers: Record<string, string> = {
          "Content-Type": "application/json",
        };
        if (process.env.INTERNAL_API_KEY) {
          headers["X-Internal-API-Key"] = process.env.INTERNAL_API_KEY;
        }

        const aiResponse = await fetch(
          `${aiServiceUrl}/api/v1/article/analyze`,
          {
            method: "POST",
            headers,
            body: JSON.stringify({
              text: articleText,
              title: articleTitle || undefined,
              source: articleSource || undefined,
            }),
          },
        );

        const aiResult = await aiResponse.json();

        if (!aiResponse.ok || !aiResult.success) {
          logger.error("AI service error", {
            status: aiResponse.status,
            error: aiResult.error,
          });
          sendEvent(controller, {
            type: "error",
            code: aiResult.error?.code || "ANALYSIS_FAILED",
            message:
              aiResult.error?.message || "Article analysis failed",
          });
          controller.close();
          return;
        }

        sendEvent(controller, {
          type: "step",
          step: "analyzing",
          status: "done",
          message: `${aiResult.data.meta.sentenceCount} sentences translated`,
        });

        // Step 3: Return result
        sendEvent(controller, {
          type: "step",
          step: "complete",
          status: "done",
          message: "Analysis complete!",
        });

        sendEvent(controller, {
          type: "result",
          data: {
            article: {
              title: articleTitle,
              source: articleSource,
              author: articleAuthor,
              publishedDate: articleDate,
              url: articleUrl,
            },
            sentences: aiResult.data.sentences,
            expressions: aiResult.data.expressions,
            meta: aiResult.data.meta,
          },
        });

        isClosed = true;
        controller.close();
      } catch (error) {
        if (isClosed) return;

        logger.error("Article stream error", error);

        sendEvent(controller, {
          type: "error",
          code: "INTERNAL_ERROR",
          message: "An error occurred during analysis",
        });

        isClosed = true;
        try {
          controller.close();
        } catch {
          // already closed
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
