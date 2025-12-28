"""
Tests for logout functionality with token revocation.
"""
import pytest
from fastapi.testclient import TestClient
from uuid import uuid4

class TestLogoutEndpoints:
    """Test cases for logout endpoints"""

    def test_logout_success(self, client: TestClient, test_user_token: str):
        """Test successful logout"""
        response = client.post(
            "/api/v1/auth/logout",
            headers={"Authorization": f"Bearer {test_user_token}"}
        )
        assert response.status_code == 204

        # Try to use the same token - should fail
        response = client.get(
            "/api/v1/users/me",
            headers={"Authorization": f"Bearer {test_user_token}"}
        )
        assert response.status_code == 401
        assert "revoked" in response.json()["detail"].lower()

    def test_logout_without_auth(self, client: TestClient):
        """Test logout without authentication"""
        response = client.post("/api/v1/auth/logout")
        assert response.status_code in [401, 403]

    def test_logout_all_devices(self, client: TestClient, test_user: dict, test_db):
        """Test logout from all devices"""
        from app.core.security import create_access_token
        from datetime import timedelta

        # Create two tokens for the same user
        token1 = create_access_token(
            data={"sub": str(test_user["id"])},
            expires_delta=timedelta(minutes=30)
        )
        token2 = create_access_token(
            data={"sub": str(test_user["id"])},
            expires_delta=timedelta(minutes=30)
        )

        # Verify both tokens work
        response1 = client.get(
            "/api/v1/users/me",
            headers={"Authorization": f"Bearer {token1}"}
        )
        assert response1.status_code == 200

        response2 = client.get(
            "/api/v1/users/me",
            headers={"Authorization": f"Bearer {token2}"}
        )
        assert response2.status_code == 200

        # Logout from all devices using token1
        response = client.post(
            "/api/v1/auth/logout-all",
            headers={"Authorization": f"Bearer {token1}"}
        )
        assert response.status_code == 204

        # Both tokens should now be invalid
        response1 = client.get(
            "/api/v1/users/me",
            headers={"Authorization": f"Bearer {token1}"}
        )
        assert response1.status_code == 401

        response2 = client.get(
            "/api/v1/users/me",
            headers={"Authorization": f"Bearer {token2}"}
        )
        assert response2.status_code == 401

    def test_logout_invalid_token(self, client: TestClient):
        """Test logout with invalid token"""
        response = client.post(
            "/api/v1/auth/logout",
            headers={"Authorization": "Bearer invalid_token"}
        )
        assert response.status_code == 401
