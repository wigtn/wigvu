import { Injectable, Logger } from '@nestjs/common';
import { AiClientService } from '../../ai-client/ai-client.service';

@Injectable()
export class LookupWordUseCase {
  private readonly logger = new Logger(LookupWordUseCase.name);

  constructor(private readonly aiClientService: AiClientService) {}

  async execute(word: string, sentence: string) {
    const result = await this.aiClientService.lookupWord({ word, sentence });

    if (!result.success || !result.data) {
      return {
        success: false,
        error: result.error || {
          code: 'ANALYSIS_FAILED',
          message: 'Word lookup failed',
        },
      };
    }

    return { success: true, data: result.data };
  }
}
