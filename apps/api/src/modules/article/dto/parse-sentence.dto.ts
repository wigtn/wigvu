import { IsString, IsOptional, MinLength, MaxLength } from 'class-validator';

export class ParseSentenceDto {
  @IsString()
  @MinLength(1)
  @MaxLength(2000)
  sentence: string;

  @IsString()
  @IsOptional()
  context?: string;
}
