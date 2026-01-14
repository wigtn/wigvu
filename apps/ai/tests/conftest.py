"""Pytest configuration and fixtures"""

import os
import pytest
from unittest.mock import AsyncMock, MagicMock, patch

# Set test environment variables before importing app
os.environ["OPENAI_API_KEY"] = "sk-test-key"
os.environ["STT_API_URL"] = "http://localhost:12321"
os.environ["LOG_LEVEL"] = "DEBUG"

from fastapi.testclient import TestClient
from httpx import ASGITransport, AsyncClient

from main import app


@pytest.fixture
def client():
    """Synchronous test client"""
    return TestClient(app)


@pytest.fixture
async def async_client():
    """Async test client"""
    async with AsyncClient(
        transport=ASGITransport(app=app),
        base_url="http://test"
    ) as ac:
        yield ac


@pytest.fixture
def mock_openai():
    """Mock OpenAI client"""
    with patch("app.services.llm.OpenAI") as mock:
        mock_instance = MagicMock()
        mock_response = MagicMock()
        mock_response.choices = [
            MagicMock(
                message=MagicMock(
                    content='{"summary": "테스트 요약입니다.", "watchScore": 8, "watchScoreReason": "테스트 이유", "keywords": ["테스트", "키워드"], "highlights": []}'
                )
            )
        ]
        mock_instance.chat.completions.create.return_value = mock_response
        mock.return_value = mock_instance
        yield mock_instance


@pytest.fixture
def mock_stt_api():
    """Mock STT API response"""
    mock_response = {
        "text": "테스트 자막 텍스트입니다.",
        "language": "ko",
        "language_probability": 0.95,
        "segments": [
            {"start": 0.0, "end": 5.0, "text": "테스트 자막 텍스트입니다."}
        ]
    }

    async def mock_post(*args, **kwargs):
        mock = MagicMock()
        mock.status_code = 200
        mock.json.return_value = mock_response
        mock.raise_for_status = MagicMock()
        return mock

    with patch("httpx.AsyncClient.post", new=mock_post):
        yield mock_response


@pytest.fixture
def sample_analyze_request():
    """Sample analyze request data"""
    return {
        "metadata": {
            "title": "테스트 영상 제목",
            "channelName": "테스트 채널",
            "description": "테스트 설명입니다."
        },
        "transcript": "이것은 테스트 자막입니다.",
        "segments": [
            {"start": 0.0, "end": 5.0, "text": "이것은 테스트 자막입니다."}
        ]
    }


@pytest.fixture
def sample_audio_file():
    """Sample audio file data"""
    # Simple WAV header + minimal data
    return b"RIFF" + b"\x00" * 100
