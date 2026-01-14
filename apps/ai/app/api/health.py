"""Health check endpoint"""

import httpx
import structlog
from fastapi import APIRouter, Request

from app import __version__
from app.config import get_settings
from app.models import HealthResponse, ServiceStatus

logger = structlog.get_logger()
router = APIRouter()


@router.get("/health", response_model=HealthResponse)
async def health_check(request: Request) -> HealthResponse:
    """
    Health check endpoint

    Returns service status and external service availability
    """
    request_id = getattr(request.state, "request_id", "unknown")
    settings = get_settings()

    openai_ok = bool(settings.openai_api_key)
    stt_api_ok = False

    # Check STT API availability
    try:
        async with httpx.AsyncClient(timeout=settings.timeout_health) as client:
            response = await client.get(f"{settings.stt_api_url}/health")
            stt_api_ok = response.status_code == 200
    except Exception as e:
        logger.warning(
            "stt_health_check_failed",
            request_id=request_id,
            error=str(e)
        )

    services = ServiceStatus(openai=openai_ok, stt_api=stt_api_ok)

    # Determine overall status
    status = "ok" if openai_ok and stt_api_ok else "degraded"

    logger.info(
        "health_check",
        request_id=request_id,
        status=status,
        openai=openai_ok,
        stt_api=stt_api_ok
    )

    return HealthResponse(
        status=status,
        version=__version__,
        services=services
    )
