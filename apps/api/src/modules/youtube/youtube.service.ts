import { Injectable, Inject, Logger, NotFoundException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import axios from 'axios';
import { VideoMetadata } from './dto/youtube.dto';

@Injectable()
export class YoutubeService {
  private readonly logger = new Logger(YoutubeService.name);
  private readonly apiKey: string;
  private readonly cacheTtl: number;

  constructor(
    private configService: ConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    this.apiKey = this.configService.get<string>('youtube.apiKey') || '';
    this.cacheTtl = this.configService.get<number>('cache.metadataTtl') || 3600000;
  }

  async getMetadata(
    videoId: string,
  ): Promise<{ data: VideoMetadata; cached: boolean; cacheExpires?: string }> {
    const cacheKey = `yt:meta:${videoId}`;

    // Check cache
    const cached = await this.cacheManager.get<VideoMetadata>(cacheKey);
    if (cached) {
      this.logger.debug(`Cache hit for video: ${videoId}`);
      return {
        data: cached,
        cached: true,
        cacheExpires: new Date(Date.now() + this.cacheTtl).toISOString(),
      };
    }

    // Fetch from YouTube API
    this.logger.debug(`Fetching metadata for video: ${videoId}`);
    const metadata = await this.fetchFromYouTubeApi(videoId);

    // Store in cache
    await this.cacheManager.set(cacheKey, metadata, this.cacheTtl);

    return {
      data: metadata,
      cached: false,
    };
  }

  private async fetchFromYouTubeApi(videoId: string): Promise<VideoMetadata> {
    if (!this.apiKey) {
      throw new Error('YouTube API key not configured');
    }

    const url = `https://www.googleapis.com/youtube/v3/videos`;
    const params = {
      part: 'snippet,contentDetails,statistics',
      id: videoId,
      key: this.apiKey,
    };

    try {
      const response = await axios.get(url, { params });
      const items = response.data.items;

      if (!items || items.length === 0) {
        throw new NotFoundException({
          code: 'VIDEO_NOT_FOUND',
          message: `Video not found: ${videoId}`,
        });
      }

      const item = items[0];
      const snippet = item.snippet;
      const contentDetails = item.contentDetails;
      const statistics = item.statistics;

      return {
        videoId,
        title: snippet.title,
        channelName: snippet.channelTitle,
        channelId: snippet.channelId,
        publishedAt: snippet.publishedAt,
        duration: this.parseDuration(contentDetails.duration),
        viewCount: parseInt(statistics.viewCount || '0', 10),
        likeCount: parseInt(statistics.likeCount || '0', 10),
        thumbnailUrl:
          snippet.thumbnails?.maxres?.url ||
          snippet.thumbnails?.high?.url ||
          snippet.thumbnails?.default?.url,
        description: snippet.description?.substring(0, 2000) || '',
      };
    } catch (error) {
      if (axios.isAxiosError(error)) {
        this.logger.error(
          `YouTube API error: ${error.response?.status} - ${error.message}`,
        );

        if (error.response?.status === 404) {
          throw new NotFoundException({
            code: 'VIDEO_NOT_FOUND',
            message: `Video not found: ${videoId}`,
          });
        }
      }
      throw error;
    }
  }

  private parseDuration(isoDuration: string): number {
    const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
    if (!match) return 0;

    const hours = parseInt(match[1] || '0', 10);
    const minutes = parseInt(match[2] || '0', 10);
    const seconds = parseInt(match[3] || '0', 10);

    return hours * 3600 + minutes * 60 + seconds;
  }

  extractVideoId(url: string): string | null {
    const patterns = [
      /(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([a-zA-Z0-9_-]{11})/,
      /^([a-zA-Z0-9_-]{11})$/,
    ];

    for (const pattern of patterns) {
      const match = url.match(pattern);
      if (match) {
        return match[1];
      }
    }

    return null;
  }
}
