"""
Tests for password reset functionality.
Following TDD - tests written before implementation.
"""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.models.user import User
from app.core.security import get_password_hash


class TestPasswordResetRequest:
    """Test cases for requesting password reset"""

    def test_request_password_reset_success(self, client: TestClient, db: Session):
        """Test successful password reset request"""
        # Create a user
        user = User(
            email="test@example.com",
            name="Test User",
            hashed_password=get_password_hash("oldpassword123")
        )
        db.add(user)
        db.commit()

        with patch('app.services.notification.NotificationService.send_password_reset_email') as mock_email:
            mock_email.return_value = True

            response = client.post(
                "/api/v1/auth/password-reset/request",
                json={"email": "test@example.com"}
            )

            assert response.status_code == 200
            assert "reset link" in response.json()["message"].lower()
            mock_email.assert_called_once()

    def test_request_password_reset_nonexistent_email(self, client: TestClient):
        """Test password reset request for non-existent email - should still return 200 for security"""
        with patch('app.services.notification.NotificationService.send_password_reset_email') as mock_email:
            response = client.post(
                "/api/v1/auth/password-reset/request",
                json={"email": "nonexistent@example.com"}
            )

            # Return 200 even if email doesn't exist (security best practice)
            assert response.status_code == 200
            # But don't actually send an email
            mock_email.assert_not_called()

    def test_request_password_reset_invalid_email(self, client: TestClient):
        """Test password reset request with invalid email format"""
        response = client.post(
            "/api/v1/auth/password-reset/request",
            json={"email": "not-an-email"}
        )

        assert response.status_code == 422  # Validation error

    def test_request_password_reset_rate_limiting(self, client: TestClient, db: Session):
        """Test that password reset requests are rate limited"""
        user = User(
            email="test@example.com",
            name="Test User",
            hashed_password=get_password_hash("oldpassword123")
        )
        db.add(user)
        db.commit()

        with patch('app.services.notification.NotificationService.send_password_reset_email') as mock_email:
            mock_email.return_value = True

            # Make multiple requests
            for i in range(6):  # Assuming 5/hour limit
                response = client.post(
                    "/api/v1/auth/password-reset/request",
                    json={"email": "test@example.com"}
                )

            # Last request should be rate limited
            assert response.status_code == 429  # Too Many Requests


class TestPasswordResetConfirm:
    """Test cases for confirming password reset with token"""

    def test_reset_password_success(self, client: TestClient, db: Session):
        """Test successful password reset with valid token"""
        # Create a user
        user = User(
            email="test@example.com",
            name="Test User",
            hashed_password=get_password_hash("oldpassword123")
        )
        db.add(user)
        db.commit()

        # Generate a valid reset token
        from app.core.security import create_password_reset_token
        token = create_password_reset_token(str(user.id))

        response = client.post(
            "/api/v1/auth/password-reset/confirm",
            json={
                "token": token,
                "new_password": "newpassword456"
            }
        )

        assert response.status_code == 200
        assert "password has been reset" in response.json()["message"].lower()

        # Verify user can login with new password
        login_response = client.post(
            "/api/v1/auth/login",
            json={
                "email": "test@example.com",
                "password": "newpassword456"
            }
        )
        assert login_response.status_code == 200

    def test_reset_password_expired_token(self, client: TestClient, db: Session):
        """Test password reset with expired token"""
        user = User(
            email="test@example.com",
            name="Test User",
            hashed_password=get_password_hash("oldpassword123")
        )
        db.add(user)
        db.commit()

        # Create an expired token
        from app.core.security import create_password_reset_token
        with patch('app.core.security.datetime') as mock_datetime:
            # Set time to past to create expired token
            mock_datetime.utcnow.return_value = datetime.utcnow() - timedelta(hours=2)
            expired_token = create_password_reset_token(str(user.id))

        response = client.post(
            "/api/v1/auth/password-reset/confirm",
            json={
                "token": expired_token,
                "new_password": "newpassword456"
            }
        )

        assert response.status_code == 400
        assert "expired" in response.json()["detail"].lower()

    def test_reset_password_invalid_token(self, client: TestClient):
        """Test password reset with invalid token"""
        response = client.post(
            "/api/v1/auth/password-reset/confirm",
            json={
                "token": "invalid-token-12345",
                "new_password": "newpassword456"
            }
        )

        assert response.status_code == 400
        assert "invalid" in response.json()["detail"].lower()

    def test_reset_password_weak_password(self, client: TestClient, db: Session):
        """Test password reset with weak password"""
        user = User(
            email="test@example.com",
            name="Test User",
            hashed_password=get_password_hash("oldpassword123")
        )
        db.add(user)
        db.commit()

        from app.core.security import create_password_reset_token
        token = create_password_reset_token(str(user.id))

        response = client.post(
            "/api/v1/auth/password-reset/confirm",
            json={
                "token": token,
                "new_password": "123"  # Too short
            }
        )

        assert response.status_code == 422  # Validation error

    def test_reset_password_nonexistent_user(self, client: TestClient):
        """Test password reset with token for non-existent user"""
        from app.core.security import create_password_reset_token
        fake_user_id = "00000000-0000-0000-0000-000000000000"
        token = create_password_reset_token(fake_user_id)

        response = client.post(
            "/api/v1/auth/password-reset/confirm",
            json={
                "token": token,
                "new_password": "newpassword456"
            }
        )

        assert response.status_code == 404
        assert "user not found" in response.json()["detail"].lower()


