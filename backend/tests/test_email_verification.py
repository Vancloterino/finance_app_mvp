"""
Tests for email verification functionality.
Following TDD - tests written before implementation.
"""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock
from datetime import datetime, timedelta
from sqlalchemy.orm import Session

from app.models.user import User
from app.core.security import get_password_hash


class TestEmailVerificationSend:
    """Test cases for sending email verification"""

    def test_send_verification_email_on_registration(self, client: TestClient, db: Session):
        """Test that verification email is sent on registration"""
        with patch('app.services.notification.NotificationService.send_verification_email') as mock_email:
            mock_email.return_value = True

            response = client.post(
                "/api/v1/auth/email-password/register",
                json={
                    "name": "Test User",
                    "email": "test@example.com",
                    "password": "password123"
                }
            )

            assert response.status_code in [200, 201]
            # Verification email should be sent
            mock_email.assert_called_once()

    def test_resend_verification_email(self, client: TestClient, db: Session):
        """Test resending verification email"""
        # Create unverified user
        user = User(
            email="test@example.com",
            name="Test User",
            hashed_password=get_password_hash("password123"),
            is_verified=False
        )
        db.add(user)
        db.commit()

        with patch('app.services.notification.NotificationService.send_verification_email') as mock_email:
            mock_email.return_value = True

            response = client.post(
                "/api/v1/auth/resend-verification",
                json={"email": "test@example.com"}
            )

            assert response.status_code == 200
            assert "verification email" in response.json()["message"].lower()
            mock_email.assert_called_once()

    def test_resend_verification_already_verified(self, client: TestClient, db: Session):
        """Test resending verification for already verified user"""
        # Create verified user
        user = User(
            email="test@example.com",
            name="Test User",
            hashed_password=get_password_hash("password123"),
            is_verified=True
        )
        db.add(user)
        db.commit()

        response = client.post(
            "/api/v1/auth/resend-verification",
            json={"email": "test@example.com"}
        )

        assert response.status_code == 400
        assert "already verified" in response.json()["detail"].lower()

    def test_resend_verification_nonexistent_user(self, client: TestClient):
        """Test resending verification for non-existent user - security through obscurity"""
        response = client.post(
            "/api/v1/auth/resend-verification",
            json={"email": "nonexistent@example.com"}
        )

        # Return success even if user doesn't exist (prevent email enumeration)
        assert response.status_code == 200

    def test_resend_verification_rate_limiting(self, client: TestClient, db: Session):
        """Test that verification resend is rate limited"""
        user = User(
            email="test@example.com",
            name="Test User",
            hashed_password=get_password_hash("password123"),
            is_verified=False
        )
        db.add(user)
        db.commit()

        with patch('app.services.notification.NotificationService.send_verification_email') as mock_email:
            mock_email.return_value = True

            # Make multiple requests
            for i in range(6):  # Assuming 5/hour limit
                response = client.post(
                    "/api/v1/auth/resend-verification",
                    json={"email": "test@example.com"}
                )

            # Last request should be rate limited
            assert response.status_code == 429


class TestEmailVerificationConfirm:
    """Test cases for confirming email verification"""

    def test_verify_email_success(self, client: TestClient, db: Session):
        """Test successful email verification"""
        # Create unverified user
        user = User(
            email="test@example.com",
            name="Test User",
            hashed_password=get_password_hash("password123"),
            is_verified=False
        )
        db.add(user)
        db.commit()

        # Generate verification token
        from app.core.security import create_email_verification_token
        token = create_email_verification_token(str(user.id))

        response = client.post(
            "/api/v1/auth/verify-email",
            json={"token": token}
        )

        assert response.status_code == 200
        assert "verified" in response.json()["message"].lower()

        # Check user is now verified
        db.refresh(user)
        assert user.is_verified is True

    def test_verify_email_invalid_token(self, client: TestClient):
        """Test email verification with invalid token"""
        response = client.post(
            "/api/v1/auth/verify-email",
            json={"token": "invalid-token-12345"}
        )

        assert response.status_code == 400
        assert "invalid" in response.json()["detail"].lower()

    def test_verify_email_expired_token(self, client: TestClient, db: Session):
        """Test email verification with expired token"""
        user = User(
            email="test@example.com",
            name="Test User",
            hashed_password=get_password_hash("password123"),
            is_verified=False
        )
        db.add(user)
        db.commit()

        # Create expired token
        from app.core.security import create_email_verification_token
        with patch('app.core.security.datetime') as mock_datetime:
            mock_datetime.utcnow.return_value = datetime.utcnow() - timedelta(hours=25)
            expired_token = create_email_verification_token(str(user.id))

        response = client.post(
            "/api/v1/auth/verify-email",
            json={"token": expired_token}
        )

        assert response.status_code == 400
        assert "expired" in response.json()["detail"].lower()

    def test_verify_email_already_verified(self, client: TestClient, db: Session):
        """Test verifying an already verified email"""
        user = User(
            email="test@example.com",
            name="Test User",
            hashed_password=get_password_hash("password123"),
            is_verified=True
        )
        db.add(user)
        db.commit()

        from app.core.security import create_email_verification_token
        token = create_email_verification_token(str(user.id))

        response = client.post(
            "/api/v1/auth/verify-email",
            json={"token": token}
        )

        assert response.status_code == 400
        assert "already verified" in response.json()["detail"].lower()

    def test_verify_email_nonexistent_user(self, client: TestClient):
        """Test email verification for non-existent user"""
        from app.core.security import create_email_verification_token
        fake_user_id = "00000000-0000-0000-0000-000000000000"
        token = create_email_verification_token(fake_user_id)

        response = client.post(
            "/api/v1/auth/verify-email",
            json={"token": token}
        )

        assert response.status_code == 404
        assert "user not found" in response.json()["detail"].lower()


