"""Factory for creating STT provider instances"""

from app.config import get_settings
from .base import STTProvider
from .whisperx_provider import WhisperXProvider


def get_stt_provider(provider_name: str | None = None) -> STTProvider:
    """Create and return an STT provider instance.

    Args:
        provider_name: Name of the provider. If None, uses the configured default.
            Currently supported: "whisperx".

    Returns:
        An STTProvider instance.

    Raises:
        ValueError: If the provider name is not recognized.
    """
    if provider_name is None:
        settings = get_settings()
        provider_name = settings.stt_provider

    if provider_name == "whisperx":
        return WhisperXProvider()

    raise ValueError(f"Unknown STT provider: {provider_name}")
