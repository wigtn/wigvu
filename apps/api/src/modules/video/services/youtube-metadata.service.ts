import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';

export interface VideoMetadata {
  videoId: string;
  title: string;
  channelName: string;
  channelId: string;
  publishedAt: string;
  duration: number;
  viewCount: number;
  likeCount: number;
  thumbnailUrl: string;
  description: string;
}

function parseDuration(isoDuration: string): number {
  const match = isoDuration.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!match) return 0;

  const hours = parseInt(match[1] || '0', 10);
  const minutes = parseInt(match[2] || '0', 10);
  const seconds = parseInt(match[3] || '0', 10);

  return hours * 3600 + minutes * 60 + seconds;
}

@Injectable()
export class YoutubeMetadataService {
  private readonly logger = new Logger(YoutubeMetadataService.name);
  private readonly apiKey: string;

  constructor(private readonly configService: ConfigService) {
    this.apiKey = this.configService.get<string>('youtubeApiKey')!;
  }

  async fetchMetadata(videoId: string): Promise<VideoMetadata> {
    const url = new URL('https://www.googleapis.com/youtube/v3/videos');
    url.searchParams.set('part', 'snippet,contentDetails,statistics');
    url.searchParams.set('id', videoId);
    url.searchParams.set('key', this.apiKey);

    const response = await fetch(url.toString());

    if (!response.ok) {
      this.logger.error(`YouTube API error: ${response.status}`, { videoId });
      if (response.status === 404) {
        throw new Error('VIDEO_NOT_FOUND');
      }
      throw new Error(`YouTube API error: ${response.status}`);
    }

    const data = await response.json();
    const items = data.items;

    if (!items || items.length === 0) {
      throw new Error('VIDEO_NOT_FOUND');
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
      duration: parseDuration(contentDetails.duration),
      viewCount: parseInt(statistics.viewCount || '0', 10),
      likeCount: parseInt(statistics.likeCount || '0', 10),
      thumbnailUrl:
        snippet.thumbnails?.maxres?.url ||
        snippet.thumbnails?.high?.url ||
        snippet.thumbnails?.default?.url,
      description: snippet.description?.substring(0, 2000) || '',
    };
  }
}
