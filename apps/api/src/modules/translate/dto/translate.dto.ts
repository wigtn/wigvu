import { IsArray, IsString, IsNumber, IsOptional, ValidateNested, Min } from 'class-validator';
import { Type } from 'class-transformer';

export class TranslationSegmentDto {
  @IsNumber()
  @Min(0)
  start!: number;

  @IsNumber()
  @Min(0)
  end!: number;

  @IsString()
  text!: string;
}

export class TranslateRequestDto {
  @IsArray()
  @ValidateNested({ each: true })
  @Type(() => TranslationSegmentDto)
  segments!: TranslationSegmentDto[];

  @IsOptional()
  @IsString()
  sourceLanguage?: string;

  @IsOptional()
  @IsString()
  targetLanguage?: string;
}

export interface TranslatedSegment {
  start: number;
  end: number;
  originalText: string;
  translatedText: string;
}

export interface TranslateResponse {
  success: boolean;
  data: {
    segments: TranslatedSegment[];
  };
  meta: {
    translatedCount: number;
    processingTime: number;
  };
}
