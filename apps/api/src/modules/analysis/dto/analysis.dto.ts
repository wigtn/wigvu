import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsUrl } from 'class-validator';
import { Transform } from 'class-transformer';

export class AnalyzeVideoDto {
  @IsString()
  @IsNotEmpty()
  url!: string;

  @IsOptional()
  @IsString()
  language?: string = 'auto';

  @IsOptional()
  @IsBoolean()
  @Transform(({ value }) => value === 'true' || value === true)
  skipTranslation?: boolean = false;
}

export interface Highlight {
  timestamp: number;
  title: string;
  description: string;
}

export interface TranscriptSegmentWithTranslation {
  start: number;
  end: number;
  text: string;
  originalText: string;
  translatedText: string;
}

export interface AnalysisResult {
  id: string;
  videoId: string;
  title: string;
  channelName: string;
  duration: number;
  viewCount: number;
  summary: string;
  watchScore: number;
  watchScoreReason: string;
  keywords: string[];
  highlights: Highlight[];
  transcriptSegments: TranscriptSegmentWithTranslation[];
  transcriptSource: 'youtube' | 'stt' | 'none';
  isKorean: boolean;
  isTranslated: boolean;
  analyzedAt: string;
}

export interface AnalysisResponse {
  success: true;
  data: AnalysisResult;
  meta: {
    requestId: string;
    processingTime: number;
    timestamp: string;
  };
}
