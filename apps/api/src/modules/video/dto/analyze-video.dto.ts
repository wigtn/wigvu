import { IsString, IsOptional, MinLength } from 'class-validator';

export class AnalyzeVideoDto {
  @IsString()
  @MinLength(1, { message: 'Please enter a URL' })
  url: string;

  @IsString()
  @IsOptional()
  language?: string = 'auto';
}
