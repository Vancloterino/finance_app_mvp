"""
Tests for dev-token endpoint gating.
"""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch

class TestDevEndpoint:
    """Test cases for dev-token endpoint security"""

    def test_dev_token_blocked_in_production(self, client: TestClient, test_user: dict):
        """Test that dev-token endpoint is blocked in production"""
        with patch('app.core.config.settings.ENVIRONMENT', 'production'):
            response = client.post(
                "/api/v1/auth/dev-token",
                params={"user_id": str(test_user["id"])}
            )
            assert response.status_code == 404
            assert "not available" in response.json()["detail"].lower()

    def test_dev_token_blocked_in_staging(self, client: TestClient, test_user: dict):
        """Test that dev-token endpoint is blocked in staging"""
        with patch('app.core.config.settings.ENVIRONMENT', 'staging'):
            response = client.post(
                "/api/v1/auth/dev-token",
                params={"user_id": str(test_user["id"])}
            )
            assert response.status_code == 404

    def test_dev_token_allowed_in_development(self, client: TestClient, test_user: dict):
        """Test that dev-token endpoint works in development"""
        with patch('app.core.config.settings.ENVIRONMENT', 'development'):
            response = client.post(
                "/api/v1/auth/dev-token",
                params={"user_id": str(test_user["id"])}
            )
            assert response.status_code == 200
            assert "access_token" in response.json()
            assert "token_type" in response.json()

    def test_dev_token_invalid_user_id(self, client: TestClient):
        """Test dev-token with invalid user ID"""
        from uuid import uuid4
        with patch('app.core.config.settings.ENVIRONMENT', 'development'):
            response = client.post(
                "/api/v1/auth/dev-token",
                params={"user_id": str(uuid4())}
            )
            assert response.status_code == 404
            assert "not found" in response.json()["detail"].lower()

    def test_dev_token_malformed_uuid(self, client: TestClient):
        """Test dev-token with malformed UUID"""
        with patch('app.core.config.settings.ENVIRONMENT', 'development'):
            response = client.post(
                "/api/v1/auth/dev-token",
                params={"user_id": "not-a-uuid"}
            )
            assert response.status_code == 400
            assert "invalid" in response.json()["detail"].lower()
