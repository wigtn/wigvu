import { Injectable, Logger } from '@nestjs/common';
import { AiClientService } from '../../ai-client/ai-client.service';
import {
  AnalysisResult,
  STTSegment,
  VideoMetadata,
} from '../../ai-client/ai-client.types';

@Injectable()
export class VideoAnalysisService {
  private readonly logger = new Logger(VideoAnalysisService.name);

  constructor(private readonly aiClientService: AiClientService) {}

  async analyze(
    metadata: VideoMetadata,
    transcript: string | null,
    segments?: STTSegment[],
  ): Promise<AnalysisResult> {
    const result = await this.aiClientService.analyzeVideo({
      metadata,
      transcript: transcript || undefined,
      segments: segments || undefined,
    });

    if (!result.success || !result.data) {
      const errorCode = result.error?.code;
      const errorMsg =
        result.error?.message || 'AI analysis failed';
      this.logger.error('AI analysis failed', { error: result.error });

      const error = new Error(errorMsg) as Error & { code?: string };
      if (errorCode) error.code = errorCode;
      throw error;
    }

    return result.data;
  }

  async translateSegments(
    segments: STTSegment[],
    sourceLanguage = 'en',
    targetLanguage = 'ko',
  ) {
    const result = await this.aiClientService.translateSegments({
      segments,
      sourceLanguage,
      targetLanguage,
    });

    if (!result.success || !result.data) {
      throw new Error(result.error?.message || 'Translation failed');
    }

    return result.data.segments;
  }
}
