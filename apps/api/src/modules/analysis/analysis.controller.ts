import { Controller, Post, Body, Headers } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AnalysisService } from './analysis.service';
import { AnalyzeVideoDto, AnalysisResponse, AnalyzeDirectDto, AnalyzeDirectResponse } from './dto/analysis.dto';
import { AiClientService } from '../../services/ai-client.service';

@Controller('analysis')
export class AnalysisController {
  constructor(
    private readonly analysisService: AnalysisService,
    private readonly aiClientService: AiClientService,
  ) {}

  /**
   * URL 기반 전체 파이프라인 분석
   * POST /api/v1/analysis
   */
  @Post()
  @Throttle({ default: { limit: 10, ttl: 60000 } })
  async analyzeVideo(
    @Body() dto: AnalyzeVideoDto,
    @Headers('x-request-id') requestId?: string,
  ): Promise<AnalysisResponse> {
    const startTime = Date.now();

    const result = await this.analysisService.analyzeVideo(
      dto.url,
      dto.language,
      dto.skipTranslation,
    );

    return {
      success: true,
      data: result,
      meta: {
        requestId: requestId || result.id,
        processingTime: Date.now() - startTime,
        timestamp: new Date().toISOString(),
      },
    };
  }
}

/**
 * AI 분석 직접 요청 (메타데이터 + 자막 기반)
 * POST /api/v1/analyze
 */
@Controller('analyze')
export class AnalyzeController {
  constructor(private readonly aiClientService: AiClientService) {}

  @Post()
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async analyze(@Body() dto: AnalyzeDirectDto): Promise<AnalyzeDirectResponse> {
    const result = await this.aiClientService.analyze({
      metadata: {
        title: dto.metadata.title,
        channelName: dto.metadata.channelName,
        description: dto.metadata.description || '',
      },
      transcript: dto.transcript,
      segments: dto.segments,
    });

    if (!result || !result.success) {
      return {
        success: false,
        error: {
          code: 'AI_SERVICE_ERROR',
          message: 'AI 분석 서비스 호출에 실패했습니다.',
        },
      };
    }

    return {
      success: true,
      data: result.data,
    };
  }
}
