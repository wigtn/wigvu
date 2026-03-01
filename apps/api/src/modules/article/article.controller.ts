import { Controller, Post, Body, Res, Logger, HttpStatus } from '@nestjs/common';
import { Response } from 'express';
import { AnalyzeArticleDto } from './dto/analyze-article.dto';
import { ParseSentenceDto } from './dto/parse-sentence.dto';
import { WordLookupDto } from './dto/word-lookup.dto';
import { AnalyzeArticleUseCase } from './use-cases/analyze-article.use-case';
import { ParseSentenceUseCase } from './use-cases/parse-sentence.use-case';
import { LookupWordUseCase } from './use-cases/lookup-word.use-case';

@Controller('api/v1/article')
export class ArticleController {
  private readonly logger = new Logger(ArticleController.name);

  constructor(
    private readonly analyzeArticleUseCase: AnalyzeArticleUseCase,
    private readonly parseSentenceUseCase: ParseSentenceUseCase,
    private readonly lookupWordUseCase: LookupWordUseCase,
  ) {}

  @Post('analyze')
  async analyze(@Body() dto: AnalyzeArticleDto, @Res() res: Response) {
    if (!dto.url && !dto.text) {
      res.status(HttpStatus.BAD_REQUEST).json({
        success: false,
        error: {
          code: 'INPUT_REQUIRED',
          message: 'Please enter a URL or text',
        },
      });
      return;
    }

    res.setHeader('Content-Type', 'text/event-stream');
    res.setHeader('Cache-Control', 'no-cache');
    res.setHeader('Connection', 'keep-alive');
    res.flushHeaders();

    try {
      for await (const event of this.analyzeArticleUseCase.execute(
        dto.url,
        dto.text,
        dto.title,
      )) {
        const data = `data: ${JSON.stringify(event)}\n\n`;
        const canWrite = res.write(data);
        if (!canWrite) break;
      }
    } catch (error) {
      this.logger.error('Article analysis stream error', error);
      const errorEvent = {
        type: 'error',
        code: 'INTERNAL_ERROR',
        message: 'An error occurred during analysis',
      };
      res.write(`data: ${JSON.stringify(errorEvent)}\n\n`);
    }

    res.end();
  }

  @Post('parse-sentence')
  async parseSentence(@Body() dto: ParseSentenceDto) {
    return this.parseSentenceUseCase.execute(dto.sentence, dto.context);
  }

  @Post('word-lookup')
  async wordLookup(@Body() dto: WordLookupDto) {
    return this.lookupWordUseCase.execute(dto.word, dto.sentence);
  }
}
