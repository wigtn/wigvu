import { Module, Global } from '@nestjs/common';
import { AiClientService } from './ai-client.service';
import { AudioDownloadService } from './audio-download.service';

@Global()
@Module({
  providers: [AiClientService, AudioDownloadService],
  exports: [AiClientService, AudioDownloadService],
})
export class AiClientModule {}
