"""Tests for exception handling"""

import pytest

import os
os.environ["OPENAI_API_KEY"] = "sk-test"

from app.core.exceptions import (
    AIServiceError,
    ValidationError,
    LLMError,
    STTError,
    RateLimitError,
    ErrorCode,
)


class TestAIServiceError:
    """Tests for AIServiceError"""

    def test_to_dict(self):
        """Test error converts to dict correctly"""
        error = AIServiceError(
            code=ErrorCode.INVALID_REQUEST,
            message="테스트 에러",
            status_code=400
        )
        result = error.to_dict()

        assert result["success"] is False
        assert result["error"]["code"] == "INVALID_REQUEST"
        assert result["error"]["message"] == "테스트 에러"

    def test_to_dict_with_details(self):
        """Test error with details converts correctly"""
        error = AIServiceError(
            code=ErrorCode.FILE_TOO_LARGE,
            message="파일이 너무 큽니다",
            status_code=400,
            details={"file_size_mb": 600}
        )
        result = error.to_dict()

        assert result["error"]["details"]["file_size_mb"] == 600

    def test_to_flat_dict(self):
        """Test error converts to flat dict for STT compatibility"""
        error = AIServiceError(
            code=ErrorCode.STT_ERROR,
            message="STT 에러",
            status_code=500
        )
        result = error.to_flat_dict()

        assert result["error"] == "STT_ERROR"
        assert result["message"] == "STT 에러"
        assert "success" not in result


class TestValidationError:
    """Tests for ValidationError"""

    def test_status_code(self):
        """Test ValidationError has 400 status code"""
        error = ValidationError(
            code=ErrorCode.TITLE_REQUIRED,
            message="제목이 필요합니다"
        )
        assert error.status_code == 400


class TestLLMError:
    """Tests for LLMError"""

    def test_default_message(self):
        """Test LLMError has default message"""
        error = LLMError()
        assert "OpenAI" in error.message

    def test_unavailable_status(self):
        """Test unavailable flag sets 503 status"""
        error = LLMError(unavailable=True)
        assert error.status_code == 503
        assert error.code == ErrorCode.SERVICE_UNAVAILABLE

    def test_normal_error_status(self):
        """Test normal error has 500 status"""
        error = LLMError()
        assert error.status_code == 500
        assert error.code == ErrorCode.LLM_ERROR


class TestSTTError:
    """Tests for STTError"""

    def test_default_message(self):
        """Test STTError has default message"""
        error = STTError()
        assert "STT" in error.message

    def test_unavailable_status(self):
        """Test unavailable flag sets 503 status"""
        error = STTError(unavailable=True)
        assert error.status_code == 503
        assert error.code == ErrorCode.STT_UNAVAILABLE


class TestRateLimitError:
    """Tests for RateLimitError"""

    def test_default_values(self):
        """Test RateLimitError default values"""
        error = RateLimitError()
        assert error.status_code == 429
        assert error.code == ErrorCode.RATE_LIMIT_EXCEEDED
        assert error.details["retry_after"] == 60

    def test_custom_retry_after(self):
        """Test custom retry_after value"""
        error = RateLimitError(retry_after=120)
        assert error.details["retry_after"] == 120
