import { Controller, Post, Body } from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { TranslateService } from './translate.service';
import { TranslateRequestDto, TranslateResponse } from './dto/translate.dto';

@Controller('translate')
export class TranslateController {
  constructor(private readonly translateService: TranslateService) {}

  @Post()
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async translate(@Body() dto: TranslateRequestDto): Promise<TranslateResponse> {
    const result = await this.translateService.translate(dto);

    return {
      success: true,
      data: {
        segments: result.segments,
      },
      meta: {
        translatedCount: result.segments.length,
        processingTime: result.processingTime,
      },
    };
  }
}
