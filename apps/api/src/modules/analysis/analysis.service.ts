import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { v4 as uuidv4 } from 'uuid';
import { YoutubeService } from '../youtube/youtube.service';
import { TranscriptService } from '../transcript/transcript.service';
import { AiClientService } from '../../services/ai-client.service';
import {
  AnalysisResult,
  TranscriptSegmentWithTranslation,
} from './dto/analysis.dto';
import { TranscriptSegment } from '../transcript/dto/transcript.dto';

@Injectable()
export class AnalysisService {
  private readonly logger = new Logger(AnalysisService.name);

  constructor(
    private readonly youtubeService: YoutubeService,
    private readonly transcriptService: TranscriptService,
    private readonly aiClientService: AiClientService,
  ) {}

  async analyzeVideo(
    url: string,
    language = 'auto',
    skipTranslation = false,
  ): Promise<AnalysisResult> {
    const startTime = Date.now();
    const analysisId = uuidv4();

    // Extract video ID
    const videoId = this.youtubeService.extractVideoId(url);
    if (!videoId) {
      throw new BadRequestException({
        code: 'INVALID_URL',
        message: 'Invalid YouTube URL format',
      });
    }

    this.logger.log(`Starting analysis for video: ${videoId}`);

    // Step 1: Fetch metadata
    const { data: metadata } = await this.youtubeService.getMetadata(videoId);
    this.logger.debug(`Metadata fetched for: ${metadata.title}`);

    // Step 2: Fetch transcript (with STT fallback if needed)
    const { data: transcript } = await this.transcriptService.getTranscript(
      videoId,
      language,
      true,
      metadata.duration, // Pass video duration for STT limit check
    );
    this.logger.debug(
      `Transcript fetched: ${transcript.segments.length} segments`,
    );

    // Step 3: Translate if needed
    let translatedSegments: TranscriptSegmentWithTranslation[] = [];
    let isTranslated = false;

    if (
      !skipTranslation &&
      !transcript.isKorean &&
      transcript.segments.length > 0
    ) {
      const translationResult = await this.aiClientService.translate({
        segments: transcript.segments,
        sourceLanguage: transcript.language,
        targetLanguage: 'ko',
      });

      if (translationResult?.success) {
        translatedSegments = translationResult.data.segments.map((seg) => ({
          start: seg.start,
          end: seg.end,
          text: seg.translatedText,
          originalText: seg.originalText,
          translatedText: seg.translatedText,
        }));
        isTranslated = true;
        this.logger.debug(`Translation completed: ${translatedSegments.length} segments`);
      } else {
        // Fallback: use original segments
        translatedSegments = transcript.segments.map((seg) => ({
          ...seg,
          originalText: seg.text,
          translatedText: seg.text,
        }));
        this.logger.warn('Translation failed, using original segments');
      }
    } else {
      // Korean content or skip translation
      translatedSegments = transcript.segments.map((seg) => ({
        ...seg,
        originalText: seg.text,
        translatedText: seg.text,
      }));
    }

    // Step 4: AI Analysis
    const transcriptText = translatedSegments
      .map((seg) => seg.translatedText)
      .join(' ')
      .substring(0, 50000);

    const analysisResult = await this.aiClientService.analyze({
      metadata: {
        title: metadata.title,
        channelName: metadata.channelName,
        description: metadata.description,
      },
      transcript: transcriptText,
      segments: translatedSegments.map((seg) => ({
        start: seg.start,
        end: seg.end,
        text: seg.translatedText,
      })),
    });

    // Prepare result with fallback
    const result: AnalysisResult = {
      id: analysisId,
      videoId,
      title: metadata.title,
      channelName: metadata.channelName,
      duration: metadata.duration,
      viewCount: metadata.viewCount,
      summary:
        analysisResult?.data?.summary ||
        this.generateFallbackSummary(metadata.title),
      watchScore: analysisResult?.data?.watchScore || 5,
      watchScoreReason:
        analysisResult?.data?.watchScoreReason ||
        'AI 분석을 수행할 수 없어 기본 점수가 적용되었습니다.',
      keywords: analysisResult?.data?.keywords || [],
      highlights: analysisResult?.data?.highlights || [],
      transcriptSegments: translatedSegments,
      transcriptSource: transcript.source,
      isKorean: transcript.isKorean,
      isTranslated,
      analyzedAt: new Date().toISOString(),
    };

    const processingTime = Date.now() - startTime;
    this.logger.log(
      `Analysis completed for ${videoId} in ${processingTime}ms`,
    );

    return result;
  }

  private generateFallbackSummary(title: string): string {
    return `"${title}" 영상에 대한 AI 분석이 현재 불가능합니다. 자막과 메타데이터는 정상적으로 추출되었습니다.`;
  }
}
