import { Injectable, Logger } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance, AxiosError } from 'axios';
import {
  AudioTooLongException,
  TranscriptTooLongException,
} from '../common/exceptions/video.exceptions';

// Types for AI Service
export interface TranslationSegment {
  start: number;
  end: number;
  text: string;
}

export interface SttSegment {
  start: number;
  end: number;
  text: string;
}

export interface SttResponse {
  success: boolean;
  data: {
    text: string;
    language: string;
    languageProbability: number;
    segments: SttSegment[];
  };
  meta?: {
    audioDuration: number;
    processingTime: number;
  };
}

// AudioDownloadResponse removed - audio download not supported via API Gateway

export interface TranslatedSegment {
  start: number;
  end: number;
  originalText: string;
  translatedText: string;
}

export interface TranslationRequest {
  segments: TranslationSegment[];
  sourceLanguage?: string;
  targetLanguage?: string;
}

export interface TranslationResponse {
  success: boolean;
  data: {
    segments: TranslatedSegment[];
  };
  meta: {
    translatedCount: number;
    processingTime: number;
  };
}

export interface AnalysisRequest {
  metadata: {
    title: string;
    channelName: string;
    description: string;
  };
  transcript?: string;
  segments?: TranslationSegment[];
}

export interface AnalysisResponse {
  success: boolean;
  data: {
    summary: string;
    watchScore: number;
    watchScoreReason: string;
    keywords: string[];
    highlights: Array<{
      timestamp: number;
      title: string;
      description: string;
    }>;
  };
}

// Circuit Breaker State
enum CircuitState {
  CLOSED = 'CLOSED',
  OPEN = 'OPEN',
  HALF_OPEN = 'HALF_OPEN',
}

@Injectable()
export class AiClientService {
  private readonly logger = new Logger(AiClientService.name);
  private readonly client: AxiosInstance;
  private readonly internalApiKey: string;

  // Circuit Breaker State
  private circuitState: CircuitState = CircuitState.CLOSED;
  private failureCount = 0;
  private lastFailureTime = 0;
  private halfOpenSuccessCount = 0;

  // Circuit Breaker Config
  private readonly failureThreshold: number;
  private readonly recoveryTimeout: number;
  private readonly halfOpenRequests: number;

  constructor(private configService: ConfigService) {
    const aiConfig = this.configService.get('ai');
    const circuitConfig = this.configService.get('circuitBreaker');

    this.internalApiKey = aiConfig?.internalApiKey || '';
    this.failureThreshold = circuitConfig?.failureThreshold || 5;
    this.recoveryTimeout = circuitConfig?.recoveryTimeout || 30000;
    this.halfOpenRequests = circuitConfig?.halfOpenRequests || 3;

    this.client = axios.create({
      baseURL: aiConfig?.serviceUrl || 'http://localhost:5000',
      timeout: aiConfig?.timeout || 30000,
      headers: {
        'Content-Type': 'application/json',
        'X-Internal-API-Key': this.internalApiKey,
      },
    });
  }

  async translate(request: TranslationRequest): Promise<TranslationResponse | null> {
    if (!this.isCircuitAvailable()) {
      this.logger.warn('Circuit breaker OPEN - skipping translation');
      return null;
    }

    try {
      const response = await this.client.post<TranslationResponse>(
        '/api/v1/translate',
        request,
        { timeout: 300000 }, // 5 minutes for long transcripts
      );

      this.onSuccess();
      return response.data;
    } catch (error) {
      // TRANSCRIPT_TOO_LONG 에러 시 exception throw
      if (error instanceof AxiosError && error.response) {
        const data = error.response.data as {
          success?: boolean;
          error?: { code?: string; message?: string; details?: Record<string, unknown> };
        };

        if (data?.error?.code === 'TRANSCRIPT_TOO_LONG') {
          throw new TranscriptTooLongException(
            data.error.message,
            data.error.details,
          );
        }
      }

      this.onFailure(error);
      return null;
    }
  }

