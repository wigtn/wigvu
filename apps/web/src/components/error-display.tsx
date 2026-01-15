"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import {
  AlertCircle,
  RotateCcw,
  Home,
  Clock,
  Film,
  FileText,
  Wifi,
  Server,
  Ban,
  Mic,
  X,
  Sparkles,
} from "lucide-react";
import { ApiError } from "@/lib/errors";

interface ErrorDisplayProps {
  error: Error | ApiError;
  onRetry?: () => void;
  onReset?: () => void;
  /** 자동 리다이렉트 딜레이 (초). 0이면 자동 리다이렉트 안함 */
  autoRedirectDelay?: number;
}

interface ErrorModalProps extends ErrorDisplayProps {
  isOpen: boolean;
  onClose: () => void;
}

/**
 * 에러 코드에 맞는 아이콘 반환
 */
function getErrorIcon(code?: string) {
  const iconMap: Record<string, typeof AlertCircle> = {
    VIDEO_TOO_LONG: Film,
    AUDIO_TOO_LONG: Film,
    PROCESSING_TIMEOUT: Clock,
    TIMEOUT: Clock,
    TRANSCRIPT_TOO_LONG: FileText,
    NO_TRANSCRIPT: FileText,
    NETWORK_ERROR: Wifi,
    SERVICE_UNAVAILABLE: Server,
    BAD_GATEWAY: Server,
    RATE_LIMIT_EXCEEDED: Ban,
    STT_ERROR: Mic,
    STT_UNAVAILABLE: Mic,
  };

  return iconMap[code || ""] || AlertCircle;
}

/**
 * 에러 표시 컴포넌트
 * - 사용자 친화적인 메시지 표시
 * - 재시도/홈으로 이동 버튼
 * - 자동 리다이렉트 (설정 시)
 */
