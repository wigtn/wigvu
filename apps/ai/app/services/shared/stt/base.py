"""Abstract base class for STT providers"""

from abc import ABC, abstractmethod
from dataclasses import dataclass, field


@dataclass
class STTResult:
    """Result from a speech-to-text transcription"""

    text: str
    language: str
    language_probability: float = 1.0
    segments: list[dict] = field(default_factory=list)


class STTProvider(ABC):
    """Abstract interface for speech-to-text providers"""

    @abstractmethod
    async def transcribe(
        self,
        audio_data: bytes,
        filename: str = "audio.webm",
        language: str = "auto",
    ) -> STTResult:
        """Transcribe audio data to text.

        Args:
            audio_data: Raw audio bytes.
            filename: Original filename of the audio.
            language: Language hint ("auto" for auto-detection).

        Returns:
            STTResult with transcription text, language, and segments.
        """
        ...
