"""Tests for health endpoint"""

import pytest
from unittest.mock import patch, MagicMock


class TestHealthEndpoint:
    """Tests for /health endpoint"""

    def test_health_check_success(self, client):
        """Test health check returns ok status"""
        with patch("httpx.AsyncClient.get") as mock_get:
            mock_response = MagicMock()
            mock_response.status_code = 200
            mock_get.return_value.__aenter__.return_value.get.return_value = mock_response

            response = client.get("/health")

            assert response.status_code == 200
            data = response.json()
            assert data["status"] in ["ok", "degraded"]
            assert "version" in data
            assert "services" in data

    def test_health_check_has_request_id(self, client):
        """Test health check returns X-Request-ID header"""
        response = client.get("/health")
        assert "X-Request-ID" in response.headers

    def test_health_check_with_custom_request_id(self, client):
        """Test health check uses provided X-Request-ID"""
        custom_id = "test-123"
        response = client.get("/health", headers={"X-Request-ID": custom_id})
        assert response.headers.get("X-Request-ID") == custom_id
