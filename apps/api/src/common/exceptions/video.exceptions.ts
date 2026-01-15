import { HttpException, HttpStatus } from '@nestjs/common';

/**
 * 영상 길이 초과 예외
 */
export class VideoTooLongException extends HttpException {
  constructor(durationMinutes: number, maxMinutes: number) {
    super(
      {
        code: 'VIDEO_TOO_LONG',
        message: `영상 길이(${Math.round(durationMinutes)}분)가 최대 허용 시간(${maxMinutes}분)을 초과했습니다. 더 짧은 영상을 시도해주세요.`,
        details: {
          videoDurationMinutes: Math.round(durationMinutes),
          maxAllowedMinutes: maxMinutes,
        },
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

/**
 * 자막 없음 예외
 */
export class NoTranscriptException extends HttpException {
  constructor(videoId: string, reason?: string) {
    super(
      {
        code: 'NO_TRANSCRIPT',
        message: reason || '이 영상에서 자막을 추출할 수 없습니다. YouTube 자막이 없고 음성 인식도 실패했습니다.',
        details: {
          videoId,
        },
      },
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }
}

/**
 * 처리 시간 초과 예외 (긴 영상용)
 */
export class VideoProcessingTimeoutException extends HttpException {
  constructor(videoId: string, durationMinutes?: number) {
    const durationInfo = durationMinutes
      ? ` 영상 길이(${Math.round(durationMinutes)}분)가 길어 처리 시간이 오래 걸릴 수 있습니다.`
      : '';

    super(
      {
        code: 'PROCESSING_TIMEOUT',
        message: `영상 처리 중 시간이 초과되었습니다.${durationInfo} 잠시 후 다시 시도하거나 더 짧은 영상을 이용해주세요.`,
        details: {
          videoId,
          ...(durationMinutes && { videoDurationMinutes: Math.round(durationMinutes) }),
        },
      },
      HttpStatus.REQUEST_TIMEOUT,
    );
  }
}

/**
 * STT 처리 불가 (긴 영상)
 */
export class SttUnavailableException extends HttpException {
  constructor(durationMinutes: number, maxMinutes: number) {
    super(
      {
        code: 'STT_UNAVAILABLE',
        message: `음성 인식(STT)은 ${maxMinutes}분 이하 영상에서만 사용 가능합니다. 현재 영상은 ${Math.round(durationMinutes)}분입니다. YouTube 자막만 사용됩니다.`,
        details: {
          videoDurationMinutes: Math.round(durationMinutes),
          sttMaxMinutes: maxMinutes,
        },
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}

/**
 * 오디오 길이 초과 예외 (STT 제한)
 */
export class AudioTooLongException extends HttpException {
  constructor(message?: string, details?: Record<string, unknown>) {
    super(
      {
        code: 'AUDIO_TOO_LONG',
        message: message || '음성 인식은 짧은 영상만 지원해요. 자막이 있는 영상을 추천드려요!',
        details,
      },
      HttpStatus.UNPROCESSABLE_ENTITY,
    );
  }
}

/**
 * 자막 텍스트 초과 예외
 */
export class TranscriptTooLongException extends HttpException {
  constructor(message?: string, details?: Record<string, unknown>) {
    super(
      {
        code: 'TRANSCRIPT_TOO_LONG',
        message: message || '자막이 너무 길어서 처리할 수 없어요. 더 짧은 영상으로 시도해주세요.',
        details,
      },
      HttpStatus.BAD_REQUEST,
    );
  }
}
