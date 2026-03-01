import { Module } from '@nestjs/common';
import { ArticleController } from './article.controller';
import { AnalyzeArticleUseCase } from './use-cases/analyze-article.use-case';
import { ParseSentenceUseCase } from './use-cases/parse-sentence.use-case';
import { LookupWordUseCase } from './use-cases/lookup-word.use-case';
import { WebCrawlerService } from './services/web-crawler.service';
import { AiClientModule } from '../ai-client/ai-client.module';

@Module({
  imports: [AiClientModule],
  controllers: [ArticleController],
  providers: [
    AnalyzeArticleUseCase,
    ParseSentenceUseCase,
    LookupWordUseCase,
    WebCrawlerService,
  ],
})
export class ArticleModule {}
