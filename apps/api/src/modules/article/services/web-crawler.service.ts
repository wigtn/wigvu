import { Injectable, Logger } from '@nestjs/common';
import * as cheerio from 'cheerio';
import { Readability } from '@mozilla/readability';
import { JSDOM } from 'jsdom';

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
    this.name = 'CrawlError';
  }
}

function isPrivateIp(ip: string): boolean {
  // IPv4 private ranges (RFC 1918 + RFC 5735)
  if (/^127\./.test(ip)) return true; // Loopback
  if (/^10\./.test(ip)) return true; // 10.0.0.0/8
  if (/^192\.168\./.test(ip)) return true; // 192.168.0.0/16
  if (/^0\./.test(ip) || ip === '0.0.0.0') return true; // 0.0.0.0/8
  if (/^169\.254\./.test(ip)) return true; // Link-local / cloud metadata

  // 172.16.0.0/12 (172.16.0.0 - 172.31.255.255)
  const match172 = ip.match(/^172\.(\d+)\./);
  if (match172) {
    const second = parseInt(match172[1], 10);
    if (second >= 16 && second <= 31) return true;
  }

  // IPv6 private
  if (ip === '::1' || ip === '[::1]') return true;
  if (/^f[cd]/i.test(ip)) return true; // fc00::/7

  return false;
}

function isPrivateUrl(url: string): boolean {
  try {
    const parsed = new URL(url);
    const hostname = parsed.hostname;

    // Block non-http(s) schemes
    if (parsed.protocol !== 'http:' && parsed.protocol !== 'https:') {
      return true;
    }

    // Block known dangerous hostnames
    if (
      hostname === 'localhost' ||
      hostname === 'metadata.google.internal' ||
      hostname.endsWith('.internal')
    ) {
      return true;
    }

    // Check IP-based hostnames
    if (isPrivateIp(hostname)) {
      return true;
    }

    return false;
  } catch {
    return true;
  }
}

@Injectable()
export class WebCrawlerService {
  private readonly logger = new Logger(WebCrawlerService.name);

  async crawl(url: string): Promise<CrawlResult> {
    if (isPrivateUrl(url)) {
      throw new CrawlError('CRAWL_BLOCKED', 'This URL cannot be accessed');
    }

    this.logger.log(`Crawling article: ${url}`);

    let html: string;
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 10000);

      const response = await fetch(url, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (compatible; WIGVUBot/1.0; +https://wigvu.com)',
          Accept:
            'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9,ko;q=0.8',
        },
        signal: controller.signal,
        redirect: 'follow',
      });

      clearTimeout(timeout);

      if (!response.ok) {
        throw new CrawlError(
          'CRAWL_BLOCKED',
          `Failed to fetch article (HTTP ${response.status})`,
        );
      }

      html = await response.text();
    } catch (error) {
      if (error instanceof CrawlError) throw error;
      if (error instanceof Error && error.name === 'AbortError') {
        throw new CrawlError('CRAWL_TIMEOUT', 'Crawling timed out');
      }
      throw new CrawlError(
        'CRAWL_BLOCKED',
        'Failed to fetch article. Please check the URL or paste text directly.',
      );
    }

    const dom = new JSDOM(html, { url });
    const reader = new Readability(dom.window.document);
    const article = reader.parse();

    if (
      !article ||
      !article.textContent ||
      article.textContent.trim().length < 100
    ) {
      throw new CrawlError(
        'CONTENT_TOO_SHORT',
        'Not enough content to analyze. Please paste text directly.',
      );
    }

    const $ = cheerio.load(html);

    const source =
      $('meta[property="og:site_name"]').attr('content') ||
      new URL(url).hostname.replace('www.', '');

    const author =
      $('meta[name="author"]').attr('content') ||
      $('meta[property="article:author"]').attr('content') ||
      null;

    const publishedDate =
      $('meta[property="article:published_time"]').attr('content') ||
      $('time[datetime]').attr('datetime') ||
      null;

    const content = article.textContent.replace(/\n{3,}/g, '\n\n').trim();

    if (content.length > 15000) {
      throw new CrawlError(
        'TEXT_TOO_LONG',
        'Article is too long (15,000 char limit). Please copy and paste a portion.',
      );
    }

    this.logger.log(`Crawl complete: ${article.title}`);

    return {
      title: article.title || $('title').text() || 'Untitled',
      content,
      source,
      author,
      publishedDate,
    };
  }
}
