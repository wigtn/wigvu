import { Injectable, Logger } from '@nestjs/common';
import { AiClientService } from '../../ai-client/ai-client.service';
import { WebCrawlerService, CrawlError } from '../services/web-crawler.service';

type SSEEvent =
  | { type: 'step'; step: string; status: 'start' | 'done'; message: string }
  | { type: 'result'; data: unknown }
  | { type: 'error'; code: string; message: string };

@Injectable()
export class AnalyzeArticleUseCase {
  private readonly logger = new Logger(AnalyzeArticleUseCase.name);

  constructor(
    private readonly aiClientService: AiClientService,
    private readonly webCrawlerService: WebCrawlerService,
  ) {}

  async *execute(
    url?: string,
    text?: string,
    title?: string,
  ): AsyncGenerator<SSEEvent> {
    let articleText: string;
    let articleTitle = title || '';
    let articleSource = '';
    let articleAuthor: string | null = null;
    let articleDate: string | null = null;
    const articleUrl = url || null;

    // Step 1: Crawl or use text
    if (url) {
      yield {
        type: 'step',
        step: 'crawling',
        status: 'start',
        message: 'Crawling article...',
      };

      try {
        const crawled = await this.webCrawlerService.crawl(url);
        articleText = crawled.content;
        articleTitle = crawled.title;
        articleSource = crawled.source;
        articleAuthor = crawled.author;
        articleDate = crawled.publishedDate;

        yield {
          type: 'step',
          step: 'crawling',
          status: 'done',
          message: `Fetched: "${articleTitle}"`,
        };
      } catch (error) {
        if (error instanceof CrawlError) {
          yield { type: 'error', code: error.code, message: error.message };
          return;
        }
        throw error;
      }
    } else {
      articleText = text!;
      yield {
        type: 'step',
        step: 'crawling',
        status: 'done',
        message: 'Text input received',
      };
    }

    // Step 2: Analyze with AI
    yield {
      type: 'step',
      step: 'analyzing',
      status: 'start',
      message: 'AI is translating and extracting expressions...',
    };

    const aiResult = await this.aiClientService.analyzeArticle({
      text: articleText,
      title: articleTitle || undefined,
      source: articleSource || undefined,
    });

    if (!aiResult.success || !aiResult.data) {
      yield {
        type: 'error',
        code: aiResult.error?.code || 'ANALYSIS_FAILED',
        message: aiResult.error?.message || 'Article analysis failed',
      };
      return;
    }

    yield {
      type: 'step',
      step: 'analyzing',
      status: 'done',
      message: `${aiResult.data.meta.sentenceCount} sentences translated`,
    };

    // Step 3: Return result
    yield {
      type: 'step',
      step: 'complete',
      status: 'done',
      message: 'Analysis complete!',
    };

    yield {
      type: 'result',
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
    };
  }
}
