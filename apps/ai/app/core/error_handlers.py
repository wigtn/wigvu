"""Exception handlers for FastAPI"""

import structlog
from fastapi import FastAPI, Request
from fastapi.responses import JSONResponse
from pydantic import ValidationError as PydanticValidationError
from slowapi.errors import RateLimitExceeded

from .exceptions import AIServiceError, ErrorCode

logger = structlog.get_logger()


def setup_exception_handlers(app: FastAPI) -> None:
    """Setup global exception handlers"""

    @app.exception_handler(AIServiceError)
    async def ai_service_error_handler(
        request: Request,
        exc: AIServiceError
    ) -> JSONResponse:
        """Handle AI service errors"""
        request_id = getattr(request.state, "request_id", "unknown")

        logger.error(
            "ai_service_error",
            request_id=request_id,
            error_code=exc.code.value,
            message=exc.message,
            status_code=exc.status_code
        )

        # Use flat format for STT endpoints (backward compatibility)
        if "/stt/" in request.url.path or "/whisperX/" in request.url.path:
            return JSONResponse(
                status_code=exc.status_code,
                content=exc.to_flat_dict()
            )

        return JSONResponse(
            status_code=exc.status_code,
            content=exc.to_dict()
        )

    @app.exception_handler(PydanticValidationError)
    async def pydantic_validation_error_handler(
        request: Request,
        exc: PydanticValidationError
    ) -> JSONResponse:
        """Handle Pydantic validation errors"""
        request_id = getattr(request.state, "request_id", "unknown")

        errors = exc.errors()
        first_error = errors[0] if errors else {}
        field = ".".join(str(loc) for loc in first_error.get("loc", []))

        logger.warning(
            "validation_error",
            request_id=request_id,
            field=field,
            errors=errors
        )

        return JSONResponse(
            status_code=400,
            content={
                "success": False,
                "error": {
                    "code": ErrorCode.INVALID_REQUEST.value,
                    "message": f"잘못된 요청 형식입니다: {field}",
                    "details": {"validation_errors": errors}
                }
            }
        )

    @app.exception_handler(RateLimitExceeded)
    async def rate_limit_error_handler(
        request: Request,
        exc: RateLimitExceeded
    ) -> JSONResponse:
        """Handle rate limit exceeded errors"""
        request_id = getattr(request.state, "request_id", "unknown")

        logger.warning(
            "rate_limit_exceeded",
            request_id=request_id,
            path=request.url.path
        )

        content = {
            "success": False,
            "error": {
                "code": ErrorCode.RATE_LIMIT_EXCEEDED.value,
                "message": "요청 한도를 초과했습니다",
                "details": {"retry_after": 60}
            }
        }

        # Use flat format for STT endpoints
        if "/stt/" in request.url.path or "/whisperX/" in request.url.path:
            content = {
                "error": ErrorCode.RATE_LIMIT_EXCEEDED.value,
                "message": "요청 한도를 초과했습니다"
            }

        return JSONResponse(
            status_code=429,
            content=content,
            headers={"Retry-After": "60"}
        )

    @app.exception_handler(Exception)
    async def generic_exception_handler(
        request: Request,
        exc: Exception
    ) -> JSONResponse:
        """Handle unexpected exceptions"""
        request_id = getattr(request.state, "request_id", "unknown")

        logger.error(
            "unexpected_error",
            request_id=request_id,
            error_type=type(exc).__name__,
            error=str(exc)
        )

        content = {
            "success": False,
            "error": {
                "code": ErrorCode.SERVICE_UNAVAILABLE.value,
                "message": "서비스를 일시적으로 사용할 수 없습니다"
            }
        }

        # Use flat format for STT endpoints
        if "/stt/" in request.url.path or "/whisperX/" in request.url.path:
            content = {
                "error": ErrorCode.SERVICE_UNAVAILABLE.value,
                "message": "서비스를 일시적으로 사용할 수 없습니다"
            }

        return JSONResponse(
            status_code=503,
            content=content
        )
