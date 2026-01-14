"""Rate limiting configuration"""

from slowapi import Limiter
from slowapi.util import get_remote_address

from app.config import get_settings


def get_limiter() -> Limiter:
    """Get rate limiter instance"""
    return Limiter(key_func=get_remote_address)


limiter = get_limiter()


def get_analyze_limit() -> str:
    """Get rate limit for /analyze endpoint"""
    settings = get_settings()
    return f"{settings.rate_limit_analyze}/minute"


def get_stt_limit() -> str:
    """Get rate limit for /stt endpoints"""
    settings = get_settings()
    return f"{settings.rate_limit_stt}/minute"
