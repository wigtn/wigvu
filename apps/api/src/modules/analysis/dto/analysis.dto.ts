import { IsString, IsNotEmpty, IsOptional, IsBoolean, IsUrl, IsArray, IsNumber, ValidateNested, Min } from 'class-validator';
import { Transform, Type } from 'class-transformer';

/** AI 분석 직접 요청용 DTO (메타데이터 + 자막 기반) */
export class AnalyzeMetadataDto {
  @IsString()
  title!: string;

  @IsString()
  channelName!: string;

  @IsOptional()
  @IsString()
  description?: string;
}

export class AnalyzeSegmentDto {
  @IsNumber()
  @Min(0)
  start!: number;

  @IsNumber()
  @Min(0)
  end!: number;

  @IsString()
  text!: string;
}

export class AnalyzeDirectDto {
  @ValidateNested()
  @Type(() => AnalyzeMetadataDto)
  metadata!: AnalyzeMetadataDto;

  @IsOptional()
  @IsString()
  transcript?: string;

  @IsOptional()
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => AnalyzeSegmentDto)
  segments?: AnalyzeSegmentDto[];
}

export interface AnalyzeDirectResponse {
  success: boolean;
  data?: {
    summary: string;
    watchScore: number;
    watchScoreReason: string;
    keywords: string[];
    highlights: Array<{
      timestamp: number;
      title: string;
      description: string;
    }>;
  };
  error?: {
    code: string;
    message: string;
  };
}

/** URL 기반 전체 파이프라인 DTO */
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
