import { Injectable, Logger, BadRequestException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { v4 as uuidv4 } from 'uuid';
import { YoutubeService } from '../youtube/youtube.service';
import { TranscriptService } from '../transcript/transcript.service';
import { AiClientService } from '../../services/ai-client.service';
import {
  AnalysisResult,
  AnalysisWarning,
  TranscriptSegmentWithTranslation,
} from './dto/analysis.dto';
import { TranscriptSegment } from '../transcript/dto/transcript.dto';
import {
  VideoTooLongException,
  NoTranscriptException,
} from '../../common/exceptions/video.exceptions';

@Injectable()
export class AnalysisService {
  private readonly logger = new Logger(AnalysisService.name);
  private readonly sttMaxDurationMinutes: number;
  private readonly maxVideoDurationMinutes: number;

  constructor(
    private readonly youtubeService: YoutubeService,
    private readonly transcriptService: TranscriptService,
    private readonly aiClientService: AiClientService,
    private readonly configService: ConfigService,
  ) {
    this.sttMaxDurationMinutes = this.configService.get<number>('stt.maxDurationMinutes') || 30;
    // 절대 최대 영상 길이 (기본 60분)
    this.maxVideoDurationMinutes = this.configService.get<number>('analysis.maxVideoDurationMinutes') || 60;
  }

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

    // Track warnings
    const warnings: AnalysisWarning[] = [];
    const videoDurationMinutes = metadata.duration / 60;

    // Check absolute max duration
    if (videoDurationMinutes > this.maxVideoDurationMinutes) {
      throw new VideoTooLongException(videoDurationMinutes, this.maxVideoDurationMinutes);
    }

    // Warn if video is long (but within limit)
    if (videoDurationMinutes > this.sttMaxDurationMinutes) {
      warnings.push({
        code: 'LONG_VIDEO',
        message: `영상 길이(${Math.round(videoDurationMinutes)}분)가 ${this.sttMaxDurationMinutes}분을 초과하여 YouTube 자막만 사용됩니다. 처리 시간이 다소 길어질 수 있습니다.`,
      });
      this.logger.warn(`Long video detected: ${videoDurationMinutes.toFixed(1)} minutes`);
    }

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

    // Check if transcript is available
    if (transcript.segments.length === 0) {
      if (transcript.source === 'none') {
        throw new NoTranscriptException(
          videoId,
          '이 영상에서 자막을 찾을 수 없습니다. YouTube 자막이 없고 음성 인식도 불가능합니다.',
        );
      }
      warnings.push({
        code: 'NO_TRANSCRIPT',
        message: '자막을 추출할 수 없어 메타데이터 기반으로만 분석됩니다.',
      });
    }

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
      ...(warnings.length > 0 && { warnings }),
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
