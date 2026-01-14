import { IsString, IsNotEmpty, IsOptional, IsBoolean, Matches } from 'class-validator';
import { Transform } from 'class-transformer';

export class GetTranscriptParamsDto {
  @IsString()
  @IsNotEmpty()
  @Matches(/^[a-zA-Z0-9_-]{11}$/, {
    message: 'Invalid YouTube video ID format',
  })
  videoId!: string;
}

export class GetTranscriptQueryDto {
  @IsOptional()
  @IsString()
  language?: string;

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  useStt?: boolean = true;
}

export interface TranscriptSegment {
  start: number;
  end: number;
  text: string;
}

export interface TranscriptData {
  source: 'youtube' | 'stt' | 'none';
  language: string;
  isKorean: boolean;
  segments: TranscriptSegment[];
}

export interface TranscriptResponse {
  success: true;
  data: TranscriptData;
  meta: {
    cached: boolean;
    segmentCount: number;
  };
}
