"""
Tests for contact/support form submission.
"""
import pytest
from fastapi.testclient import TestClient
from unittest.mock import patch, MagicMock

class TestContactEndpoint:
    """Test cases for contact form endpoint"""

    def test_contact_form_submission_success(self, client: TestClient):
        """Test successful contact form submission"""
        contact_data = {
            "name": "John Doe",
            "email": "john@example.com",
            "subject": "Help with payment issue",
            "message": "I'm having trouble adding my credit card. Can you help?"
        }

        with patch('app.services.notification.NotificationService.send_support_email') as mock_send:
            mock_send.return_value = True

            response = client.post(
                "/api/v1/contact/submit",
                json=contact_data
            )

            assert response.status_code == 200
            assert response.json()["message"] == "Your message has been sent successfully"
            assert mock_send.called
            mock_send.assert_called_once()

    def test_contact_form_missing_required_fields(self, client: TestClient):
        """Test contact form with missing required fields"""
        # Missing email
        response = client.post(
            "/api/v1/contact/submit",
            json={
                "name": "John Doe",
                "subject": "Help",
                "message": "Test message"
            }
        )
        assert response.status_code == 422

        # Missing name
        response = client.post(
            "/api/v1/contact/submit",
            json={
                "email": "john@example.com",
                "subject": "Help",
                "message": "Test message"
            }
        )
        assert response.status_code == 422

        # Missing message
        response = client.post(
            "/api/v1/contact/submit",
            json={
                "name": "John Doe",
                "email": "john@example.com",
                "subject": "Help"
            }
        )
        assert response.status_code == 422

    def test_contact_form_invalid_email(self, client: TestClient):
        """Test contact form with invalid email format"""
        response = client.post(
            "/api/v1/contact/submit",
            json={
                "name": "John Doe",
                "email": "not-an-email",
                "subject": "Help",
                "message": "Test message"
            }
        )
        assert response.status_code == 422

    def test_contact_form_rate_limiting(self, client: TestClient):
        """Test that contact form has rate limiting"""
        contact_data = {
            "name": "John Doe",
            "email": "john@example.com",
            "subject": "Test",
            "message": "Test message"
        }

        with patch('app.services.notification.NotificationService.send_support_email') as mock_send:
            mock_send.return_value = True

            # Submit multiple times
            for i in range(6):
                response = client.post(
                    "/api/v1/contact/submit",
                    json=contact_data
                )
                # First 5 should succeed, 6th should be rate limited
                if i < 5:
                    assert response.status_code in [200, 429]
                else:
                    assert response.status_code == 429

    def test_contact_form_with_optional_fields(self, client: TestClient):
        """Test contact form with all optional fields"""
        contact_data = {
            "name": "John Doe",
            "email": "john@example.com",
            "subject": "Feature Request",
            "message": "It would be great if...",
            "phone": "+1234567890",
            "company": "Acme Corp"
        }

        with patch('app.services.notification.NotificationService.send_support_email') as mock_send:
            mock_send.return_value = True

            response = client.post(
                "/api/v1/contact/submit",
                json=contact_data
            )
            assert response.status_code == 200

    def test_contact_form_email_send_failure(self, client: TestClient):
        """Test handling when email sending fails"""
        contact_data = {
            "name": "John Doe",
            "email": "john@example.com",
            "subject": "Help",
            "message": "Test message"
        }

        with patch('app.services.notification.NotificationService.send_support_email') as mock_send:
            mock_send.side_effect = Exception("SMTP connection failed")

            response = client.post(
                "/api/v1/contact/submit",
                json=contact_data
            )
            # Should handle gracefully
            assert response.status_code in [500, 503]

    def test_contact_form_sanitizes_html(self, client: TestClient):
        """Test that contact form sanitizes HTML/script tags"""
        contact_data = {
            "name": "<script>alert('xss')</script>John",
            "email": "john@example.com",
            "subject": "<b>Important</b>",
            "message": "<script>alert('xss')</script>Please help"
        }

        with patch('app.services.notification.NotificationService.send_support_email') as mock_send:
            mock_send.return_value = True

            response = client.post(
                "/api/v1/contact/submit",
                json=contact_data
            )
            assert response.status_code == 200
            # Verify HTML was sanitized in the call
            call_args = mock_send.call_args
            assert "<script>" not in str(call_args)

    def test_contact_form_authenticated_user(self, client: TestClient, test_user_token: str):
        """Test contact form submission by authenticated user"""
        contact_data = {
            "name": "Authenticated User",
            "email": "auth@example.com",
            "subject": "Account Question",
            "message": "I have a question about my account"
        }

        with patch('app.services.notification.NotificationService.send_support_email') as mock_send:
            mock_send.return_value = True

            response = client.post(
                "/api/v1/contact/submit",
                json=contact_data,
                headers={"Authorization": f"Bearer {test_user_token}"}
            )
            assert response.status_code == 200
            # Should include user context in email
