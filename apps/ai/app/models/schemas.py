"""Pydantic schemas for API request/response"""

from typing import Any
from pydantic import BaseModel, Field, field_validator, model_validator

from app.config import get_settings


# === Video Analysis ===

class VideoMetadata(BaseModel):
    """Video metadata for analysis"""
    title: str = Field(..., min_length=1)
    channel_name: str = Field(alias="channelName", min_length=1)
    description: str = ""

    class Config:
        populate_by_name = True

    @field_validator("title")
    @classmethod
    def validate_title(cls, v: str) -> str:
        settings = get_settings()
        if len(v) > settings.max_title_length:
            raise ValueError(f"제목은 {settings.max_title_length}자 이내여야 합니다")
        return v.strip()

    @field_validator("channel_name")
    @classmethod
    def validate_channel_name(cls, v: str) -> str:
        settings = get_settings()
        if len(v) > settings.max_channel_length:
            raise ValueError(f"채널명은 {settings.max_channel_length}자 이내여야 합니다")
        return v.strip()

    @field_validator("description")
    @classmethod
    def validate_description(cls, v: str) -> str:
        settings = get_settings()
        if len(v) > settings.max_description_length:
            raise ValueError(f"설명은 {settings.max_description_length}자 이내여야 합니다")
        return v.strip()


class STTSegment(BaseModel):
    """STT segment with timestamp"""
    start: float = Field(..., ge=0)
    end: float = Field(..., ge=0)
    text: str

    @model_validator(mode="after")
    def validate_timestamps(self) -> "STTSegment":
        if self.end < self.start:
            raise ValueError("end 시간은 start 시간보다 커야 합니다")
        return self


class Highlight(BaseModel):
    """Video highlight"""
    timestamp: int = Field(..., ge=0)
    title: str = Field(..., max_length=50)
    description: str = Field(..., max_length=100)


class AnalysisResult(BaseModel):
    """AI analysis result"""
    summary: str
    watch_score: int = Field(alias="watchScore", ge=1, le=10)
    watch_score_reason: str = Field(alias="watchScoreReason")
    keywords: list[str]
    highlights: list[Highlight]

    class Config:
        populate_by_name = True


class AnalyzeRequest(BaseModel):
    """Request for /analyze endpoint"""
    metadata: VideoMetadata
    transcript: str | None = None
    segments: list[STTSegment] | None = None

    @field_validator("transcript")
    @classmethod
    def validate_transcript(cls, v: str | None) -> str | None:
        if v is None:
            return v
        settings = get_settings()
        if len(v) > settings.max_transcript_length:
            raise ValueError(f"자막은 {settings.max_transcript_length}자 이내여야 합니다")
        return v

    @field_validator("segments")
    @classmethod
    def validate_segments(cls, v: list[STTSegment] | None) -> list[STTSegment] | None:
        if v is None:
            return v
        settings = get_settings()
        if len(v) > settings.max_segments_count:
            raise ValueError(f"세그먼트는 {settings.max_segments_count}개 이내여야 합니다")
        return v


class AnalyzeResponse(BaseModel):
    """Response for /analyze endpoint"""
    success: bool = True
    data: AnalysisResult


# === Error Response ===

class ErrorDetail(BaseModel):
    """Error detail"""
    code: str
    message: str
    details: dict[str, Any] | None = None


class ErrorResponse(BaseModel):
    """Standard error response"""
    success: bool = False
    error: ErrorDetail


class FlatErrorResponse(BaseModel):
    """Flat error response for STT backward compatibility"""
    error: str
    message: str


# === STT ===

class STTResponse(BaseModel):
    """Response from STT API (flat structure for compatibility)"""
    text: str
    language: str
    language_probability: float
    segments: list[STTSegment]


class STTRequest(BaseModel):
    """Request for STT proxy"""
    language: str = "auto"


# === Health ===

class ServiceStatus(BaseModel):
    """Individual service status"""
    openai: bool = True
    stt_api: bool = True


class HealthResponse(BaseModel):
    """Health check response"""
    status: str = "ok"
    version: str
    services: ServiceStatus
