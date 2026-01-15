import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import * as ytdl from '@distube/ytdl-core';

export interface AudioDownloadResult {
  buffer: Buffer;
  contentType: string;
  duration: number;
}

@Injectable()
export class AudioDownloadService {
  private readonly logger = new Logger(AudioDownloadService.name);
  private readonly maxDurationMinutes: number;

  constructor(private configService: ConfigService) {
    this.maxDurationMinutes =
      this.configService.get<number>('stt.maxDurationMinutes') || 20;
  }

  /**
   * Download audio from YouTube video
   * @param videoId YouTube video ID
   * @returns Audio buffer with metadata
   */
  async downloadAudio(videoId: string): Promise<AudioDownloadResult | null> {
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

    try {
      this.logger.log(`Starting audio download for video: ${videoId}`);

      // Get video info first to check duration
      const info = await ytdl.getInfo(videoUrl);
      const durationSeconds = parseInt(info.videoDetails.lengthSeconds, 10);
      const maxDurationSeconds = this.maxDurationMinutes * 60;

      if (durationSeconds > maxDurationSeconds) {
        this.logger.warn(
          `Video duration (${durationSeconds}s) exceeds max limit (${maxDurationSeconds}s)`,
        );
        return null;
      }

      // Download audio only
      const audioStream = ytdl(videoUrl, {
        filter: 'audioonly',
        quality: 'lowestaudio', // Use lowest quality for faster download and smaller size
      });

      // Collect stream into buffer
      const chunks: Buffer[] = [];

      return new Promise((resolve, reject) => {
        audioStream.on('data', (chunk: Buffer) => {
          chunks.push(chunk);
        });

        audioStream.on('end', () => {
          const buffer = Buffer.concat(chunks);
          this.logger.log(
            `Audio download complete: ${videoId}, size: ${(buffer.length / 1024 / 1024).toFixed(2)}MB`,
          );

          resolve({
            buffer,
            contentType: 'audio/webm',
            duration: durationSeconds,
          });
        });

        audioStream.on('error', (error: Error) => {
          this.logger.error(`Audio download failed: ${error.message}`);
          reject(error);
        });
      });
    } catch (error) {
      this.logger.error(
        `Failed to download audio for ${videoId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return null;
    }
  }

  /**
   * Check if video duration is within STT limit
   */
  async checkVideoDuration(videoId: string): Promise<{
    isWithinLimit: boolean;
    durationSeconds: number;
  } | null> {
    const videoUrl = `https://www.youtube.com/watch?v=${videoId}`;

    try {
      const info = await ytdl.getInfo(videoUrl);
      const durationSeconds = parseInt(info.videoDetails.lengthSeconds, 10);
      const maxDurationSeconds = this.maxDurationMinutes * 60;

      return {
        isWithinLimit: durationSeconds <= maxDurationSeconds,
        durationSeconds,
      };
    } catch (error) {
      this.logger.error(
        `Failed to get video info for ${videoId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return null;
    }
  }
}
