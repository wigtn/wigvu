import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { AiClientService } from '../../ai-client/ai-client.service';

export interface STTSegment {
  start: number;
  end: number;
  text: string;
}

export type TranscriptSource = 'youtube' | 'stt' | 'none';

export interface TranscriptResult {
  transcript: string | null;
  source: TranscriptSource;
  segments?: STTSegment[];
  detectedLanguage?: { code: string; probability: number };
  captionLanguage?: string;
  isKorean?: boolean;
}

function isKoreanCode(code: string): boolean {
  return ['ko', 'ko-KR'].includes(code);
}

function decodeHtmlEntities(text: string): string {
  return text
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&apos;/g, "'")
    .replace(/\n/g, ' ')
    .trim();
}

function parseYouTubeCaptionXml(xml: string): STTSegment[] {
  const segments: STTSegment[] = [];
  const textRegex =
    /<text start="([^"]+)" dur="([^"]+)"[^>]*>([^<]*)<\/text>/g;
  let match;

  while ((match = textRegex.exec(xml)) !== null) {
    const start = parseFloat(match[1]);
    const duration = parseFloat(match[2]);
    const text = decodeHtmlEntities(match[3].trim());

    if (text) {
      segments.push({ start, end: start + duration, text });
    }
  }

  return segments;
}

@Injectable()
export class YoutubeTranscriptService {
  private readonly logger = new Logger(YoutubeTranscriptService.name);
  private readonly sttMaxDurationMinutes: number;

  constructor(
    private readonly configService: ConfigService,
    private readonly aiClientService: AiClientService,
  ) {
    this.sttMaxDurationMinutes = this.configService.get<number>(
      'sttMaxDurationMinutes',
    )!;
  }

  async fetchTranscript(
    videoId: string,
    duration: number,
    language = 'auto',
  ): Promise<TranscriptResult> {
    this.logger.log(`Fetching transcript for ${videoId}`);

    // 1. Try YouTube captions
    const youtubeResult = await this.fetchYouTubeTranscript(videoId, language);

    if (youtubeResult.segments.length > 0) {
      const transcript = youtubeResult.segments
        .map((seg) => seg.text)
        .join(' ');

      this.logger.log(
        `YouTube captions found: ${youtubeResult.segments.length} segments`,
      );

      return {
        transcript,
        source: 'youtube',
        segments: youtubeResult.segments,
        captionLanguage: youtubeResult.language,
        isKorean: youtubeResult.isKorean,
        detectedLanguage: {
          code: youtubeResult.language,
          probability: 1.0,
        },
      };
    }

    // 2. STT fallback
    const maxDurationSeconds = this.sttMaxDurationMinutes * 60;
    if (duration > maxDurationSeconds) {
      this.logger.warn(`Video too long for STT: ${duration}s`);
      return { transcript: null, source: 'none' };
    }

    const sttResult = await this.fetchSTTFromAI(videoId, language);

    if (sttResult) {
      const transcript = sttResult.segments.map((seg) => seg.text).join(' ');

      this.logger.log(
        `STT fallback succeeded: ${sttResult.segments.length} segments`,
      );

      return {
        transcript,
        source: 'stt',
        segments: sttResult.segments,
        captionLanguage: sttResult.language,
        isKorean: sttResult.isKorean,
        detectedLanguage: {
          code: sttResult.language,
          probability: 1.0,
        },
      };
    }

    return { transcript: null, source: 'none' };
  }

  private async fetchYouTubeTranscript(
    videoId: string,
    language: string,
  ): Promise<{
    source: TranscriptSource;
    language: string;
    isKorean: boolean;
    segments: STTSegment[];
  }> {
    try {
      const videoPageUrl = `https://www.youtube.com/watch?v=${videoId}`;
      const pageResponse = await fetch(videoPageUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept-Language': 'en-US,en;q=0.9,ko;q=0.8',
        },
      });

      if (!pageResponse.ok) {
        return {
          source: 'none',
          language: 'unknown',
          isKorean: false,
          segments: [],
        };
      }

      const pageHtml = await pageResponse.text();

      const captionTracksMatch = pageHtml.match(
        /"captionTracks":\s*(\[.*?\])/,
      );

      if (!captionTracksMatch) {
        return {
          source: 'none',
          language: 'unknown',
          isKorean: false,
          segments: [],
        };
      }

      const captionTracks = JSON.parse(captionTracksMatch[1]) as Array<{
        baseUrl: string;
        languageCode: string;
      }>;

      let selectedTrack = captionTracks[0];
      const targetLang = language === 'auto' ? 'ko' : language;

      const targetTrack = captionTracks.find(
        (track) => track.languageCode === targetLang,
      );
      if (targetTrack) {
        selectedTrack = targetTrack;
      }

      const captionUrl = selectedTrack.baseUrl.replace(/\\u0026/g, '&');
      const captionResponse = await fetch(captionUrl);

      if (!captionResponse.ok) {
        return {
          source: 'none',
          language: 'unknown',
          isKorean: false,
          segments: [],
        };
      }

      const captionXml = await captionResponse.text();
      const segments = parseYouTubeCaptionXml(captionXml);
      const detectedLanguage = selectedTrack.languageCode;

      return {
        source: 'youtube',
        language: detectedLanguage,
        isKorean: isKoreanCode(detectedLanguage),
        segments,
      };
    } catch (error) {
      this.logger.error(
        `YouTube transcript extraction failed`,
        error instanceof Error ? error.message : 'Unknown error',
      );
      return {
        source: 'none',
        language: 'unknown',
        isKorean: false,
        segments: [],
      };
    }
  }

  private async fetchSTTFromAI(
    videoId: string,
    language: string,
  ): Promise<{
    source: TranscriptSource;
    language: string;
    isKorean: boolean;
    segments: STTSegment[];
  } | null> {
    try {
      const result = await this.aiClientService.transcribeVideo(videoId, {
        language,
      });

      if (!result.success || !result.data) {
        return null;
      }

      if (result.data.segments?.length > 0) {
        return {
          source: 'stt',
          language: result.data.language,
          isKorean: isKoreanCode(result.data.language),
          segments: result.data.segments.map((seg) => ({
            start: seg.start,
            end: seg.end,
            text: seg.text,
          })),
        };
      }

      return null;
    } catch (error) {
      this.logger.error('STT fallback failed', error);
      return null;
    }
  }
}
