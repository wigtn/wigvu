"""API Router - combines all endpoints"""

from fastapi import APIRouter

from . import health, analyze, stt

router = APIRouter()

# Include all routers
router.include_router(health.router, tags=["health"])
router.include_router(analyze.router, tags=["analyze"])
router.include_router(stt.router, tags=["stt"])
