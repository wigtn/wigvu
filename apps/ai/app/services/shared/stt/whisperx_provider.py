"""WhisperX STT provider — calls external WhisperX HTTP API"""

import logging

import httpx
import structlog
from tenacity import (
    retry,
    stop_after_attempt,
    wait_exponential,
    retry_if_exception_type,
    before_sleep_log,
)

from app.config import get_settings
from .base import STTProvider, STTResult

logger = structlog.get_logger()


class WhisperXProvider(STTProvider):
    """STTProvider implementation that delegates to an external WhisperX API."""

    def __init__(self):
        settings = get_settings()
        self.base_url = settings.stt_api_url
        self.timeout = settings.timeout_stt
        self.retry_max_attempts = settings.retry_max_attempts
        self.retry_base_delay = settings.retry_base_delay

    async def transcribe(
        self,
        audio_data: bytes,
        filename: str = "audio.webm",
        language: str = "auto",
    ) -> STTResult:
        """Transcribe audio via external WhisperX API.

        Args:
            audio_data: Raw audio bytes.
            filename: Original filename.
            language: Language hint.

        Returns:
            STTResult with text, language, and segments.

        Raises:
            httpx.HTTPStatusError: On HTTP error responses.
            httpx.ConnectError: On connection failure (after retries).
            httpx.TimeoutException: On timeout (after retries).
        """
        result = await self._transcribe_with_retry(audio_data, filename, language)

        return STTResult(
            text=result.get("text", ""),
            language=result.get("language", language),
            language_probability=result.get("language_probability", 1.0),
            segments=result.get("segments", []),
        )

    async def _transcribe_with_retry(
        self,
        audio_data: bytes,
        filename: str,
        language: str,
    ) -> dict:
        """Execute transcription with retry logic."""
        settings = get_settings()

        @retry(
            stop=stop_after_attempt(settings.retry_max_attempts),
            wait=wait_exponential(
                multiplier=settings.retry_base_delay,
                min=settings.retry_base_delay,
                max=settings.retry_base_delay * 4,
            ),
            retry=retry_if_exception_type((
                httpx.ConnectError,
                httpx.TimeoutException,
            )),
            before_sleep=before_sleep_log(logger, logging.WARNING),
            reraise=True,
        )
        async def _do_request() -> dict:
            async with httpx.AsyncClient(timeout=self.timeout) as client:
                files = {"audio": (filename, audio_data, "audio/webm")}
                data = {"language": language}

                response = await client.post(
                    f"{self.base_url}/whisperX/transcribe",
                    files=files,
                    data=data,
                )
                response.raise_for_status()
                return response.json()

        return await _do_request()
