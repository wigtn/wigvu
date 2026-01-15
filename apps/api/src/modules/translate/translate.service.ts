import { Injectable, Logger } from '@nestjs/common';
import { AiClientService } from '../../services/ai-client.service';
import { TranslateRequestDto, TranslatedSegment } from './dto/translate.dto';

@Injectable()
export class TranslateService {
  private readonly logger = new Logger(TranslateService.name);

  constructor(private readonly aiClientService: AiClientService) {}

  async translate(
    dto: TranslateRequestDto,
  ): Promise<{ segments: TranslatedSegment[]; processingTime: number }> {
    const startTime = Date.now();

    this.logger.log(
      `Starting translation: ${dto.segments.length} segments, ${dto.sourceLanguage || 'auto'} -> ${dto.targetLanguage || 'ko'}`,
    );

    const result = await this.aiClientService.translate({
      segments: dto.segments.map((seg) => ({
        start: seg.start,
        end: seg.end,
        text: seg.text,
      })),
      sourceLanguage: dto.sourceLanguage,
      targetLanguage: dto.targetLanguage,
    });

    if (!result || !result.success) {
      this.logger.warn('Translation failed via AI service');
      // Return original text as fallback
      return {
        segments: dto.segments.map((seg) => ({
          start: seg.start,
          end: seg.end,
          originalText: seg.text,
          translatedText: seg.text,
        })),
        processingTime: Date.now() - startTime,
      };
    }

    this.logger.log(
      `Translation completed: ${result.data.segments.length} segments in ${result.meta.processingTime}ms`,
    );

    return {
      segments: result.data.segments,
      processingTime: Date.now() - startTime,
    };
  }
}
