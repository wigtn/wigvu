import { Controller, Post, Body, Headers } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { AnalysisService } from './analysis.service';
import { AnalyzeVideoDto, AnalysisResponse } from './dto/analysis.dto';

@Controller('analysis')
export class AnalysisController {
  constructor(private readonly analysisService: AnalysisService) {}

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