  async analyze(request: AnalysisRequest): Promise<AnalysisResponse | null> {
    if (!this.isCircuitAvailable()) {
      this.logger.warn('Circuit breaker OPEN - skipping analysis');
      return null;
    }

    try {
      const response = await this.client.post<AnalysisResponse>(
        '/api/v1/analyze',
        request,
        { timeout: 120000 }, // 2 minutes for AI analysis
      );

      this.onSuccess();
      return response.data;
    } catch (error) {
      // TRANSCRIPT_TOO_LONG 에러 시 exception throw
      if (error instanceof AxiosError && error.response) {
        const data = error.response.data as {
          success?: boolean;
          error?: { code?: string; message?: string; details?: Record<string, unknown> };
        };

        if (data?.error?.code === 'TRANSCRIPT_TOO_LONG') {
          throw new TranscriptTooLongException(
            data.error.message,
            data.error.details,
          );
        }
      }

      this.onFailure(error);
      return null;
    }
  }

  async healthCheck(): Promise<boolean> {
    try {
      const response = await this.client.get('/health', { timeout: 5000 });
      return response.status === 200;
    } catch {
      return false;
    }
  }

  // Circuit Breaker Methods
  private isCircuitAvailable(): boolean {
    switch (this.circuitState) {
      case CircuitState.CLOSED:
        return true;

      case CircuitState.OPEN:
        // Check if recovery timeout has passed
        if (Date.now() - this.lastFailureTime >= this.recoveryTimeout) {
          this.transitionTo(CircuitState.HALF_OPEN);
          return true;
        }
        return false;

      case CircuitState.HALF_OPEN:
        // Allow limited requests in half-open state
        return this.halfOpenSuccessCount < this.halfOpenRequests;
    }
  }

  private onSuccess(): void {
    if (this.circuitState === CircuitState.HALF_OPEN) {
      this.halfOpenSuccessCount++;
      if (this.halfOpenSuccessCount >= this.halfOpenRequests) {
        this.transitionTo(CircuitState.CLOSED);
      }
    } else {
      this.failureCount = 0;
    }
  }

  private onFailure(error: unknown): void {
    const errorMessage =
      error instanceof AxiosError
        ? `${error.code}: ${error.message}`
        : 'Unknown error';

    this.logger.error(`AI service call failed: ${errorMessage}`);
    this.failureCount++;
    this.lastFailureTime = Date.now();

    if (
      this.circuitState === CircuitState.HALF_OPEN ||
      this.failureCount >= this.failureThreshold
    ) {
      this.transitionTo(CircuitState.OPEN);
    }
  }

  private transitionTo(state: CircuitState): void {
    this.logger.log(
      `Circuit breaker transition: ${this.circuitState} -> ${state}`,
    );
    this.circuitState = state;

    if (state === CircuitState.CLOSED) {
      this.failureCount = 0;
      this.halfOpenSuccessCount = 0;
    } else if (state === CircuitState.HALF_OPEN) {
      this.halfOpenSuccessCount = 0;
    }
  }

  getCircuitState(): string {
    return this.circuitState;
  }

