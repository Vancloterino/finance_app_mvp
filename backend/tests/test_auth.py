"""Tests for authentication endpoints"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session


class TestAuthEndpoints:
    """Test authentication API endpoints"""

    def test_register_new_user(self, client: TestClient):
        """Test user registration with email and password"""
        response = client.post(
            "/api/v1/auth/register",
            json={
                "email": "newuser@example.com",
                "name": "New User",
                "password": "securepassword123"
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"

    def test_register_duplicate_email(self, client: TestClient, test_user: dict):
        """Test registration with already registered email"""
        response = client.post(
            "/api/v1/auth/register",
            json={
                "email": test_user["email"],
                "name": "Another User",
                "password": "password123"
            }
        )
        assert response.status_code == 400
        assert "already registered" in response.json()["detail"].lower()

    def test_register_invalid_email(self, client: TestClient):
        """Test registration with invalid email format"""
        response = client.post(
            "/api/v1/auth/register",
            json={
                "email": "invalid-email",
                "name": "Test User",
                "password": "password123"
            }
        )
        assert response.status_code == 422  # Validation error

    def test_login_with_email_password(self, client: TestClient, test_user: dict):
        """Test login with correct email and password"""
        response = client.post(
            "/api/v1/auth/login-email",
            json={
                "email": test_user["email"],
                "password": test_user["password"]
            }
        )
        assert response.status_code == 200
        data = response.json()
        assert "access_token" in data
        assert data["token_type"] == "bearer"
        assert "user" in data
        assert data["user"]["email"] == test_user["email"]

    def test_login_wrong_password(self, client: TestClient, test_user: dict):
        """Test login with incorrect password"""
        response = client.post(
            "/api/v1/auth/login-email",
            json={
                "email": test_user["email"],
                "password": "wrongpassword"
            }
        )
        assert response.status_code == 401
        assert "incorrect" in response.json()["detail"].lower()

    def test_login_nonexistent_user(self, client: TestClient):
        """Test login with non-existent user"""
        response = client.post(
            "/api/v1/auth/login-email",
            json={
                "email": "nonexistent@example.com",
                "password": "password123"
            }
        )
        assert response.status_code == 401

    def test_register_short_password(self, client: TestClient):
        """Test registration with password that's too short"""
        response = client.post(
            "/api/v1/auth/register",
            json={
                "email": "test@example.com",
                "name": "Test User",
                "password": "12345"
            }
        )
        assert response.status_code == 422  # Validation error

    def test_rate_limiting_register(self, client: TestClient):
        """Test rate limiting on register endpoint (3 requests/min)"""
        # Make 4 registration attempts to hit rate limit
        for i in range(4):
            response = client.post(
                "/api/v1/auth/register",
                json={
                    "email": f"user{i}@example.com",
                    "name": f"User {i}",
                    "password": "password123"
                }
            )
            if i < 3:
                # First 3 should succeed or fail with business logic errors
                assert response.status_code in [200, 400, 422]
            else:
                # 4th request should be rate limited
                assert response.status_code == 429
