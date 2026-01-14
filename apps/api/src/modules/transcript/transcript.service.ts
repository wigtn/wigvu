import { Injectable, Inject, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import { Cache } from 'cache-manager';
import axios from 'axios';
import { TranscriptData, TranscriptSegment } from './dto/transcript.dto';

interface YouTubeCaption {
  text: string;
  start: number;
  dur: number;
}

@Injectable()
export class TranscriptService {
  private readonly logger = new Logger(TranscriptService.name);
  private readonly cacheTtl: number;

  constructor(
    private configService: ConfigService,
    @Inject(CACHE_MANAGER) private cacheManager: Cache,
  ) {
    this.cacheTtl = this.configService.get<number>('cache.transcriptTtl') || 86400000;
  }

  async getTranscript(
    videoId: string,
    language?: string,
    useStt = true,
  ): Promise<{ data: TranscriptData; cached: boolean }> {
    const lang = language || 'auto';
    const cacheKey = `yt:transcript:${videoId}:${lang}`;

    // Check cache
    const cached = await this.cacheManager.get<TranscriptData>(cacheKey);
    if (cached) {
      this.logger.debug(`Cache hit for transcript: ${videoId}`);
      return { data: cached, cached: true };
    }

    // Try to fetch YouTube captions
    this.logger.debug(`Fetching transcript for video: ${videoId}`);
    const transcriptData = await this.fetchYouTubeTranscript(videoId, lang);

    if (transcriptData.source !== 'none') {
      // Store in cache
      await this.cacheManager.set(cacheKey, transcriptData, this.cacheTtl);
    }

    return { data: transcriptData, cached: false };
  }

  private async fetchYouTubeTranscript(
    videoId: string,
    language: string,
  ): Promise<TranscriptData> {
    try {
      // Fetch video page to get caption tracks
      const videoPageUrl = `https://www.youtube.com/watch?v=${videoId}`;
      const pageResponse = await axios.get(videoPageUrl, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36',
          'Accept-Language': 'en-US,en;q=0.9,ko;q=0.8',
        },
      });

      const pageHtml = pageResponse.data as string;

      // Extract caption tracks from player response
      const captionTracksMatch = pageHtml.match(
        /"captionTracks":\s*(\[.*?\])/,
      );

      if (!captionTracksMatch) {
        this.logger.debug(`No caption tracks found for video: ${videoId}`);
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
        name?: { simpleText?: string };
      }>;

      // Find the best caption track
      let selectedTrack = captionTracks[0];
      const targetLang = language === 'auto' ? 'ko' : language;

      // Try to find target language
      const targetTrack = captionTracks.find(
        (track) => track.languageCode === targetLang,
      );
      if (targetTrack) {
        selectedTrack = targetTrack;
      }

      // Fetch the caption XML
      const captionUrl = selectedTrack.baseUrl.replace(/\\u0026/g, '&');
      const captionResponse = await axios.get(captionUrl);
      const captionXml = captionResponse.data as string;

      // Parse the XML to extract segments
      const segments = this.parseYouTubeCaptionXml(captionXml);
      const detectedLanguage = selectedTrack.languageCode;

      return {
        source: 'youtube',
        language: detectedLanguage,
        isKorean: detectedLanguage === 'ko',
        segments,
      };
    } catch (error) {
      this.logger.error(
        `Failed to fetch YouTube transcript: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );
      return {
        source: 'none',
        language: 'unknown',
        isKorean: false,
        segments: [],
      };
    }
  }

  private parseYouTubeCaptionXml(xml: string): TranscriptSegment[] {
    const segments: TranscriptSegment[] = [];

    // Parse XML text elements
    const textRegex =
      /<text start="([^"]+)" dur="([^"]+)"[^>]*>([^<]*)<\/text>/g;
    let match;

    while ((match = textRegex.exec(xml)) !== null) {
      const start = parseFloat(match[1]);
      const duration = parseFloat(match[2]);
      const text = this.decodeHtmlEntities(match[3].trim());

      if (text) {
        segments.push({
          start,
          end: start + duration,
          text,
        });
      }
    }

    return segments;
  }

  private decodeHtmlEntities(text: string): string {
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
}