  /**
   * Transcribe audio using STT via AI service
   * Calls /stt/transcribe endpoint (or legacy /whisperX/transcribe)
   */
  async transcribe(
    audioBuffer: Buffer,
    language = 'auto',
  ): Promise<SttResponse | null> {
    if (!this.isCircuitAvailable()) {
      this.logger.warn('Circuit breaker OPEN - skipping STT');
      return null;
    }

    try {
      // Create form data for multipart upload
      const FormData = (await import('form-data')).default;
      const formData = new FormData();
      formData.append('audio', audioBuffer, {
        filename: 'audio.webm',
        contentType: 'audio/webm',
      });
      formData.append('language', language);

      // Use /stt/transcribe endpoint (ai server)
      const response = await this.client.post<{
        text: string;
        language: string;
        language_probability: number;
        segments: Array<{ start: number; end: number; text: string }>;
      }>(
        '/stt/transcribe',
        formData,
        {
          timeout: 300000, // 5 minutes for STT
          headers: {
            ...formData.getHeaders(),
            'X-Internal-API-Key': this.internalApiKey,
          },
        },
      );

      this.onSuccess();

      // Transform response to SttResponse format
      return {
        success: true,
        data: {
          text: response.data.text,
          language: response.data.language,
          languageProbability: response.data.language_probability,
          segments: response.data.segments,
        },
      };
    } catch (error) {
      this.onFailure(error);
      return null;
    }
  }

  /**
   * Download audio from YouTube video and transcribe using STT
   * Uses AI service's /stt/video endpoint which handles download via yt-dlp
   * @param videoId YouTube video ID
   * @param language Language hint for STT
   * @returns STT response with transcription
   */
  async sttFromVideo(
    videoId: string,
    language = 'auto',
  ): Promise<SttResponse | null> {
    if (!this.isCircuitAvailable()) {
      this.logger.warn('Circuit breaker OPEN - skipping STT from video');
      return null;
    }

    try {
      this.logger.log(`Starting STT from video: ${videoId}`);

      // Call AI service's /stt/video endpoint
      // This endpoint downloads audio using yt-dlp and transcribes
      const response = await this.client.post<{
        text: string;
        language: string;
        language_probability: number;
        segments: Array<{ start: number; end: number; text: string }>;
      }>(
        `/stt/video/${videoId}`,
        null,
        {
          timeout: 600000, // 10 minutes for download + STT
          params: { language },
          headers: {
            'X-Internal-API-Key': this.internalApiKey,
          },
        },
      );

      this.onSuccess();

      this.logger.log(
        `STT completed for ${videoId}: ${response.data.segments.length} segments`,
      );

      // Transform response to SttResponse format
      return {
        success: true,
        data: {
          text: response.data.text,
          language: response.data.language,
          languageProbability: response.data.language_probability,
          segments: response.data.segments,
        },
      };
    } catch (error) {
      this.logger.error(
        `STT from video failed for ${videoId}: ${error instanceof Error ? error.message : 'Unknown error'}`,
      );

      // 422 에러 (AUDIO_TOO_LONG) 시 exception throw
      if (error instanceof AxiosError && error.response) {
        const status = error.response.status;
        const data = error.response.data as {
          // Standard format
          success?: boolean;
          error?: { code?: string; message?: string; details?: Record<string, unknown> } | string;
          // Flat format (STT endpoints)
          message?: string;
        };

        // 에러 코드와 메시지 추출 (두 가지 형식 모두 지원)
        let errorCode: string | undefined;
        let errorMessage: string | undefined;
        let errorDetails: Record<string, unknown> | undefined;

        if (typeof data?.error === 'object' && data.error?.code) {
          // Standard format: { success: false, error: { code, message } }
          errorCode = data.error.code;
          errorMessage = data.error.message;
          errorDetails = data.error.details;
        } else if (typeof data?.error === 'string') {
          // Flat format: { error: "CODE", message: "..." }
          errorCode = data.error;
          errorMessage = data.message;
        }

        this.logger.warn(
          `STT error response: status=${status}, code=${errorCode}, message=${errorMessage}`,
        );

        // AUDIO_TOO_LONG 에러
        if (status === 422 || errorCode === 'AUDIO_TOO_LONG') {
          throw new AudioTooLongException(errorMessage, errorDetails);
        }

        // TRANSCRIPT_TOO_LONG 에러
        if (errorCode === 'TRANSCRIPT_TOO_LONG') {
          throw new TranscriptTooLongException(errorMessage, errorDetails);
        }
      }

      this.onFailure(error);
      return null;
    }
  }
}
