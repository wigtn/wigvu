"""External STT API Client"""

import httpx
import structlog

from app.config import get_settings
from app.models import STTResponse, STTSegment
from app.core.exceptions import STTError, ValidationError, ErrorCode
from app.services.shared.stt import get_stt_provider

logger = structlog.get_logger()

# Allowed audio formats
ALLOWED_AUDIO_FORMATS = {"webm", "mp3", "wav", "m4a", "ogg", "flac"}
ALLOWED_CONTENT_TYPES = {
    "audio/webm", "audio/mpeg", "audio/mp3", "audio/wav",
    "audio/x-wav", "audio/m4a", "audio/mp4", "audio/ogg",
    "audio/flac", "audio/x-flac", "application/octet-stream"
}


class STTClient:
    """Client for external STT API, using pluggable STT providers"""

    def __init__(self):
        settings = get_settings()
        self.max_duration_minutes = settings.stt_max_duration_minutes
        self.max_file_size_mb = settings.max_file_size_mb
        self.timeout = settings.timeout_stt
        self.retry_max_attempts = settings.retry_max_attempts
        self.retry_base_delay = settings.retry_base_delay
        self._provider = get_stt_provider()

    def validate_file(
        self,
        audio_data: bytes,
        filename: str,
        content_type: str | None = None
    ) -> None:
        """Validate audio file before processing"""
        # Check file size
        file_size_mb = len(audio_data) / (1024 * 1024)
        if file_size_mb > self.max_file_size_mb:
            raise ValidationError(
                ErrorCode.FILE_TOO_LARGE,
                f"파일 크기가 {self.max_file_size_mb}MB를 초과합니다",
                details={"file_size_mb": round(file_size_mb, 2)}
            )

        # Check file extension
        if filename:
            ext = filename.rsplit(".", 1)[-1].lower() if "." in filename else ""
            if ext and ext not in ALLOWED_AUDIO_FORMATS:
                raise ValidationError(
                    ErrorCode.INVALID_FILE,
                    f"지원하지 않는 파일 형식입니다. 지원 형식: {', '.join(ALLOWED_AUDIO_FORMATS)}",
                    details={"extension": ext}
                )

        # Check content type if provided
        if content_type and content_type not in ALLOWED_CONTENT_TYPES:
            logger.warning(
                "unknown_content_type",
                content_type=content_type,
                filename=filename
            )

    async def transcribe(
        self,
        audio_data: bytes,
        filename: str = "audio.webm",
        language: str = "auto",
        content_type: str | None = None
    ) -> STTResponse:
        """
        Transcribe audio using external STT API

        Args:
            audio_data: Audio file bytes
            filename: Original filename
            language: Language hint ("auto" for auto-detection)
            content_type: MIME type of the file

        Returns:
            STTResponse with text, language, and segments

        Raises:
            ValidationError: If file validation fails
            STTError: If STT API call fails
        """
        # Validate file
        self.validate_file(audio_data, filename, content_type)

        logger.info(
            "stt_request_start",
            audio_size=len(audio_data),
            filename=filename,
            language=language
        )

        try:
            stt_result = await self._provider.transcribe(
                audio_data=audio_data,
                filename=filename,
                language=language,
            )
        except httpx.HTTPStatusError as e:
            if e.response.status_code >= 500:
                raise STTError(
                    message="STT 서비스를 사용할 수 없습니다",
                    unavailable=True,
                    details={"status_code": e.response.status_code}
                )
            raise STTError(
                message="STT API 호출에 실패했습니다",
                details={"status_code": e.response.status_code}
            )
        except (httpx.ConnectError, httpx.TimeoutException) as e:
            raise STTError(
                message="STT 서비스에 연결할 수 없습니다",
                unavailable=True,
                details={"error": str(e)}
            )

        segments = stt_result.segments

        # 세그먼트 시간 범위 로그
        if segments:
            first_seg = segments[0]
            last_seg = segments[-1]
            logger.info(
                "stt_request_complete",
                text_length=len(stt_result.text),
                language=stt_result.language,
                segments_count=len(segments),
                first_segment_start=first_seg.get("start"),
                first_segment_end=first_seg.get("end"),
                last_segment_start=last_seg.get("start"),
                last_segment_end=last_seg.get("end"),
                total_duration=last_seg.get("end")
            )
            # 모든 세그먼트 시간 상세 로그 (DEBUG 레벨)
            logger.debug(
                "stt_segments_detail",
                segments=[
                    {"idx": i, "start": s.get("start"), "end": s.get("end"), "text": s.get("text", "")[:30]}
                    for i, s in enumerate(segments[:10])  # 처음 10개만
                ]
            )
        else:
            logger.info(
                "stt_request_complete",
                text_length=len(stt_result.text),
                language=stt_result.language,
                segments_count=0
            )

        return STTResponse(
            text=stt_result.text,
            language=stt_result.language,
            language_probability=stt_result.language_probability,
            segments=[
                STTSegment(**seg) for seg in stt_result.segments
            ]
        )

    def is_within_limit(self, duration_seconds: float) -> bool:
        """Check if audio duration is within limit"""
        return duration_seconds <= self.max_duration_minutes * 60
