import {
  Controller,
  Get,
  Param,
  Query,
  BadRequestException,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { TranscriptService } from './transcript.service';
import {
  GetTranscriptParamsDto,
  GetTranscriptQueryDto,
  TranscriptResponse,
} from './dto/transcript.dto';

@Controller('transcript')
export class TranscriptController {
  constructor(private readonly transcriptService: TranscriptService) {}

  @Get(':videoId')
  @Throttle({ default: { limit: 30, ttl: 60000 } })
  async getTranscript(
    @Param() params: GetTranscriptParamsDto,
    @Query() query: GetTranscriptQueryDto,
  ): Promise<TranscriptResponse> {
    const { videoId } = params;
    const { language, useStt } = query;

    if (!videoId.match(/^[a-zA-Z0-9_-]{11}$/)) {
      throw new BadRequestException({
        code: 'INVALID_VIDEO_ID',
        message: 'Invalid YouTube video ID format',
      });
    }

    const result = await this.transcriptService.getTranscript(
      videoId,
      language,
      useStt,
    );

    return {
      success: true,
      data: result.data,
      meta: {
        cached: result.cached,
        segmentCount: result.data.segments.length,
      },
    };
  }
}
