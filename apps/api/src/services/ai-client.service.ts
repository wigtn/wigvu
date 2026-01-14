import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance, AxiosError } from 'axios';

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

export interface AudioDownloadResponse {
  success: boolean;
  data: Buffer;
  audioDuration?: number;
}

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
      );

      this.onSuccess();
      return response.data;
    } catch (error) {
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
      );

      this.onSuccess();
      return response.data;
    } catch (error) {
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
   * Download audio from YouTube video via AI service
   */
  async downloadAudio(videoId: string): Promise<AudioDownloadResponse | null> {
    if (!this.isCircuitAvailable()) {
      this.logger.warn('Circuit breaker OPEN - skipping audio download');
      return null;
    }

    try {
      const response = await this.client.post(
        '/api/v1/audio/download',
        { videoId },
        {
          timeout: 60000, // 60 seconds for audio download
          responseType: 'arraybuffer',
        },
      );

      this.onSuccess();

      const audioDuration = response.headers['x-audio-duration']
        ? parseFloat(response.headers['x-audio-duration'])
        : undefined;

      return {
        success: true,
        data: Buffer.from(response.data),
        audioDuration,
      };
    } catch (error) {
      this.onFailure(error);
      return null;
    }
  }

  /**
   * Transcribe audio using STT via AI service
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

      const response = await this.client.post<SttResponse>(
        '/api/v1/stt',
        formData,
        {
          timeout: 120000, // 120 seconds for STT
          headers: {
            ...formData.getHeaders(),
            'X-Internal-API-Key': this.internalApiKey,
          },
        },
      );

      this.onSuccess();
      return response.data;
    } catch (error) {
      this.onFailure(error);
      return null;
    }
  }

  /**
   * Full STT pipeline: download audio and transcribe
   */
  async sttFromVideo(
    videoId: string,
    language = 'auto',
  ): Promise<SttResponse | null> {
    this.logger.log(`Starting STT pipeline for video: ${videoId}`);

    // Step 1: Download audio
    const audioResult = await this.downloadAudio(videoId);
    if (!audioResult?.success) {
      this.logger.warn(`Audio download failed for video: ${videoId}`);
      return null;
    }

    this.logger.debug(
      `Audio downloaded: ${audioResult.data.length} bytes, duration: ${audioResult.audioDuration}s`,
    );

    // Step 2: Transcribe audio
    const sttResult = await this.transcribe(audioResult.data, language);
    if (!sttResult?.success) {
      this.logger.warn(`STT failed for video: ${videoId}`);
      return null;
    }

    this.logger.log(
      `STT completed for ${videoId}: ${sttResult.data.segments.length} segments`,
    );
    return sttResult;
  }
}
