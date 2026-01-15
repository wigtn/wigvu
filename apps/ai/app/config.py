"""Configuration management for AI Service"""

from functools import lru_cache
from pydantic_settings import BaseSettings


class Settings(BaseSettings):
    """Application settings loaded from environment variables"""

    # OpenAI
    openai_api_key: str
    openai_model: str = "gpt-4o-mini"

    # Internal API Key (for NestJS Gateway authentication)
    internal_api_key: str = ""  # Empty = disabled (development mode)

    # External STT API
    stt_api_url: str = "http://work.soundmind.life:12321"
    stt_max_duration_minutes: int = 120

    # File limits
    max_file_size_mb: int = 500

    # Rate Limiting
    rate_limit_analyze: int = 30  # requests per minute per IP
    rate_limit_stt: int = 10  # requests per minute per IP
    max_concurrent_requests: int = 10

    # Retry settings
    retry_max_attempts: int = 3
    retry_base_delay: float = 1.0  # seconds

    # Timeouts (seconds)
    timeout_analyze: int = 30
    timeout_stt: int = 300
    timeout_health: int = 5

    # Logging
    log_level: str = "INFO"

    # Validation limits
    max_title_length: int = 200
    max_channel_length: int = 100
    max_description_length: int = 10000  # YouTube allows up to 5000, but some have more
    max_transcript_length: int = 50000
    max_segments_count: int = 1000

    class Config:
        env_file = ".env"
        env_file_encoding = "utf-8"


@lru_cache
def get_settings() -> Settings:
    """Get cached settings instance"""
    return Settings()
