"""Video analysis endpoint"""

import structlog
from fastapi import APIRouter, Request

from app.models import AnalyzeRequest, AnalyzeResponse
from app.services import LLMService
from app.core.rate_limiter import limiter, get_analyze_limit

logger = structlog.get_logger()
router = APIRouter()


@router.post("/analyze", response_model=AnalyzeResponse)
@limiter.limit(get_analyze_limit)
async def analyze_video(request: Request, body: AnalyzeRequest) -> AnalyzeResponse:
    """
    Analyze video content using LLM

    Args:
        request: FastAPI request object (for rate limiting)
        body: Video metadata, transcript, and segments

    Returns:
        Analysis result with summary, score, keywords, highlights

    Raises:
        ValidationError: If input validation fails
        LLMError: If OpenAI API call fails
        RateLimitExceeded: If rate limit is exceeded
    """
    request_id = getattr(request.state, "request_id", "unknown")

    logger.info(
        "analyze_start",
        request_id=request_id,
        title=body.metadata.title[:50],
        has_transcript=bool(body.transcript),
        segments_count=len(body.segments) if body.segments else 0
    )

    llm_service = LLMService()
    result = await llm_service.analyze(
        metadata=body.metadata,
        transcript=body.transcript,
        segments=body.segments
    )

    logger.info(
        "analyze_complete",
        request_id=request_id,
        watch_score=result.watch_score,
        keywords_count=len(result.keywords)
    )

    return AnalyzeResponse(success=True, data=result)
