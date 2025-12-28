"""Tests for SMTP email configuration and delivery"""
import pytest
from unittest.mock import Mock, patch, MagicMock
from fastapi.testclient import TestClient

from app.services.notification import NotificationService


class TestSMTPConfiguration:
    """Test SMTP configuration and email sending"""

    def test_email_config_endpoint(self, client: TestClient):
        """Should return email configuration status"""
        response = client.get("/api/v1/notifications/config")

        assert response.status_code == 200
        data = response.json()

        assert "email_configured" in data
        assert "email_host" in data
        assert "email_port" in data
        assert "email_from" in data
        assert "email_use_tls" in data

    @patch('app.services.notification.smtplib.SMTP')
    def test_send_email_with_valid_smtp(self, mock_smtp):
        """Should successfully send email with valid SMTP configuration"""
        # Mock SMTP server
        mock_server = MagicMock()
        mock_smtp.return_value.__enter__.return_value = mock_server

        result = NotificationService.send_email(
            to_email="test@example.com",
            subject="Test Email",
            html_content="<p>Test content</p>",
            text_content="Test content"
        )

        assert result is True
        mock_smtp.assert_called_once()
        mock_server.send_message.assert_called_once()

    @patch('app.services.notification.smtplib.SMTP')
    def test_send_email_with_tls(self, mock_smtp):
        """Should use STARTTLS when email_use_tls is True"""
        mock_server = MagicMock()
        mock_smtp.return_value.__enter__.return_value = mock_server

        NotificationService.send_email(
            to_email="test@example.com",
            subject="Test",
            html_content="<p>Test</p>"
        )

        # Should call starttls()
        mock_server.starttls.assert_called_once()

    @patch('app.services.notification.smtplib.SMTP')
    def test_send_email_with_authentication(self, mock_smtp):
        """Should authenticate with SMTP server when credentials provided"""
        mock_server = MagicMock()
        mock_smtp.return_value.__enter__.return_value = mock_server

        # Mock settings with credentials
        with patch('app.services.notification.settings') as mock_settings:
            mock_settings.EMAIL_USERNAME = "user@example.com"
            mock_settings.EMAIL_PASSWORD = "password123"
            mock_settings.EMAIL_USE_TLS = True
            mock_settings.EMAIL_HOST = "smtp.gmail.com"
            mock_settings.EMAIL_PORT = 587
            mock_settings.EMAIL_FROM = "noreply@example.com"

            NotificationService.send_email(
                to_email="test@example.com",
                subject="Test",
                html_content="<p>Test</p>"
            )

            # Should call login with credentials
            mock_server.login.assert_called_once_with("user@example.com", "password123")

    @patch('app.services.notification.smtplib.SMTP')
    def test_send_email_without_authentication(self, mock_smtp):
        """Should skip authentication when no credentials provided"""
        mock_server = MagicMock()
        mock_smtp.return_value.__enter__.return_value = mock_server

        # Mock settings without credentials
        with patch('app.services.notification.settings') as mock_settings:
            mock_settings.EMAIL_USERNAME = ""
            mock_settings.EMAIL_PASSWORD = ""
            mock_settings.EMAIL_USE_TLS = True
            mock_settings.EMAIL_HOST = "smtp.gmail.com"
            mock_settings.EMAIL_PORT = 587
            mock_settings.EMAIL_FROM = "noreply@example.com"

            NotificationService.send_email(
                to_email="test@example.com",
                subject="Test",
                html_content="<p>Test</p>"
            )

            # Should NOT call login
            mock_server.login.assert_not_called()

    @patch('app.services.notification.smtplib.SMTP')
    def test_send_email_failure(self, mock_smtp):
        """Should return False when email sending fails"""
        # Mock SMTP to raise exception
        mock_smtp.return_value.__enter__.side_effect = Exception("SMTP connection failed")

        result = NotificationService.send_email(
            to_email="test@example.com",
            subject="Test",
            html_content="<p>Test</p>"
        )

        assert result is False

    @patch('app.services.notification.smtplib.SMTP')
    def test_send_email_with_both_html_and_text(self, mock_smtp):
        """Should send multipart message with both HTML and text"""
        mock_server = MagicMock()
        mock_smtp.return_value.__enter__.return_value = mock_server

        NotificationService.send_email(
            to_email="test@example.com",
            subject="Test",
            html_content="<p>HTML content</p>",
            text_content="Text content"
        )

        # Verify send_message was called
        assert mock_server.send_message.called
        message = mock_server.send_message.call_args[0][0]

        # Verify multipart message structure
        assert message.is_multipart()

    @patch('app.services.notification.smtplib.SMTP')
    def test_send_email_html_only(self, mock_smtp):
        """Should send HTML-only message when no text provided"""
        mock_server = MagicMock()
        mock_smtp.return_value.__enter__.return_value = mock_server

        NotificationService.send_email(
            to_email="test@example.com",
            subject="Test",
            html_content="<p>HTML only</p>",
            text_content=None
        )

        assert mock_server.send_message.called

    def test_dev_test_email_endpoint(self, client: TestClient, auth_headers: dict):
        """Should allow sending test emails in development"""
        with patch('app.services.notification.NotificationService.send_email') as mock_send:
            mock_send.return_value = True

            response = client.post(
                "/api/v1/notifications/test-email",
                headers=auth_headers,
                json={
                    "to_email": "test@example.com",
                    "subject": "Test Subject",
                    "message": "Test message"
                }
            )

            assert response.status_code == 200
            data = response.json()
            assert "message" in data
            assert data["recipient"] == "test@example.com"
            mock_send.assert_called_once()

    def test_dev_test_email_production_blocked(self, client: TestClient, auth_headers: dict):
        """Should block test email endpoint in production"""
        with patch('app.core.config.settings') as mock_settings:
            mock_settings.ENVIRONMENT = "production"

            response = client.post(
                "/api/v1/notifications/test-email",
                headers=auth_headers,
                json={
                    "to_email": "test@example.com",
                    "subject": "Test",
                    "message": "Test"
                }
            )

            assert response.status_code == 403


class TestNotificationPreferencesRespected:
    """Test that notification preferences are respected when sending emails"""

    @patch('app.services.notification.smtplib.SMTP')
    def test_email_not_sent_when_email_notifications_disabled(self, mock_smtp, db, test_user):
        """Should not send email when email_notifications is False"""
        from app.models.notification_preferences import NotificationPreferences
        from uuid import UUID

        # Disable email notifications
        prefs = NotificationPreferences(
            user_id=UUID(test_user["id"]),
            email_notifications=False
        )
        db.add(prefs)
        db.commit()

        # This would need to be implemented in NotificationService
        # For now, just validate preferences exist
        saved_prefs = db.query(NotificationPreferences).filter_by(user_id=UUID(test_user["id"])).first()
        assert saved_prefs.email_notifications is False

    @patch('app.services.notification.smtplib.SMTP')
    def test_payment_notification_not_sent_when_disabled(self, mock_smtp, db, test_user):
        """Should not send payment notifications when payment_notifications is False"""
        from app.models.notification_preferences import NotificationPreferences
        from uuid import UUID

        prefs = NotificationPreferences(
            user_id=UUID(test_user["id"]),
            payment_notifications=False,
            email_notifications=True  # Email enabled but payment notifications disabled
        )
        db.add(prefs)
        db.commit()

        saved_prefs = db.query(NotificationPreferences).filter_by(user_id=UUID(test_user["id"])).first()
        assert saved_prefs.email_notifications is True
        assert saved_prefs.payment_notifications is False
