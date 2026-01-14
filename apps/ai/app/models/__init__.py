"""Data models"""

from .schemas import (
    VideoMetadata,
    STTSegment,
    Highlight,
    AnalysisResult,
    AnalyzeRequest,
    AnalyzeResponse,
    ErrorDetail,
    ErrorResponse,
    FlatErrorResponse,
    STTRequest,
    STTResponse,
    ServiceStatus,
    HealthResponse,
)

__all__ = [
    "VideoMetadata",
    "STTSegment",
    "Highlight",
    "AnalysisResult",
    "AnalyzeRequest",
    "AnalyzeResponse",
    "ErrorDetail",
    "ErrorResponse",
    "FlatErrorResponse",
    "STTRequest",
    "STTResponse",
    "ServiceStatus",
    "HealthResponse",
]
