import { IsString, MinLength, MaxLength } from 'class-validator';

export class WordLookupDto {
  @IsString()
  @MinLength(1)
  @MaxLength(200)
  word: string;

  @IsString()
  @MinLength(1)
  sentence: string;
}