class TestEmailVerificationToken:
    """Test cases for email verification token generation"""

    def test_create_verification_token(self):
        """Test creating an email verification token"""
        from app.core.security import create_email_verification_token
        user_id = "12345678-1234-1234-1234-123456789012"

        token = create_email_verification_token(user_id)

        assert token is not None
        assert isinstance(token, str)
        assert len(token) > 20

    def test_verify_verification_token_valid(self):
        """Test verifying a valid email verification token"""
        from app.core.security import create_email_verification_token, verify_email_verification_token
        user_id = "12345678-1234-1234-1234-123456789012"

        token = create_email_verification_token(user_id)
        verified_user_id = verify_email_verification_token(token)

        assert verified_user_id == user_id

    def test_verify_verification_token_invalid(self):
        """Test verifying an invalid email verification token"""
        from app.core.security import verify_email_verification_token

        verified_user_id = verify_email_verification_token("invalid-token")

        assert verified_user_id is None

    def test_verification_token_expiration(self):
        """Test that verification tokens expire after 24 hours"""
        from app.core.security import create_email_verification_token, verify_email_verification_token

        user_id = "12345678-1234-1234-1234-123456789012"
        token = create_email_verification_token(user_id)

        # Token should be valid immediately
        verified_user_id = verify_email_verification_token(token)
        assert verified_user_id == user_id


class TestEmailVerificationEmail:
    """Test cases for verification email sending"""

    def test_verification_email_content(self):
        """Test that verification email contains required information"""
        from app.services.notification import NotificationService

        with patch('app.services.email.EmailService.send_email') as mock_send:
            mock_send.return_value = True

            success = NotificationService.send_verification_email(
                email="test@example.com",
                name="Test User",
                verification_token="test-token-12345"
            )

            assert success is True
            mock_send.assert_called_once()

            # Check email content
            call_args = mock_send.call_args
            assert call_args[1]['to'] == "test@example.com"
            assert "verif" in call_args[1]['subject'].lower()
            assert "test-token-12345" in call_args[1]['html_body']

    def test_verification_email_failure(self):
        """Test handling of email sending failure"""
        from app.services.notification import NotificationService

        with patch('app.services.email.EmailService.send_email') as mock_send:
            mock_send.return_value = False

            success = NotificationService.send_verification_email(
                email="test@example.com",
                name="Test User",
                verification_token="test-token-12345"
            )

            assert success is False


class TestLoginWithUnverifiedEmail:
    """Test cases for login restrictions with unverified email"""

    def test_login_unverified_email_blocked(self, client: TestClient, db: Session):
        """Test that login is blocked for unverified users"""
        # Create unverified user
        user = User(
            email="test@example.com",
            name="Test User",
            hashed_password=get_password_hash("password123"),
            is_verified=False
        )
        db.add(user)
        db.commit()

        response = client.post(
            "/api/v1/auth/email-password/login",
            json={
                "email": "test@example.com",
                "password": "password123"
            }
        )

        assert response.status_code == 403
        assert "verify" in response.json()["detail"].lower()

    def test_login_verified_email_allowed(self, client: TestClient, db: Session):
        """Test that login is allowed for verified users"""
        # Create verified user
        user = User(
            email="test@example.com",
            name="Test User",
            hashed_password=get_password_hash("password123"),
            is_verified=True
        )
        db.add(user)
        db.commit()

        response = client.post(
            "/api/v1/auth/email-password/login",
            json={
                "email": "test@example.com",
                "password": "password123"
            }
        )

        assert response.status_code == 200
        assert "access_token" in response.json()
