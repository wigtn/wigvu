"""QuickPreview AI Service - FastAPI Application"""

import logging
import structlog
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from slowapi import _rate_limit_exceeded_handler
from slowapi.errors import RateLimitExceeded

from app import __version__
from app.api import router
from app.config import get_settings
from app.core.error_handlers import setup_exception_handlers
from app.core.middleware import ApiKeyMiddleware, RequestIdMiddleware, LoggingMiddleware
from app.core.rate_limiter import limiter


def setup_logging():
    """Configure structured logging"""
    settings = get_settings()
    log_level = getattr(logging, settings.log_level.upper(), logging.INFO)

    structlog.configure(
        processors=[
            structlog.contextvars.merge_contextvars,
            structlog.processors.TimeStamper(fmt="iso"),
            structlog.processors.add_log_level,
            structlog.processors.JSONRenderer()
        ],
        wrapper_class=structlog.make_filtering_bound_logger(log_level),
    )


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Application lifespan handler"""
    logger = structlog.get_logger()
    settings = get_settings()
    logger.info(
        "app_startup",
        version=__version__,
        model=settings.openai_model,
        stt_api_url=settings.stt_api_url
    )
    yield
    logger.info("app_shutdown")


# Initialize app
setup_logging()

app = FastAPI(
    title="QuickPreview AI Service",
    description="AI-powered video analysis service",
    version=__version__,
    lifespan=lifespan
)

# Rate limiter
app.state.limiter = limiter

# Setup exception handlers
setup_exception_handlers(app)

# Middleware (order matters - first added is outermost)
app.add_middleware(LoggingMiddleware)
app.add_middleware(ApiKeyMiddleware)
app.add_middleware(RequestIdMiddleware)

# CORS middleware
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Include routes
app.include_router(router)


if __name__ == "__main__":
    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=5000)
