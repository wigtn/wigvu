import { IsString, IsNotEmpty, Matches } from 'class-validator';

export class GetMetadataDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-zA-Z0-9_-]{11}$/, {
    message: 'Invalid YouTube video ID format',
  })
  videoId!: string;
}

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

export interface MetadataResponse {
  success: true;
  data: VideoMetadata;
  meta: {
    cached: boolean;
    cacheExpires?: string;
  };
}
