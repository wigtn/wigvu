"""Tests for analyze endpoint"""

import pytest
from unittest.mock import patch, MagicMock


class TestAnalyzeEndpoint:
    """Tests for /analyze endpoint"""

    def test_analyze_success(self, client, mock_openai, sample_analyze_request):
        """Test analyze returns valid response"""
        response = client.post("/analyze", json=sample_analyze_request)

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True
        assert "data" in data
        assert "summary" in data["data"]
        assert "watchScore" in data["data"]
        assert "keywords" in data["data"]

    def test_analyze_without_transcript(self, client, mock_openai):
        """Test analyze works without transcript"""
        request = {
            "metadata": {
                "title": "테스트 영상",
                "channelName": "테스트 채널"
            }
        }
        response = client.post("/analyze", json=request)

        assert response.status_code == 200
        data = response.json()
        assert data["success"] is True

    def test_analyze_missing_title(self, client):
        """Test analyze fails without title"""
        request = {
            "metadata": {
                "channelName": "테스트 채널"
            }
        }
        response = client.post("/analyze", json=request)

        assert response.status_code == 422  # Pydantic validation error

    def test_analyze_missing_channel(self, client):
        """Test analyze fails without channel name"""
        request = {
            "metadata": {
                "title": "테스트 제목"
            }
        }
        response = client.post("/analyze", json=request)

        assert response.status_code == 422

    def test_analyze_title_too_long(self, client):
        """Test analyze fails with too long title"""
        request = {
            "metadata": {
                "title": "가" * 250,  # Over 200 character limit
                "channelName": "테스트 채널"
            }
        }
        response = client.post("/analyze", json=request)

        assert response.status_code == 422

    def test_analyze_transcript_too_long(self, client):
        """Test analyze fails with too long transcript"""
        request = {
            "metadata": {
                "title": "테스트 제목",
                "channelName": "테스트 채널"
            },
            "transcript": "가" * 60000  # Over 50000 character limit
        }
        response = client.post("/analyze", json=request)

        assert response.status_code == 422

    def test_analyze_has_request_id(self, client, mock_openai, sample_analyze_request):
        """Test analyze returns X-Request-ID header"""
        response = client.post("/analyze", json=sample_analyze_request)
        assert "X-Request-ID" in response.headers

    def test_analyze_error_response_format(self, client):
        """Test analyze error response format"""
        request = {
            "metadata": {
                "title": "",  # Empty title
                "channelName": "테스트"
            }
        }
        response = client.post("/analyze", json=request)

        assert response.status_code == 422
        data = response.json()
        assert "detail" in data or "error" in data