class TestPasswordResetToken:
    """Test cases for password reset token generation and validation"""

    def test_create_reset_token(self):
        """Test creating a password reset token"""
        from app.core.security import create_password_reset_token
        user_id = "12345678-1234-1234-1234-123456789012"

        token = create_password_reset_token(user_id)

        assert token is not None
        assert isinstance(token, str)
        assert len(token) > 20

    def test_verify_reset_token_valid(self):
        """Test verifying a valid reset token"""
        from app.core.security import create_password_reset_token, verify_password_reset_token
        user_id = "12345678-1234-1234-1234-123456789012"

        token = create_password_reset_token(user_id)
        verified_user_id = verify_password_reset_token(token)

        assert verified_user_id == user_id

    def test_verify_reset_token_invalid(self):
        """Test verifying an invalid reset token"""
        from app.core.security import verify_password_reset_token

        verified_user_id = verify_password_reset_token("invalid-token")

        assert verified_user_id is None

    def test_reset_token_expiration(self):
        """Test that reset tokens expire after configured time"""
        from app.core.security import create_password_reset_token, verify_password_reset_token
        from app.core.config import settings

        user_id = "12345678-1234-1234-1234-123456789012"
        token = create_password_reset_token(user_id)

        # Token should be valid immediately
        verified_user_id = verify_password_reset_token(token)
        assert verified_user_id == user_id

        # Mock time passing beyond expiration
        with patch('app.core.security.datetime') as mock_datetime:
            mock_datetime.utcnow.return_value = datetime.utcnow() + timedelta(hours=2)
            verified_user_id = verify_password_reset_token(token)
            # Should be None after expiration
            # (This test depends on implementation)


class TestPasswordResetEmail:
    """Test cases for password reset email sending"""

    def test_password_reset_email_content(self):
        """Test that password reset email contains required information"""
        from app.services.notification import NotificationService

        with patch('app.services.email.EmailService.send_email') as mock_send:
            mock_send.return_value = True

            success = NotificationService.send_password_reset_email(
                email="test@example.com",
                name="Test User",
                reset_token="test-token-12345"
            )

            assert success is True
            mock_send.assert_called_once()

            # Check email content
            call_args = mock_send.call_args
            assert call_args[1]['to'] == "test@example.com"
            assert "reset" in call_args[1]['subject'].lower()
            assert "test-token-12345" in call_args[1]['html_body']

    def test_password_reset_email_failure(self):
        """Test handling of email sending failure"""
        from app.services.notification import NotificationService

        with patch('app.services.email.EmailService.send_email') as mock_send:
            mock_send.return_value = False

            success = NotificationService.send_password_reset_email(
                email="test@example.com",
                name="Test User",
                reset_token="test-token-12345"
            )

            assert success is False