export function ErrorDisplay({
  error,
  onRetry,
  onReset,
  autoRedirectDelay = 0,
}: ErrorDisplayProps) {
  const router = useRouter();
  const [countdown, setCountdown] = useState(autoRedirectDelay);

  const isApiError = error instanceof ApiError;
  const errorCode = isApiError ? error.code : undefined;
  const userMessage = isApiError
    ? error.userMessage
    : error.message || "알 수 없는 오류가 발생했습니다";
  const shouldRedirect = isApiError ? error.shouldRedirect : true;
  const retryable = isApiError ? error.retryable : true;
  const retryAfter = isApiError ? error.retryAfter : undefined;

  const Icon = getErrorIcon(errorCode);

  // 자동 리다이렉트 카운트다운
  useEffect(() => {
    if (autoRedirectDelay <= 0 || !shouldRedirect) return;

    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          router.push("/");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [autoRedirectDelay, shouldRedirect, router]);

  const handleGoHome = useCallback(() => {
    router.push("/");
  }, [router]);

  const handleRetry = useCallback(() => {
    if (onRetry) {
      onRetry();
    } else if (onReset) {
      onReset();
    }
  }, [onRetry, onReset]);

  return (
    <div className="bento-card p-8 max-w-md w-full text-center animate-fade-in">
      {/* 에러 아이콘 */}
      <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-destructive/10 flex items-center justify-center">
        <Icon className="w-8 h-8 text-destructive" />
      </div>

      {/* 에러 제목 */}
      <h2 className="text-xl font-semibold mb-3">
        {errorCode === "VIDEO_TOO_LONG"
          ? "영상이 너무 길어요"
          : errorCode === "AUDIO_TOO_LONG"
          ? "오디오가 너무 길어요"
          : errorCode === "PROCESSING_TIMEOUT"
          ? "시간이 초과됐어요"
          : errorCode === "TRANSCRIPT_TOO_LONG"
          ? "텍스트가 너무 많아요"
          : errorCode === "NO_TRANSCRIPT"
          ? "자막을 찾을 수 없어요"
          : errorCode === "RATE_LIMIT_EXCEEDED"
          ? "요청이 너무 많아요"
          : errorCode === "NETWORK_ERROR"
          ? "연결 문제"
          : errorCode === "SERVICE_UNAVAILABLE"
          ? "서비스 점검 중"
          : errorCode === "STT_ERROR"
          ? "음성 인식 실패"
          : "분석 실패"}
      </h2>

      {/* 에러 메시지 */}
      <p className="text-muted-foreground mb-6 leading-relaxed">{userMessage}</p>

      {/* 재시도 대기 시간 안내 */}
      {retryAfter && retryable && (
        <p className="text-sm text-muted-foreground mb-4">
          <Clock className="w-4 h-4 inline mr-1" />
          {retryAfter}초 후에 다시 시도해주세요
        </p>
      )}

      {/* 자동 리다이렉트 카운트다운 */}
      {autoRedirectDelay > 0 && shouldRedirect && countdown > 0 && (
        <p className="text-sm text-accent mb-4 animate-pulse">
          {countdown}초 후 메인 페이지로 이동합니다...
        </p>
      )}

      {/* 액션 버튼들 */}
      <div className="flex flex-col sm:flex-row gap-3 justify-center">
        {retryable && (onRetry || onReset) && (
          <button
            onClick={handleRetry}
            className="btn-primary"
            disabled={retryAfter ? countdown > 0 : false}
          >
            <RotateCcw className="w-4 h-4" />
            다시 시도
          </button>
        )}

        <button onClick={handleGoHome} className="btn-ghost">
          <Home className="w-4 h-4" />
          처음으로
        </button>
      </div>

      {/* 기술적 에러 정보 (개발 모드에서만) */}
      {process.env.NODE_ENV === "development" && isApiError && (
        <details className="mt-6 text-left">
          <summary className="cursor-pointer text-xs text-muted-foreground hover:text-foreground">
            개발자 정보
          </summary>
          <pre className="mt-2 p-3 bg-muted rounded-md text-xs overflow-auto">
            {JSON.stringify(
              {
                code: error.code,
                statusCode: error.statusCode,
                technicalMessage: error.technicalMessage,
                shouldRedirect: error.shouldRedirect,
                retryable: error.retryable,
                details: error.details,
              },
              null,
              2
            )}
          </pre>
        </details>
      )}
    </div>
  );
}

/**
 * 전체 화면 에러 표시
 */
export function FullPageError({
  error,
  onRetry,
  onReset,
  autoRedirectDelay = 5,
}: ErrorDisplayProps) {
  return (
    <div className="flex-1 flex items-center justify-center p-6">
      <ErrorDisplay
        error={error}
        onRetry={onRetry}
        onReset={onReset}
        autoRedirectDelay={autoRedirectDelay}
      />
    </div>
  );
}

/**
 * 에러 모달 컴포넌트
 * - 오버레이 배경
 * - 닫기 버튼
 * - 자동 리다이렉트 카운트다운
 */
export function ErrorModal({
  isOpen,
  onClose,
  error,
  onRetry,
  onReset,
  autoRedirectDelay = 5,
}: ErrorModalProps) {
  const router = useRouter();
  const [countdown, setCountdown] = useState(autoRedirectDelay);

  // onClose를 ref로 저장하여 useEffect 의존성 문제 해결
  const onCloseRef = useRef(onClose);
  onCloseRef.current = onClose;

  const isApiError = error instanceof ApiError;
  const errorCode = isApiError ? error.code : undefined;
  const userMessage = isApiError
    ? error.userMessage
    : error.message || "알 수 없는 오류가 발생했습니다";
  const shouldRedirect = isApiError ? error.shouldRedirect : true;

  const Icon = getErrorIcon(errorCode);

  // 자동 리다이렉트 카운트다운
  useEffect(() => {
    if (!isOpen || autoRedirectDelay <= 0 || !shouldRedirect) return;

    setCountdown(autoRedirectDelay);
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          onCloseRef.current();
          router.push("/");
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [isOpen, autoRedirectDelay, shouldRedirect, router]);

  // ESC 키로 닫기
  useEffect(() => {
    const handleEsc = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCloseRef.current();
    };
    if (isOpen) {
      window.addEventListener("keydown", handleEsc);
    }
    return () => window.removeEventListener("keydown", handleEsc);
  }, [isOpen]);

  const handleClose = useCallback(() => {
    onClose();
    if (onReset) onReset();
  }, [onClose, onReset]);

  const handleGoHome = useCallback(() => {
    onClose();
    router.push("/");
  }, [onClose, router]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* 오버레이 배경 */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm animate-fade-in"
        onClick={handleClose}
      />

      {/* 모달 컨텐츠 */}
      <div className="relative bg-card border border-border rounded-2xl p-8 max-w-md w-full text-center shadow-2xl animate-scale-in z-10">
        {/* 닫기 버튼 */}
        <button
          onClick={handleClose}
          className="absolute top-4 right-4 p-2 rounded-full hover:bg-muted transition-colors"
        >
          <X className="w-5 h-5 text-muted-foreground" />
        </button>

        {/* 에러 아이콘 */}
        <div className="w-16 h-16 mx-auto mb-6 rounded-full bg-accent/10 flex items-center justify-center">
          <Icon className="w-8 h-8 text-accent" />
        </div>

        {/* 에러 제목 */}
        <h2 className="text-xl font-semibold mb-3">
          {errorCode === "VIDEO_TOO_LONG"
            ? "영상이 너무 길어요"
            : errorCode === "AUDIO_TOO_LONG"
            ? "오디오가 너무 길어요"
            : errorCode === "PROCESSING_TIMEOUT"
            ? "시간이 초과됐어요"
            : errorCode === "TRANSCRIPT_TOO_LONG"
            ? "텍스트가 너무 많아요"
            : errorCode === "NO_TRANSCRIPT"
            ? "자막을 찾을 수 없어요"
            : errorCode === "RATE_LIMIT_EXCEEDED"
            ? "요청이 너무 많아요"
            : errorCode === "NETWORK_ERROR"
            ? "연결 문제"
            : errorCode === "SERVICE_UNAVAILABLE"
            ? "서비스 점검 중"
            : errorCode === "STT_ERROR"
            ? "음성 인식 실패"
            : "분석 실패"}
        </h2>

        {/* 에러 메시지 */}
        <p className="text-muted-foreground mb-4 leading-relaxed">{userMessage}</p>

        {/* 개선 예정 메시지 */}
        <div className="bg-accent/5 border border-accent/20 rounded-lg p-3 mb-6">
          <p className="text-sm text-accent flex items-center justify-center gap-2">
            <Sparkles className="w-4 h-4" />
            서비스가 성장하면 제한이 점점 늘어날 예정이에요!
          </p>
        </div>

        {/* 자동 리다이렉트 카운트다운 */}
        {autoRedirectDelay > 0 && shouldRedirect && countdown > 0 && (
          <p className="text-sm text-muted-foreground mb-4">
            {countdown}초 후 자동으로 돌아갑니다
          </p>
        )}

        {/* 액션 버튼 */}
        <button onClick={handleGoHome} className="btn-primary w-full">
          <Home className="w-4 h-4" />
          다른 영상 분석하기
        </button>
      </div>
    </div>
  );
}
