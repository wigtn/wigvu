import { Injectable, Logger, ServiceUnavailableException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import axios, { AxiosInstance, AxiosError } from 'axios';

// Types for AI Service
export interface TranslationSegment {
  start: number;
  end: number;
  text: string;
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
}
