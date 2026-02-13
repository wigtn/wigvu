/**
 * Server-side article crawler
 * Uses cheerio + @mozilla/readability for content extraction
 */

import * as cheerio from "cheerio";
import { Readability } from "@mozilla/readability";
import { JSDOM } from "jsdom";
import { createLogger } from "@/shared/lib/logger";

const logger = createLogger("ArticleCrawler");

export interface CrawlResult {
  title: string;
  content: string;
  source: string;
  author: string | null;
  publishedDate: string | null;
}

export class CrawlError extends Error {
  constructor(
    public code: string,
    message: string,
  ) {
    super(message);
    this.name = "CrawlError";
  }
}

// SSRF prevention: block private IPs
function isPrivateUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname;

    // Block private IP ranges
    if (
      hostname === "localhost" ||
      hostname === "127.0.0.1" ||
      hostname === "0.0.0.0" ||
      hostname.startsWith("10.") ||
      hostname.startsWith("192.168.") ||
      hostname.startsWith("172.") ||
      hostname === "::1" ||
      hostname === "[::1]"
    ) {
      return true;
    }

    // Block non-http(s) schemes
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") {
      return true;
    }

    return false;
  } catch {
    return true;
  }
}

export async function crawlArticle(url: string): Promise<CrawlResult> {
  if (isPrivateUrl(url)) {
    throw new CrawlError("CRAWL_BLOCKED", "This URL cannot be accessed");
  }

  logger.info("Crawling article", { url });

  let html: string;
  try {
    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 10000);

    const response = await fetch(url, {
      headers: {
        "User-Agent":
          "Mozilla/5.0 (compatible; WIGVUBot/1.0; +https://wigvu.com)",
        Accept:
          "text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8",
        "Accept-Language": "en-US,en;q=0.9,ko;q=0.8",
      },
      signal: controller.signal,
      redirect: "follow",
    });

    clearTimeout(timeout);

    if (!response.ok) {
      throw new CrawlError(
        "CRAWL_BLOCKED",
        `Failed to fetch article (HTTP ${response.status})`,
      );
    }

    html = await response.text();
  } catch (error) {
    if (error instanceof CrawlError) throw error;
    if (error instanceof Error && error.name === "AbortError") {
      throw new CrawlError("CRAWL_TIMEOUT", "Crawling timed out");
    }
    throw new CrawlError(
      "CRAWL_BLOCKED",
      "Failed to fetch article. Please check the URL or paste text directly.",
    );
  }

  // Extract content using Readability
  const dom = new JSDOM(html, { url });
  const reader = new Readability(dom.window.document);
  const article = reader.parse();

  if (!article || !article.textContent || article.textContent.trim().length < 100) {
    throw new CrawlError(
      "CONTENT_TOO_SHORT",
      "Not enough content to analyze. Please paste text directly.",
    );
  }

  // Extract metadata with cheerio
  const $ = cheerio.load(html);

  const source =
    $('meta[property="og:site_name"]').attr("content") ||
    new URL(url).hostname.replace("www.", "");

  const author =
    $('meta[name="author"]').attr("content") ||
    $('meta[property="article:author"]').attr("content") ||
    null;

  const publishedDate =
    $('meta[property="article:published_time"]').attr("content") ||
    $('time[datetime]').attr("datetime") ||
    null;

  // Clean text content
  const content = article.textContent
    .replace(/\n{3,}/g, "\n\n")
    .trim();

  // Enforce text limit
  if (content.length > 15000) {
    throw new CrawlError(
      "TEXT_TOO_LONG",
      "Article is too long (15,000 char limit). Please copy and paste a portion.",
    );
  }

  logger.info("Crawl complete", {
    title: article.title,
    contentLength: content.length,
    source,
  });

  return {
    title: article.title || $("title").text() || "Untitled",
    content,
    source,
    author,
    publishedDate,
  };
}
