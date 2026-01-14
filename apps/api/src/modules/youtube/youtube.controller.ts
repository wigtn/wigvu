import {
  Controller,
  Get,
  Param,
  BadRequestException,
  Headers,
} from '@nestjs/common';
import { Throttle } from '@nestjs/throttler';
import { YoutubeService } from './youtube.service';
import { GetMetadataDto, MetadataResponse } from './dto/youtube.dto';

@Controller('youtube')
export class YoutubeController {
  constructor(private readonly youtubeService: YoutubeService) {}

  @Get('metadata/:videoId')
  @Throttle({ default: { limit: 60, ttl: 60000 } })
  async getMetadata(
    @Param() params: GetMetadataDto,
    @Headers('x-request-id') requestId?: string,
  ): Promise<MetadataResponse> {
    const { videoId } = params;

    if (!videoId.match(/^[a-zA-Z0-9_-]{11}$/)) {
      throw new BadRequestException({
        code: 'INVALID_VIDEO_ID',
        message: 'Invalid YouTube video ID format',
      });
    }

    const result = await this.youtubeService.getMetadata(videoId);

    return {
      success: true,
      data: result.data,
      meta: {
        cached: result.cached,
        ...(result.cacheExpires && { cacheExpires: result.cacheExpires }),
      },
    };
  }
}
