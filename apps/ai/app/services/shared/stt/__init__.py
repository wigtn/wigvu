"""STT provider abstraction"""

from .base import STTProvider, STTResult
from .factory import get_stt_provider

__all__ = ["STTProvider", "STTResult", "get_stt_provider"]
