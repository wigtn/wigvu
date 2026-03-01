import { Controller, Post, Body, Res, Logger } from '@nestjs/common';
import { Response } from 'express';
import { AnalyzeVideoDto } from './dto/analyze-video.dto';
import { AnalyzeVideoUseCase } from './use-cases/analyze-video.use-case';

function extractVideoId(url: string): string | null {
  const patterns = [
    /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/|youtube\.com\/shorts\/)([a-zA-Z0-9_-]{11})/,
  ];

  for (const pattern of patterns) {
    const match = url.match(pattern);
    if (match) return match[1];
  }

  // Try as raw video ID
  if (/^[a-zA-Z0-9_-]{11}$/.test(url)) return url;

  return null;
}

@Controller('api/v1/video')
export class VideoController {
  private readonly logger = new Logger(VideoController.name);

  constructor(private readonly analyzeVideoUseCase: AnalyzeVideoUseCase) {}

  @Post('analyze')
  async analyze(@Body() dto: AnalyzeVideoDto, @Res() res: Response) {
    const videoId = extractVideoId(dto.url);
    if (!videoId) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_URL',
          message: 'Please enter a valid YouTube URL',
        },
      });
      return;
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    try {
      for await (const event of this.analyzeVideoUseCase.execute(
        dto.url,
        videoId,
        dto.language || 'auto',
      )) {
        const data = `data: ${JSON.stringify(event)}\n\n`;
        const canWrite = res.write(data);
        if (!canWrite) break;
      }
    } catch (error) {
      this.logger.error('Video analysis stream error', error);
      const errorEvent = {
        type: 'error',
        code: 'INTERNAL_ERROR',
        message: 'An error occurred during analysis.',
      };
      res.write(`data: ${JSON.stringify(errorEvent)}\n\n`);
    }

    res.end();
  }
}
