import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import {
  AIServiceResponse,
  AnalyzeRequest,
  AnalysisResult,
  TranslateRequest,
  TranslateResponseData,
  ArticleAnalyzeRequest,
  ArticleAnalysisResult,
  SentenceParseRequest,
  SentenceParseResult,
  WordLookupRequest,
  WordLookupResult,
  STTVideoRequest,
  STTResponseData,
} from './ai-client.types';

@Injectable()
export class AiClientService {
  private readonly logger = new Logger(AiClientService.name);
  private readonly baseUrl: string;
  private readonly apiKey: string;

  constructor(private readonly configService: ConfigService) {
    this.baseUrl = this.configService.get<string>('aiServiceUrl')!;
    this.apiKey = this.configService.get<string>('internalApiKey') || '';
  }

  private getHeaders(): Record<string, string> {
    const headers: Record<string, string> = {
      'Content-Type': 'application/json',
    };
    if (this.apiKey) {
      headers['X-Internal-API-Key'] = this.apiKey;
    }
    return headers;
  }

  async analyzeVideo(
    request: AnalyzeRequest,
  ): Promise<AIServiceResponse<AnalysisResult>> {
    return this.post<AnalysisResult>('/api/v1/analyze', request);
  }

  async translateSegments(
    request: TranslateRequest,
  ): Promise<AIServiceResponse<TranslateResponseData>> {
    return this.post<TranslateResponseData>('/api/v1/translate', request);
  }

  async analyzeArticle(
    request: ArticleAnalyzeRequest,
  ): Promise<AIServiceResponse<ArticleAnalysisResult>> {
    return this.post<ArticleAnalysisResult>('/api/v1/article/analyze', request);
  }

  async parseSentence(
    request: SentenceParseRequest,
  ): Promise<AIServiceResponse<SentenceParseResult>> {
    return this.post<SentenceParseResult>(
      '/api/v1/article/parse-sentence',
      request,
    );
  }

  async lookupWord(
    request: WordLookupRequest,
  ): Promise<AIServiceResponse<WordLookupResult>> {
    return this.post<WordLookupResult>('/api/v1/article/word-lookup', request);
  }

  async transcribeVideo(
    videoId: string,
    request: STTVideoRequest,
  ): Promise<AIServiceResponse<STTResponseData>> {
    return this.post<STTResponseData>(`/stt/video/${videoId}`, request);
  }

  private async post<T>(
    path: string,
    body: unknown,
  ): Promise<AIServiceResponse<T>> {
    const url = `${this.baseUrl}${path}`;

    try {
      const response = await fetch(url, {
        method: 'POST',
        headers: this.getHeaders(),
        body: JSON.stringify(body),
      });

      const result = await response.json();

      if (!response.ok || !result.success) {
        this.logger.error(`AI service error: ${path}`, {
          status: response.status,
          error: result.error,
        });
        return {
          success: false,
          error: result.error || {
            code: 'AI_SERVICE_ERROR',
            message: `AI service error: ${response.status}`,
          },
        };
      }

      return result as AIServiceResponse<T>;
    } catch (error) {
      this.logger.error(`AI service request failed: ${path}`, error);
      return {
        success: false,
        error: {
          code: 'SERVICE_UNAVAILABLE',
          message: 'AI service is unavailable',
        },
      };
    }
  }
}
