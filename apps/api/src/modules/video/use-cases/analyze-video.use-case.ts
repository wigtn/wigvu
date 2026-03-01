import { Injectable, Logger } from '@nestjs/common';
import { YoutubeMetadataService } from '../services/youtube-metadata.service';
import {
  YoutubeTranscriptService,
  STTSegment,
} from '../services/youtube-transcript.service';
import { VideoAnalysisService } from '../services/video-analysis.service';

export type AnalysisStep =
  | 'metadata'
  | 'transcript'
  | 'translation'
  | 'analysis'
  | 'complete';

export type SSEEvent =
  | {
      type: 'step';
      step: AnalysisStep;
      status: 'start' | 'done';
      message: string;
    }
  | { type: 'progress'; step: AnalysisStep; progress: number; message: string }
  | { type: 'result'; data: unknown }
  | { type: 'error'; code: string; message: string };

interface TranscriptSegment extends STTSegment {
  originalText?: string;
  translatedText?: string;
}

function needsTranslation(languageCode: string): boolean {
  return !['ko', 'ko-KR'].includes(languageCode);
}

@Injectable()
export class AnalyzeVideoUseCase {
  private readonly logger = new Logger(AnalyzeVideoUseCase.name);

  constructor(
    private readonly youtubeMetadataService: YoutubeMetadataService,
    private readonly youtubeTranscriptService: YoutubeTranscriptService,
    private readonly videoAnalysisService: VideoAnalysisService,
  ) {}

  async *execute(
    url: string,
    videoId: string,
    language: string,
  ): AsyncGenerator<SSEEvent> {
    // Step 1: Metadata
    yield {
      type: 'step',
      step: 'metadata',
      status: 'start',
      message: 'Fetching video info...',
    };

    let metadata;
    try {
      metadata = await this.youtubeMetadataService.fetchMetadata(videoId);
    } catch (error) {
      if (error instanceof Error && error.message === 'VIDEO_NOT_FOUND') {
        yield {
          type: 'error',
          code: 'VIDEO_NOT_FOUND',
          message: 'Video not found',
        };
        return;
      }
      throw error;
    }

    yield {
      type: 'step',
      step: 'metadata',
      status: 'done',
      message: `Video info loaded: "${metadata.title}"`,
    };

    // Step 2: Transcript
    yield {
      type: 'step',
      step: 'transcript',
      status: 'start',
      message: 'Extracting subtitles...',
    };

    const transcriptResult = await this.youtubeTranscriptService.fetchTranscript(
      videoId,
      metadata.duration,
      language,
    );

    const {
      transcript,
      source: transcriptSource,
      segments,
      detectedLanguage,
      isKorean,
    } = transcriptResult;

    const transcriptMessage =
      transcriptSource === 'stt'
        ? 'Subtitles extracted via speech recognition'
        : transcriptSource === 'youtube'
          ? 'YouTube subtitles extracted'
          : 'No subtitles found';

    yield {
      type: 'step',
      step: 'transcript',
      status: 'done',
      message: transcriptMessage,
    };

    // Step 3: Translation
    let translatedSegments: TranscriptSegment[] | undefined;

    if (segments && segments.length > 0) {
      const languageCode = detectedLanguage?.code || 'en';

      if (!isKorean && needsTranslation(languageCode)) {
        const languageNames: Record<string, string> = {
          en: 'English',
          ja: 'Japanese',
          zh: 'Chinese',
          es: 'Spanish',
          fr: 'French',
          de: 'German',
          ko: 'Korean',
        };
        const languageName = languageNames[languageCode] || 'Foreign';

        yield {
          type: 'step',
          step: 'translation',
          status: 'start',
          message: `Translating ${languageName} → Korean...`,
        };

        try {
          const translated =
            await this.videoAnalysisService.translateSegments(segments);

          translatedSegments = translated.map((seg) => ({
            start: seg.start,
            end: seg.end,
            text: seg.translated_text,
            originalText: seg.original_text,
            translatedText: seg.translated_text,
          }));

          yield {
            type: 'step',
            step: 'translation',
            status: 'done',
            message: `${translatedSegments.length} subtitles translated`,
          };
        } catch (error) {
          this.logger.error('Translation failed, using original', error);
          translatedSegments = segments.map((seg) => ({
            ...seg,
            originalText: seg.text,
            translatedText: seg.text,
          }));

          yield {
            type: 'step',
            step: 'translation',
            status: 'done',
            message: 'Translation failed, using original subtitles',
          };
        }
      } else {
        translatedSegments = segments.map((seg) => ({
          ...seg,
          originalText: seg.text,
          translatedText: seg.text,
        }));
      }
    }

    // Step 4: AI Analysis
    yield {
      type: 'step',
      step: 'analysis',
      status: 'start',
      message: 'AI is analyzing the video...',
    };

    const analysisTranscript = translatedSegments
      ? translatedSegments.map((seg) => seg.translatedText).join(' ')
      : transcript;

    const analysis = await this.videoAnalysisService.analyze(
      {
        title: metadata.title,
        channelName: metadata.channelName,
        description: metadata.description,
      },
      analysisTranscript ?? null,
      translatedSegments || segments,
    );

    yield {
      type: 'step',
      step: 'analysis',
      status: 'done',
      message: 'AI analysis complete',
    };

    // Step 5: Complete
    const result = {
      id: crypto.randomUUID(),
      url,
      ...metadata,
      ...analysis,
      language,
      transcriptSource,
      detectedLanguage: detectedLanguage || undefined,
      transcript: transcript || undefined,
      transcriptSegments: translatedSegments || segments || undefined,
      isKorean: isKorean || false,
      analyzedAt: new Date().toISOString(),
    };

    yield {
      type: 'step',
      step: 'complete',
      status: 'done',
      message: 'Analysis complete!',
    };

    yield { type: 'result', data: result };
  }
}
