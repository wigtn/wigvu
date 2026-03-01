import { Injectable, Logger } from '@nestjs/common';
import { AiClientService } from '../../ai-client/ai-client.service';

@Injectable()
export class ParseSentenceUseCase {
  private readonly logger = new Logger(ParseSentenceUseCase.name);

  constructor(private readonly aiClientService: AiClientService) {}

  async execute(sentence: string, context?: string) {
    const result = await this.aiClientService.parseSentence({
      sentence,
      context: context || undefined,
    });

    if (!result.success || !result.data) {
      return {
        success: false,
        error: result.error || {
          code: 'ANALYSIS_FAILED',
          message: 'Sentence parsing failed',
        },
      };
    }

    return { success: true, data: result.data };
  }
}
