import { IsString, IsOptional, IsUrl, MaxLength, MinLength } from 'class-validator';

export class AnalyzeArticleDto {
  @IsUrl({}, { message: 'Please enter a valid URL' })
  @IsOptional()
  url?: string;

  @IsString()
  @MinLength(1)
  @MaxLength(15000)
  @IsOptional()
  text?: string;

  @IsString()
  @IsOptional()
  title?: string;
}
