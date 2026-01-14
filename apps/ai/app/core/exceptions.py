"""Custom exceptions for AI Service"""

from enum import Enum
from typing import Any


class ErrorCode(str, Enum):
    """Error codes as defined in PRD"""
    # 400 errors
    INVALID_REQUEST = "INVALID_REQUEST"
    TITLE_REQUIRED = "TITLE_REQUIRED"
    TITLE_TOO_LONG = "TITLE_TOO_LONG"
    CHANNEL_REQUIRED = "CHANNEL_REQUIRED"
    TRANSCRIPT_TOO_LONG = "TRANSCRIPT_TOO_LONG"
    INVALID_FILE = "INVALID_FILE"
    FILE_TOO_LARGE = "FILE_TOO_LARGE"

    # 422 errors
    AUDIO_TOO_LONG = "AUDIO_TOO_LONG"

    # 429 errors
    RATE_LIMIT_EXCEEDED = "RATE_LIMIT_EXCEEDED"

    # 500 errors
    LLM_ERROR = "LLM_ERROR"
    STT_ERROR = "STT_ERROR"

    # 503 errors
    SERVICE_UNAVAILABLE = "SERVICE_UNAVAILABLE"
    STT_UNAVAILABLE = "STT_UNAVAILABLE"


class AIServiceError(Exception):
    """Base exception for AI Service"""

    def __init__(
        self,
        code: ErrorCode,
        message: str,
        status_code: int = 500,
        details: dict[str, Any] | None = None
    ):
        self.code = code
        self.message = message
        self.status_code = status_code
        self.details = details or {}
        super().__init__(message)

    def to_dict(self) -> dict[str, Any]:
        """Convert to error response dict"""
        result = {
            "success": False,
            "error": {
                "code": self.code.value,
                "message": self.message,
            }
        }
        if self.details:
            result["error"]["details"] = self.details
        return result

    def to_flat_dict(self) -> dict[str, str]:
        """Convert to flat error response (for STT backward compatibility)"""
        return {
            "error": self.code.value,
            "message": self.message,
        }


class ValidationError(AIServiceError):
    """Validation error (400)"""

    def __init__(
        self,
        code: ErrorCode,
        message: str,
        details: dict[str, Any] | None = None
    ):
        super().__init__(code, message, status_code=400, details=details)


class LLMError(AIServiceError):
    """LLM service error"""

    def __init__(
        self,
        message: str = "OpenAI API 호출에 실패했습니다",
        details: dict[str, Any] | None = None,
        unavailable: bool = False
    ):
        code = ErrorCode.SERVICE_UNAVAILABLE if unavailable else ErrorCode.LLM_ERROR
        status_code = 503 if unavailable else 500
        super().__init__(code, message, status_code=status_code, details=details)


class STTError(AIServiceError):
    """STT service error"""

    def __init__(
        self,
        message: str = "STT API 호출에 실패했습니다",
        details: dict[str, Any] | None = None,
        unavailable: bool = False
    ):
        code = ErrorCode.STT_UNAVAILABLE if unavailable else ErrorCode.STT_ERROR
        status_code = 503 if unavailable else 500
        super().__init__(code, message, status_code=status_code, details=details)


class RateLimitError(AIServiceError):
    """Rate limit exceeded error (429)"""

    def __init__(
        self,
        message: str = "요청 한도를 초과했습니다",
        retry_after: int = 60
    ):
        super().__init__(
            ErrorCode.RATE_LIMIT_EXCEEDED,
            message,
            status_code=429,
            details={"retry_after": retry_after}
        )
