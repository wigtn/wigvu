/**
 * 백엔드/AI 백엔드와 동기화된 에러 코드
 *
 * 백엔드 소스:
 * - apps/api/src/common/exceptions/video.exceptions.ts
 * - apps/ai/app/core/exceptions.py
 */

// AI Backend 에러 코드 (apps/ai/app/core/exceptions.py)
export const AI_ERROR_CODES = {
  // 400 errors
  INVALID_REQUEST: 'INVALID_REQUEST',
  TITLE_REQUIRED: 'TITLE_REQUIRED',
  TITLE_TOO_LONG: 'TITLE_TOO_LONG',
  CHANNEL_REQUIRED: 'CHANNEL_REQUIRED',
  TRANSCRIPT_TOO_LONG: 'TRANSCRIPT_TOO_LONG',
  INVALID_FILE: 'INVALID_FILE',
  FILE_TOO_LARGE: 'FILE_TOO_LARGE',

  // 422 errors
  AUDIO_TOO_LONG: 'AUDIO_TOO_LONG',

  // 429 errors
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',

  // 500 errors
  LLM_ERROR: 'LLM_ERROR',
  STT_ERROR: 'STT_ERROR',

  // 503 errors
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  STT_UNAVAILABLE: 'STT_UNAVAILABLE',
} as const;

// API Backend 에러 코드 (apps/api/src/common/exceptions/video.exceptions.ts)
export const API_ERROR_CODES = {
  VIDEO_TOO_LONG: 'VIDEO_TOO_LONG',
  NO_TRANSCRIPT: 'NO_TRANSCRIPT',
  PROCESSING_TIMEOUT: 'PROCESSING_TIMEOUT',
  STT_UNAVAILABLE: 'STT_UNAVAILABLE',

  // HTTP 기본 에러 코드
  BAD_REQUEST: 'BAD_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  RATE_LIMIT_EXCEEDED: 'RATE_LIMIT_EXCEEDED',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  BAD_GATEWAY: 'BAD_GATEWAY',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  TIMEOUT: 'TIMEOUT',
} as const;

