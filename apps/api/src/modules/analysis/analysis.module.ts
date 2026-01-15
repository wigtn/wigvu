import { Module } from '@nestjs/common';
import { AnalysisController, AnalyzeController } from './analysis.controller';
import { AnalysisService } from './analysis.service';
import { YoutubeModule } from '../youtube/youtube.module';
import { TranscriptModule } from '../transcript/transcript.module';
import { AiClientModule } from '../../services/ai-client.module';

@Module({
  imports: [YoutubeModule, TranscriptModule, AiClientModule],
  controllers: [AnalysisController, AnalyzeController],
  providers: [AnalysisService],
})
export class AnalysisModule {}
