"""STT proxy endpoint"""

import structlog
from fastapi import APIRouter, File, Form, UploadFile, Request, HTTPException

from app.services import STTClient, YouTubeAudioDownloader
from app.models import STTResponse
from app.core.rate_limiter import limiter, get_stt_limit

logger = structlog.get_logger()
router = APIRouter()


@router.post("/stt/transcribe", response_model=STTResponse)
@limiter.limit(get_stt_limit)
async def transcribe(
    request: Request,
    audio: UploadFile = File(...),
    language: str = Form(default="auto")
) -> STTResponse:
    """
    Transcribe audio using external STT API

    This is a proxy endpoint to the external WhisperX API.
    Returns flat response structure for compatibility.

    Args:
        request: FastAPI request object (for rate limiting)
        audio: Audio file (webm, mp3, wav, m4a, ogg, flac)
        language: Language hint ("auto" for auto-detection)

    Returns:
        STT result with text, language, and segments

    Raises:
        ValidationError: If file validation fails
        STTError: If STT API call fails
        RateLimitExceeded: If rate limit is exceeded
    """
    request_id = getattr(request.state, "request_id", "unknown")

    logger.info(
        "stt_request_received",
        request_id=request_id,
        filename=audio.filename,
        content_type=audio.content_type,
        language=language
    )

    audio_data = await audio.read()
    stt_client = STTClient()

    result = await stt_client.transcribe(
        audio_data=audio_data,
        filename=audio.filename or "audio.webm",
        language=language,
        content_type=audio.content_type
    )

    logger.info(
        "stt_request_complete",
        request_id=request_id,
        text_length=len(result.text),
        language=result.language,
        segments_count=len(result.segments)
    )

    return result


# Backward compatible endpoint
@router.post("/whisperX/transcribe", response_model=STTResponse)
@limiter.limit(get_stt_limit)
async def transcribe_legacy(
    request: Request,
    audio: UploadFile = File(...),
    language: str = Form(default="auto")
) -> STTResponse:
    """
    Legacy endpoint for backward compatibility

    Same as /stt/transcribe but with old path
    """
    return await transcribe(request=request, audio=audio, language=language)


@router.post("/stt/video/{video_id}", response_model=STTResponse)
@limiter.limit(get_stt_limit)
async def transcribe_video(
    request: Request,
    video_id: str,
    language: str = "auto"
) -> STTResponse:
    """
    Download audio from YouTube and transcribe using STT

    This endpoint handles the full pipeline:
    1. Download audio from YouTube using yt-dlp
    2. Send to external STT API
    3. Return transcription result

    Args:
        request: FastAPI request object (for rate limiting)
        video_id: YouTube video ID
        language: Language hint ("auto" for auto-detection)

    Returns:
        STT result with text, language, and segments

    Raises:
        HTTPException 400: If video download fails
        HTTPException 413: If video duration exceeds limit
        STTError: If STT API call fails
    """
    request_id = getattr(request.state, "request_id", "unknown")

    logger.info(
        "stt_video_request_received",
        request_id=request_id,
        video_id=video_id,
        language=language
    )

    # Download audio from YouTube
    downloader = YouTubeAudioDownloader()
    audio_data, duration = await downloader.download_audio(video_id)

    if audio_data is None:
        if duration and not downloader.is_within_limit(duration):
            raise HTTPException(
                status_code=413,
                detail=f"Video duration ({duration}s) exceeds maximum allowed ({downloader.max_duration_minutes * 60}s)"
            )
        raise HTTPException(
            status_code=400,
            detail=f"Failed to download audio from video: {video_id}"
        )

    logger.info(
        "stt_video_audio_downloaded",
        request_id=request_id,
        video_id=video_id,
        size_mb=round(len(audio_data) / 1024 / 1024, 2),
        duration=duration
    )

    # Transcribe using STT
    stt_client = STTClient()
    result = await stt_client.transcribe(
        audio_data=audio_data,
        filename=f"{video_id}.m4a",
        language=language,
        content_type="audio/mp4"
    )

    logger.info(
        "stt_video_request_complete",
        request_id=request_id,
        video_id=video_id,
        text_length=len(result.text),
        language=result.language,
        segments_count=len(result.segments)
    )

    return result