// Frontend 전용 에러 코드
export const FRONTEND_ERROR_CODES = {
  INVALID_URL: 'INVALID_URL',
  VIDEO_NOT_FOUND: 'VIDEO_NOT_FOUND',
  NETWORK_ERROR: 'NETWORK_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

// 모든 에러 코드 통합
export const ERROR_CODES = {
  ...AI_ERROR_CODES,
  ...API_ERROR_CODES,
  ...FRONTEND_ERROR_CODES,
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];

/**
 * 에러 코드별 상세 정보
 */
export interface ErrorInfo {
  /** 에러 코드 */
  code: ErrorCode;
  /** 사용자에게 보여줄 메시지 (재치있는 버전) */
  userMessage: string;
  /** 기술적 메시지 (로깅용) */
  technicalMessage: string;
  /** 리다이렉트가 필요한지 여부 */
  shouldRedirect: boolean;
  /** 재시도 가능 여부 */
  retryable: boolean;
  /** 재시도 대기 시간 (초) */
  retryAfter?: number;
}

/**
 * 에러 코드별 사용자 친화적 메시지 매핑
 * 간결하고 자연스러운 톤으로 에러 상황을 안내
 */
export const ERROR_MESSAGES: Record<string, ErrorInfo> = {
  // === 영상 길이/시간 관련 ===
  [ERROR_CODES.VIDEO_TOO_LONG]: {
    code: ERROR_CODES.VIDEO_TOO_LONG,
    userMessage: '30분 이하 영상만 분석 가능해요. 곧 더 긴 영상도 지원할 예정이에요!',
    technicalMessage: 'Video duration exceeds maximum allowed limit',
    shouldRedirect: true,
    retryable: false,
  },
  [ERROR_CODES.PROCESSING_TIMEOUT]: {
    code: ERROR_CODES.PROCESSING_TIMEOUT,
    userMessage: '분석 시간이 초과됐어요. 잠시 후 다시 시도해주세요.',
    technicalMessage: 'Processing timeout exceeded',
    shouldRedirect: true,
    retryable: true,
    retryAfter: 30,
  },
  [ERROR_CODES.AUDIO_TOO_LONG]: {
    code: ERROR_CODES.AUDIO_TOO_LONG,
    userMessage: '음성 인식은 짧은 영상만 지원해요. 자막이 있는 영상을 추천드려요!',
    technicalMessage: 'Audio duration exceeds STT processing limit',
    shouldRedirect: true,
    retryable: false,
  },
  [ERROR_CODES.TIMEOUT]: {
    code: ERROR_CODES.TIMEOUT,
    userMessage: '요청 시간이 초과됐어요. 잠시 후 다시 시도해주세요.',
    technicalMessage: 'Request timeout',
    shouldRedirect: true,
    retryable: true,
    retryAfter: 10,
  },

  // === 텍스트/자막 관련 ===
  [ERROR_CODES.TRANSCRIPT_TOO_LONG]: {
    code: ERROR_CODES.TRANSCRIPT_TOO_LONG,
    userMessage: '자막이 너무 길어서 처리할 수 없어요. 더 짧은 영상으로 시도해주세요.',
    technicalMessage: 'Transcript exceeds maximum allowed length',
    shouldRedirect: true,
    retryable: false,
  },
  [ERROR_CODES.NO_TRANSCRIPT]: {
    code: ERROR_CODES.NO_TRANSCRIPT,
    userMessage: '이 영상에는 자막이 없어요. 자막이 있는 영상을 선택해주세요.',
    technicalMessage: 'No transcript available for this video',
    shouldRedirect: true,
    retryable: false,
  },
  [ERROR_CODES.TITLE_TOO_LONG]: {
    code: ERROR_CODES.TITLE_TOO_LONG,
    userMessage: '영상 제목이 너무 길어요. 다른 영상을 시도해주세요.',
    technicalMessage: 'Video title exceeds maximum length',
    shouldRedirect: true,
    retryable: false,
  },

  // === Rate Limit 관련 ===
  [ERROR_CODES.RATE_LIMIT_EXCEEDED]: {
    code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
    userMessage: '요청이 너무 많아요. 1분 후 다시 시도해주세요.',
    technicalMessage: 'Rate limit exceeded',
    shouldRedirect: false,
    retryable: true,
    retryAfter: 60,
  },

  // === URL/영상 관련 ===
  [ERROR_CODES.INVALID_URL]: {
    code: ERROR_CODES.INVALID_URL,
    userMessage: '올바른 YouTube URL을 입력해주세요.',
    technicalMessage: 'Invalid YouTube URL format',
    shouldRedirect: false,
    retryable: true,
  },
  [ERROR_CODES.INVALID_REQUEST]: {
    code: ERROR_CODES.INVALID_REQUEST,
    userMessage: '요청 형식이 올바르지 않아요. 다시 시도해주세요.',
    technicalMessage: 'Invalid request format',
    shouldRedirect: false,
    retryable: true,
  },
  [ERROR_CODES.BAD_REQUEST]: {
    code: ERROR_CODES.BAD_REQUEST,
    userMessage: '잘못된 요청이에요. 다시 확인해주세요.',
    technicalMessage: 'Bad request',
    shouldRedirect: false,
    retryable: true,
  },
  [ERROR_CODES.VIDEO_NOT_FOUND]: {
    code: ERROR_CODES.VIDEO_NOT_FOUND,
    userMessage: '영상을 찾을 수 없어요. 삭제되었거나 비공개일 수 있어요.',
    technicalMessage: 'Video not found',
    shouldRedirect: true,
    retryable: false,
  },
  [ERROR_CODES.NOT_FOUND]: {
    code: ERROR_CODES.NOT_FOUND,
    userMessage: '요청하신 내용을 찾을 수 없어요.',
    technicalMessage: 'Resource not found',
    shouldRedirect: true,
    retryable: false,
  },

  // === 서비스 에러 ===
  [ERROR_CODES.LLM_ERROR]: {
    code: ERROR_CODES.LLM_ERROR,
    userMessage: 'AI 분석 중 문제가 발생했어요. 잠시 후 다시 시도해주세요.',
    technicalMessage: 'LLM service error',
    shouldRedirect: false,
    retryable: true,
    retryAfter: 10,
  },
  [ERROR_CODES.STT_ERROR]: {
    code: ERROR_CODES.STT_ERROR,
    userMessage: '음성 인식 중 오류가 발생했어요. 다시 시도해주세요.',
    technicalMessage: 'STT service error',
    shouldRedirect: false,
    retryable: true,
    retryAfter: 10,
  },
  [ERROR_CODES.STT_UNAVAILABLE]: {
    code: ERROR_CODES.STT_UNAVAILABLE,
    userMessage: '음성 인식 서비스를 사용할 수 없어요. 자막이 있는 영상을 사용해주세요.',
    technicalMessage: 'STT service unavailable',
    shouldRedirect: true,
    retryable: true,
    retryAfter: 60,
  },
  [ERROR_CODES.SERVICE_UNAVAILABLE]: {
    code: ERROR_CODES.SERVICE_UNAVAILABLE,
    userMessage: '서비스가 일시적으로 사용할 수 없어요. 잠시 후 다시 시도해주세요.',
    technicalMessage: 'Service temporarily unavailable',
    shouldRedirect: false,
    retryable: true,
    retryAfter: 30,
  },
  [ERROR_CODES.BAD_GATEWAY]: {
    code: ERROR_CODES.BAD_GATEWAY,
    userMessage: '서버 연결에 문제가 있어요. 잠시 후 다시 시도해주세요.',
    technicalMessage: 'Bad gateway error',
    shouldRedirect: false,
    retryable: true,
    retryAfter: 10,
  },
  [ERROR_CODES.INTERNAL_ERROR]: {
    code: ERROR_CODES.INTERNAL_ERROR,
    userMessage: '서버 오류가 발생했어요. 잠시 후 다시 시도해주세요.',
    technicalMessage: 'Internal server error',
    shouldRedirect: false,
    retryable: true,
    retryAfter: 10,
  },
  [ERROR_CODES.NETWORK_ERROR]: {
    code: ERROR_CODES.NETWORK_ERROR,
    userMessage: '인터넷 연결을 확인해주세요.',
    technicalMessage: 'Network connection error',
    shouldRedirect: false,
    retryable: true,
  },
  [ERROR_CODES.UNKNOWN_ERROR]: {
    code: ERROR_CODES.UNKNOWN_ERROR,
    userMessage: '예상치 못한 오류가 발생했어요. 다시 시도해주세요.',
    technicalMessage: 'Unknown error occurred',
    shouldRedirect: true,
    retryable: true,
  },

  // === 권한/인증 관련 ===
  [ERROR_CODES.UNAUTHORIZED]: {
    code: ERROR_CODES.UNAUTHORIZED,
    userMessage: '접근 권한이 없어요. 로그인이 필요할 수 있어요.',
    technicalMessage: 'Unauthorized access',
    shouldRedirect: false,
    retryable: false,
  },
  [ERROR_CODES.FORBIDDEN]: {
    code: ERROR_CODES.FORBIDDEN,
    userMessage: '이 영상에 접근할 수 없어요. 비공개 영상일 수 있어요.',
    technicalMessage: 'Access forbidden',
    shouldRedirect: true,
    retryable: false,
  },

  // === 파일 관련 ===
  [ERROR_CODES.FILE_TOO_LARGE]: {
    code: ERROR_CODES.FILE_TOO_LARGE,
    userMessage: '파일 크기가 너무 커요. 더 작은 파일을 선택해주세요.',
    technicalMessage: 'File size exceeds limit',
    shouldRedirect: true,
    retryable: false,
  },
  [ERROR_CODES.INVALID_FILE]: {
    code: ERROR_CODES.INVALID_FILE,
    userMessage: '지원하지 않는 파일 형식이에요. 다른 파일을 선택해주세요.',
    technicalMessage: 'Invalid file format',
    shouldRedirect: true,
    retryable: false,
  },

  // === 필수 필드 누락 ===
  [ERROR_CODES.TITLE_REQUIRED]: {
    code: ERROR_CODES.TITLE_REQUIRED,
    userMessage: '영상 제목을 가져올 수 없어요. 다른 영상을 시도해주세요.',
    technicalMessage: 'Video title is required',
    shouldRedirect: true,
    retryable: false,
  },
  [ERROR_CODES.CHANNEL_REQUIRED]: {
    code: ERROR_CODES.CHANNEL_REQUIRED,
    userMessage: '채널 정보를 가져올 수 없어요. 다른 영상을 시도해주세요.',
    technicalMessage: 'Channel information is required',
    shouldRedirect: true,
    retryable: false,
  },
};

/**
 * 에러 코드로 에러 정보 조회
 */
export function getErrorInfo(code: string): ErrorInfo {
  return ERROR_MESSAGES[code] || ERROR_MESSAGES[ERROR_CODES.UNKNOWN_ERROR];
}

/**
 * API 응답에서 에러 정보 추출
 */
export function parseApiError(response: {
  error?: {
    code?: string;
    message?: string;
    details?: Record<string, unknown>;
  }
}): ErrorInfo {
  const errorCode = response.error?.code || ERROR_CODES.UNKNOWN_ERROR;
  const errorInfo = getErrorInfo(errorCode);

  // API에서 제공하는 메시지가 있으면 기술적 메시지로 저장
  if (response.error?.message) {
    return {
      ...errorInfo,
      technicalMessage: response.error.message,
    };
  }

  return errorInfo;
}

/**
 * HTTP 상태 코드로 기본 에러 정보 조회
 */
export function getErrorInfoByStatus(status: number): ErrorInfo {
  const statusCodeMap: Record<number, string> = {
    400: ERROR_CODES.BAD_REQUEST,
    401: ERROR_CODES.UNAUTHORIZED,
    403: ERROR_CODES.FORBIDDEN,
    404: ERROR_CODES.NOT_FOUND,
    408: ERROR_CODES.TIMEOUT,
    422: ERROR_CODES.INVALID_REQUEST,
    429: ERROR_CODES.RATE_LIMIT_EXCEEDED,
    500: ERROR_CODES.INTERNAL_ERROR,
    502: ERROR_CODES.BAD_GATEWAY,
    503: ERROR_CODES.SERVICE_UNAVAILABLE,
    504: ERROR_CODES.TIMEOUT,
  };

  const code = statusCodeMap[status] || ERROR_CODES.UNKNOWN_ERROR;
  return getErrorInfo(code);
}
