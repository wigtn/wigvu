/**
 * Error codes synchronized with backend/AI services
 *
 * Backend sources:
 * - apps/api/src/common/exceptions/video.exceptions.ts
 * - apps/ai/app/core/exceptions.py
 */

// AI Backend error codes (apps/ai/app/core/exceptions.py)
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

// API Backend error codes (apps/api/src/common/exceptions/video.exceptions.ts)
export const API_ERROR_CODES = {
  VIDEO_TOO_LONG: 'VIDEO_TOO_LONG',
  NO_TRANSCRIPT: 'NO_TRANSCRIPT',
  PROCESSING_TIMEOUT: 'PROCESSING_TIMEOUT',
  STT_UNAVAILABLE: 'STT_UNAVAILABLE',

  // HTTP error codes
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

// Frontend-only error codes
export const FRONTEND_ERROR_CODES = {
  INVALID_URL: 'INVALID_URL',
  VIDEO_NOT_FOUND: 'VIDEO_NOT_FOUND',
  NETWORK_ERROR: 'NETWORK_ERROR',
  UNKNOWN_ERROR: 'UNKNOWN_ERROR',
} as const;

// Combined error codes
export const ERROR_CODES = {
  ...AI_ERROR_CODES,
  ...API_ERROR_CODES,
  ...FRONTEND_ERROR_CODES,
} as const;

export type ErrorCode = typeof ERROR_CODES[keyof typeof ERROR_CODES];

/**
 * Error info per error code
 */
export interface ErrorInfo {
  /** Error code */
  code: ErrorCode;
  /** User-facing message */
  userMessage: string;
  /** Technical message (for logging) */
  technicalMessage: string;
  /** Whether redirect is needed */
  shouldRedirect: boolean;
  /** Whether retry is possible */
  retryable: boolean;
  /** Retry delay in seconds */
  retryAfter?: number;
}

/**
 * User-friendly error message mapping per error code
 */
export const ERROR_MESSAGES: Record<string, ErrorInfo> = {
  // === Video duration/time related ===
  [ERROR_CODES.VIDEO_TOO_LONG]: {
    code: ERROR_CODES.VIDEO_TOO_LONG,
    userMessage: 'Only videos under 30 minutes can be analyzed. Longer videos will be supported soon!',
    technicalMessage: 'Video duration exceeds maximum allowed limit',
    shouldRedirect: true,
    retryable: false,
  },
  [ERROR_CODES.PROCESSING_TIMEOUT]: {
    code: ERROR_CODES.PROCESSING_TIMEOUT,
    userMessage: 'Analysis timed out. Please try again shortly.',
    technicalMessage: 'Processing timeout exceeded',
    shouldRedirect: true,
    retryable: true,
    retryAfter: 30,
  },
  [ERROR_CODES.AUDIO_TOO_LONG]: {
    code: ERROR_CODES.AUDIO_TOO_LONG,
    userMessage: 'Speech recognition only supports short videos. Try a video with subtitles!',
    technicalMessage: 'Audio duration exceeds STT processing limit',
    shouldRedirect: true,
    retryable: false,
  },
  [ERROR_CODES.TIMEOUT]: {
    code: ERROR_CODES.TIMEOUT,
    userMessage: 'Request timed out. Please try again shortly.',
    technicalMessage: 'Request timeout',
    shouldRedirect: true,
    retryable: true,
    retryAfter: 10,
  },

  // === Text/subtitle related ===
  [ERROR_CODES.TRANSCRIPT_TOO_LONG]: {
    code: ERROR_CODES.TRANSCRIPT_TOO_LONG,
    userMessage: 'The subtitles are too long to process. Please try a shorter video.',
    technicalMessage: 'Transcript exceeds maximum allowed length',
    shouldRedirect: true,
    retryable: false,
  },
  [ERROR_CODES.NO_TRANSCRIPT]: {
    code: ERROR_CODES.NO_TRANSCRIPT,
    userMessage: 'This video has no subtitles. Please choose a video with subtitles.',
    technicalMessage: 'No transcript available for this video',
    shouldRedirect: true,
    retryable: false,
  },
  [ERROR_CODES.TITLE_TOO_LONG]: {
    code: ERROR_CODES.TITLE_TOO_LONG,
    userMessage: 'The video title is too long. Please try another video.',
    technicalMessage: 'Video title exceeds maximum length',
    shouldRedirect: true,
    retryable: false,
  },

  // === Rate limit related ===
  [ERROR_CODES.RATE_LIMIT_EXCEEDED]: {
    code: ERROR_CODES.RATE_LIMIT_EXCEEDED,
    userMessage: 'Too many requests. Please try again in 1 minute.',
    technicalMessage: 'Rate limit exceeded',
    shouldRedirect: false,
    retryable: true,
    retryAfter: 60,
  },

  // === URL/video related ===
  [ERROR_CODES.INVALID_URL]: {
    code: ERROR_CODES.INVALID_URL,
    userMessage: 'Please enter a valid YouTube URL.',
    technicalMessage: 'Invalid YouTube URL format',
    shouldRedirect: false,
    retryable: true,
  },
  [ERROR_CODES.INVALID_REQUEST]: {
    code: ERROR_CODES.INVALID_REQUEST,
    userMessage: 'Invalid request format. Please try again.',
    technicalMessage: 'Invalid request format',
    shouldRedirect: false,
    retryable: true,
  },
  [ERROR_CODES.BAD_REQUEST]: {
    code: ERROR_CODES.BAD_REQUEST,
    userMessage: 'Invalid request. Please check and try again.',
    technicalMessage: 'Bad request',
    shouldRedirect: false,
    retryable: true,
  },
  [ERROR_CODES.VIDEO_NOT_FOUND]: {
    code: ERROR_CODES.VIDEO_NOT_FOUND,
    userMessage: 'Video not found. It may have been deleted or set to private.',
    technicalMessage: 'Video not found',
    shouldRedirect: true,
    retryable: false,
  },
  [ERROR_CODES.NOT_FOUND]: {
    code: ERROR_CODES.NOT_FOUND,
    userMessage: 'The requested content could not be found.',
    technicalMessage: 'Resource not found',
    shouldRedirect: true,
    retryable: false,
  },

  // === Service errors ===
  [ERROR_CODES.LLM_ERROR]: {
    code: ERROR_CODES.LLM_ERROR,
    userMessage: 'An error occurred during AI analysis. Please try again shortly.',
    technicalMessage: 'LLM service error',
    shouldRedirect: false,
    retryable: true,
    retryAfter: 10,
  },
  [ERROR_CODES.STT_ERROR]: {
    code: ERROR_CODES.STT_ERROR,
    userMessage: 'Speech recognition failed. Please try again.',
    technicalMessage: 'STT service error',
    shouldRedirect: false,
    retryable: true,
    retryAfter: 10,
  },
  [ERROR_CODES.STT_UNAVAILABLE]: {
    code: ERROR_CODES.STT_UNAVAILABLE,
    userMessage: 'Speech recognition service is unavailable. Please use a video with subtitles.',
    technicalMessage: 'STT service unavailable',
    shouldRedirect: true,
    retryable: true,
    retryAfter: 60,
  },
  [ERROR_CODES.SERVICE_UNAVAILABLE]: {
    code: ERROR_CODES.SERVICE_UNAVAILABLE,
    userMessage: 'Service is temporarily unavailable. Please try again shortly.',
    technicalMessage: 'Service temporarily unavailable',
    shouldRedirect: false,
    retryable: true,
    retryAfter: 30,
  },
  [ERROR_CODES.BAD_GATEWAY]: {
    code: ERROR_CODES.BAD_GATEWAY,
    userMessage: 'Server connection issue. Please try again shortly.',
    technicalMessage: 'Bad gateway error',
    shouldRedirect: false,
    retryable: true,
    retryAfter: 10,
  },
  [ERROR_CODES.INTERNAL_ERROR]: {
    code: ERROR_CODES.INTERNAL_ERROR,
    userMessage: 'A server error occurred. Please try again shortly.',
    technicalMessage: 'Internal server error',
    shouldRedirect: false,
    retryable: true,
    retryAfter: 10,
  },
  [ERROR_CODES.NETWORK_ERROR]: {
    code: ERROR_CODES.NETWORK_ERROR,
    userMessage: 'Please check your internet connection.',
    technicalMessage: 'Network connection error',
    shouldRedirect: false,
    retryable: true,
  },
  [ERROR_CODES.UNKNOWN_ERROR]: {
    code: ERROR_CODES.UNKNOWN_ERROR,
    userMessage: 'An unexpected error occurred. Please try again.',
    technicalMessage: 'Unknown error occurred',
    shouldRedirect: true,
    retryable: true,
  },

  // === Auth related ===
  [ERROR_CODES.UNAUTHORIZED]: {
    code: ERROR_CODES.UNAUTHORIZED,
    userMessage: 'Access denied. You may need to log in.',
    technicalMessage: 'Unauthorized access',
    shouldRedirect: false,
    retryable: false,
  },
  [ERROR_CODES.FORBIDDEN]: {
    code: ERROR_CODES.FORBIDDEN,
    userMessage: 'Cannot access this video. It may be private.',
    technicalMessage: 'Access forbidden',
    shouldRedirect: true,
    retryable: false,
  },

  // === File related ===
  [ERROR_CODES.FILE_TOO_LARGE]: {
    code: ERROR_CODES.FILE_TOO_LARGE,
    userMessage: 'File is too large. Please choose a smaller file.',
    technicalMessage: 'File size exceeds limit',
    shouldRedirect: true,
    retryable: false,
  },
  [ERROR_CODES.INVALID_FILE]: {
    code: ERROR_CODES.INVALID_FILE,
    userMessage: 'Unsupported file format. Please choose a different file.',
    technicalMessage: 'Invalid file format',
    shouldRedirect: true,
    retryable: false,
  },

  // === Required fields missing ===
  [ERROR_CODES.TITLE_REQUIRED]: {
    code: ERROR_CODES.TITLE_REQUIRED,
    userMessage: 'Could not retrieve the video title. Please try another video.',
    technicalMessage: 'Video title is required',
    shouldRedirect: true,
    retryable: false,
  },
  [ERROR_CODES.CHANNEL_REQUIRED]: {
    code: ERROR_CODES.CHANNEL_REQUIRED,
    userMessage: 'Could not retrieve channel info. Please try another video.',
    technicalMessage: 'Channel information is required',
    shouldRedirect: true,
    retryable: false,
  },
};

/**
 * Get error info by error code
 */
export function getErrorInfo(code: string): ErrorInfo {
  return ERROR_MESSAGES[code] || ERROR_MESSAGES[ERROR_CODES.UNKNOWN_ERROR];
}

/**
 * Extract error info from API response
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

  if (response.error?.message) {
    return {
      ...errorInfo,
      technicalMessage: response.error.message,
    };
  }

  return errorInfo;
}

/**
 * Get default error info by HTTP status code
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
