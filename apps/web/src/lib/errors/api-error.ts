/**
 * API 에러 처리 유틸리티
 */

import {
  ErrorCode,
  ErrorInfo,
  getErrorInfo,
  getErrorInfoByStatus,
  ERROR_CODES,
} from './error-codes';

/**
 * API 에러 클래스
 * 백엔드 에러를 프론트엔드에서 일관되게 처리하기 위한 커스텀 에러
 */
export class ApiError extends Error {
  public readonly code: ErrorCode;
  public readonly userMessage: string;
  public readonly technicalMessage: string;
  public readonly shouldRedirect: boolean;
  public readonly retryable: boolean;
  public readonly retryAfter?: number;
  public readonly statusCode?: number;
  public readonly details?: Record<string, unknown>;

  constructor(
    errorInfo: ErrorInfo,
    options?: {
      statusCode?: number;
      details?: Record<string, unknown>;
      originalMessage?: string;
    }
  ) {
    // 백엔드에서 전달한 구체적인 메시지가 있으면 그것을 사용
    const userMsg = options?.originalMessage || errorInfo.userMessage;
    super(userMsg);
    this.name = 'ApiError';
    this.code = errorInfo.code;
    this.userMessage = userMsg;
    this.technicalMessage = errorInfo.technicalMessage;
    this.shouldRedirect = errorInfo.shouldRedirect;
    this.retryable = errorInfo.retryable;
    this.retryAfter = errorInfo.retryAfter;
    this.statusCode = options?.statusCode;
    this.details = options?.details;
  }

  /**
   * 에러 코드로 ApiError 생성
   */
  static fromCode(code: string, options?: {
    statusCode?: number;
    details?: Record<string, unknown>;
    originalMessage?: string;
  }): ApiError {
    const errorInfo = getErrorInfo(code);
    return new ApiError(errorInfo, options);
  }

  /**
   * HTTP 상태 코드로 ApiError 생성
   */
  static fromStatus(statusCode: number, options?: {
    details?: Record<string, unknown>;
    originalMessage?: string;
  }): ApiError {
    const errorInfo = getErrorInfoByStatus(statusCode);
    return new ApiError(errorInfo, { statusCode, ...options });
  }

  /**
   * API 응답에서 ApiError 생성
   */
  static fromResponse(response: {
    success: boolean;
    error?: {
      code?: string;
      message?: string;
      details?: Record<string, unknown>;
    };
  }, statusCode?: number): ApiError {
    if (response.success) {
      throw new Error('Cannot create ApiError from successful response');
    }

    const errorCode = response.error?.code || ERROR_CODES.UNKNOWN_ERROR;
    const errorInfo = getErrorInfo(errorCode);

    return new ApiError(errorInfo, {
      statusCode,
      details: response.error?.details,
      originalMessage: response.error?.message,
    });
  }

  /**
   * fetch 에러를 ApiError로 변환
   */
  static fromFetchError(error: unknown): ApiError {
    if (error instanceof ApiError) {
      return error;
    }

    if (error instanceof TypeError && error.message.includes('fetch')) {
      return ApiError.fromCode(ERROR_CODES.NETWORK_ERROR);
    }

    if (error instanceof Error) {
      // 이미 사용자 친화적 메시지가 포함된 경우
      const errorInfo = getErrorInfo(ERROR_CODES.UNKNOWN_ERROR);
      return new ApiError(errorInfo, {
        originalMessage: error.message,
      });
    }

    return ApiError.fromCode(ERROR_CODES.UNKNOWN_ERROR);
  }
}

/**
 * API 응답 처리 헬퍼
 */
export async function handleApiResponse<T>(
  response: Response
): Promise<T> {
  const data = await response.json();

  if (!response.ok || !data.success) {
    throw ApiError.fromResponse(data, response.status);
  }

  return data.data as T;
}

/**
 * API 호출 wrapper (에러 처리 포함)
 */
export async function fetchWithErrorHandling<T>(
  url: string,
  options?: RequestInit
): Promise<T> {
  try {
    const response = await fetch(url, options);
    return await handleApiResponse<T>(response);
  } catch (error) {
    throw ApiError.fromFetchError(error);
  }
}

/**
 * 에러가 재시도 가능한지 확인
 */
export function isRetryableError(error: unknown): boolean {
  if (error instanceof ApiError) {
    return error.retryable;
  }
  return false;
}

/**
 * 에러의 재시도 대기 시간 조회
 */
export function getRetryDelay(error: unknown): number {
  if (error instanceof ApiError && error.retryAfter) {
    return error.retryAfter * 1000; // ms로 변환
  }
  return 5000; // 기본 5초
}
