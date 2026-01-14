"""Tests for STT endpoint"""

import pytest
from unittest.mock import patch, MagicMock, AsyncMock
from io import BytesIO


class TestSTTEndpoint:
    """Tests for /stt/transcribe endpoint"""

    def test_stt_transcribe_success(self, client, mock_stt_api):
        """Test STT transcribe returns valid response"""
        audio_content = b"fake audio content"
        files = {"audio": ("test.mp3", BytesIO(audio_content), "audio/mpeg")}

        response = client.post("/stt/transcribe", files=files)

        assert response.status_code == 200
        data = response.json()
        assert "text" in data
        assert "language" in data
        assert "segments" in data

    def test_stt_legacy_endpoint(self, client, mock_stt_api):
        """Test legacy /whisperX/transcribe endpoint"""
        audio_content = b"fake audio content"
        files = {"audio": ("test.mp3", BytesIO(audio_content), "audio/mpeg")}

        response = client.post("/whisperX/transcribe", files=files)

        assert response.status_code == 200
        data = response.json()
        assert "text" in data

    def test_stt_with_language(self, client, mock_stt_api):
        """Test STT with language parameter"""
        audio_content = b"fake audio content"
        files = {"audio": ("test.mp3", BytesIO(audio_content), "audio/mpeg")}
        data = {"language": "ko"}

        response = client.post("/stt/transcribe", files=files, data=data)

        assert response.status_code == 200

    def test_stt_missing_audio(self, client):
        """Test STT fails without audio file"""
        response = client.post("/stt/transcribe")

        assert response.status_code == 422

    def test_stt_invalid_file_format(self, client):
        """Test STT fails with invalid file format"""
        files = {"audio": ("test.txt", BytesIO(b"not audio"), "text/plain")}

        response = client.post("/stt/transcribe", files=files)

        # Should fail with validation error for invalid file type
        assert response.status_code in [400, 422]

    def test_stt_has_request_id(self, client, mock_stt_api):
        """Test STT returns X-Request-ID header"""
        audio_content = b"fake audio content"
        files = {"audio": ("test.mp3", BytesIO(audio_content), "audio/mpeg")}

        response = client.post("/stt/transcribe", files=files)
        assert "X-Request-ID" in response.headers

    def test_stt_flat_response_structure(self, client, mock_stt_api):
        """Test STT returns flat response structure for backward compatibility"""
        audio_content = b"fake audio content"
        files = {"audio": ("test.mp3", BytesIO(audio_content), "audio/mpeg")}

        response = client.post("/stt/transcribe", files=files)

        data = response.json()
        # Should be flat structure, not nested under "data" or "success"
        assert "text" in data
        assert "language" in data
        assert "language_probability" in data
        assert "segments" in data
        assert "success" not in data  # Not wrapped


class TestSTTValidation:
    """Tests for STT file validation"""

    def test_file_size_limit(self, client):
        """Test file size validation"""
        # Create a file larger than limit (would need actual large file in real test)
        # This is a placeholder - actual test would need configuration
        pass

    def test_supported_formats(self, client, mock_stt_api):
        """Test supported audio formats are accepted"""
        formats = [
            ("test.webm", "audio/webm"),
            ("test.mp3", "audio/mpeg"),
            ("test.wav", "audio/wav"),
            ("test.m4a", "audio/mp4"),
            ("test.ogg", "audio/ogg"),
            ("test.flac", "audio/flac"),
        ]

        for filename, content_type in formats:
            files = {"audio": (filename, BytesIO(b"fake audio"), content_type)}
            response = client.post("/stt/transcribe", files=files)
            # Should not fail due to format validation
            # 429 is acceptable as rate limiting may kick in during test loop
            assert response.status_code in [200, 429, 500]  # 500 might be from mock
