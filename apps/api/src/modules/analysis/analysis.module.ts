import { Module } from '@nestjs/common';
import { AnalysisController } from './analysis.controller';
import { AnalysisService } from './analysis.service';
import { YoutubeModule } from '../youtube/youtube.module';
import { TranscriptModule } from '../transcript/transcript.module';

@Module({
  imports: [YoutubeModule, TranscriptModule],
  controllers: [AnalysisController],
  providers: [AnalysisService],
})
export class AnalysisModule {}
