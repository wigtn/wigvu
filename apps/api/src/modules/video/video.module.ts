import { Module } from '@nestjs/common';
import { VideoController } from './video.controller';
import { AnalyzeVideoUseCase } from './use-cases/analyze-video.use-case';
import { YoutubeMetadataService } from './services/youtube-metadata.service';
import { YoutubeTranscriptService } from './services/youtube-transcript.service';
import { VideoAnalysisService } from './services/video-analysis.service';
import { AiClientModule } from '../ai-client/ai-client.module';

@Module({
  imports: [AiClientModule],
  controllers: [VideoController],
  providers: [
    AnalyzeVideoUseCase,
    YoutubeMetadataService,
    YoutubeTranscriptService,
    VideoAnalysisService,
  ],
})
export class VideoModule {}
