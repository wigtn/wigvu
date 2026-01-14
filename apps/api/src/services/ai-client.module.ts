import { Module, Global } from '@nestjs/common';
import { AiClientService } from './ai-client.service';

@Global()
@Module({
  providers: [AiClientService],
  exports: [AiClientService],
})
export class AiClientModule {}
