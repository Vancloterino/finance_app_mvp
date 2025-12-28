"""
Tests for push notification service.

This module tests the backend push notification service that integrates
with Firebase Cloud Messaging (FCM) for sending push notifications to users.
"""

import pytest
from unittest.mock import Mock, patch, MagicMock
from datetime import datetime
from sqlalchemy.orm import Session

from app.services.push_notifications import PushNotificationService, NotificationType
from app.models.user import User
from app.models.push_token import PushToken


class TestPushNotificationService:
    """Test push notification service functionality."""

    @pytest.fixture
    def mock_db(self):
        """Create a mock database session."""
        return Mock(spec=Session)

    @pytest.fixture
    def service(self, mock_db):
        """Create a push notification service instance."""
        return PushNotificationService(mock_db, fcm_credentials_path="mock_path.json")

    @pytest.fixture
    def mock_user(self):
        """Create a mock user."""
        user = Mock(spec=User)
        user.id = "user-123"
        user.name = "Test User"
        user.email = "test@example.com"
        return user

    # Test 1: Service initialization
    def test_service_initialization(self, mock_db):
        """Test that service initializes correctly."""
        service = PushNotificationService(mock_db, fcm_credentials_path="test.json")
        assert service.db == mock_db
        assert service.fcm_credentials_path == "test.json"

    # Test 2: Service initialization without FCM credentials
    def test_service_initialization_without_credentials(self, mock_db):
        """Test that service can initialize without FCM credentials (disabled mode)."""
        service = PushNotificationService(mock_db)
        assert service.db == mock_db
        assert service.fcm_credentials_path is None
        assert not service.is_enabled()

    # Test 3: Check if service is enabled
    def test_service_is_enabled(self, mock_db):
        """Test that service reports enabled status correctly."""
        service = PushNotificationService(mock_db)
        # Without FCM credentials, service should not be enabled
        assert not service.is_enabled()

        # Manually set the app to simulate enabled state
        service._firebase_app = Mock()
        assert service.is_enabled()

    # Test 4: Register device token
    def test_register_device_token(self, service, mock_db, mock_user):
        """Test registering a device token for a user."""
        token = "test-fcm-token-123"
        device_type = "ios"

        # Mock query
        mock_query = Mock()
        mock_query.filter.return_value.first.return_value = None
        mock_db.query.return_value = mock_query

        result = service.register_device_token(mock_user.id, token, device_type)

        assert result is not None
        mock_db.add.assert_called_once()
        mock_db.commit.assert_called_once()

    # Test 5: Update existing device token
    def test_update_existing_device_token(self, service, mock_db, mock_user):
        """Test updating an existing device token."""
        token = "test-fcm-token-123"
        device_type = "android"

        # Mock existing token
        existing_token = Mock(spec=PushToken)
        existing_token.device_type = "ios"
        existing_token.is_active = False

        mock_query = Mock()
        mock_query.filter.return_value.first.return_value = existing_token
        mock_db.query.return_value = mock_query

        result = service.register_device_token(mock_user.id, token, device_type)

        assert existing_token.device_type == "android"
        assert existing_token.is_active is True
        mock_db.commit.assert_called_once()

    # Test 6: Unregister device token
    def test_unregister_device_token(self, service, mock_db, mock_user):
        """Test unregistering a device token."""
        token = "test-fcm-token-123"

        # Mock existing token
        existing_token = Mock(spec=PushToken)
        existing_token.is_active = True

        mock_query = Mock()
        mock_query.filter.return_value.first.return_value = existing_token
        mock_db.query.return_value = mock_query

        result = service.unregister_device_token(token)

        assert result is True
        assert existing_token.is_active is False
        mock_db.commit.assert_called_once()

    # Test 7: Unregister non-existent token
    def test_unregister_nonexistent_token(self, service, mock_db):
        """Test unregistering a token that doesn't exist."""
        token = "non-existent-token"

        mock_query = Mock()
        mock_query.filter.return_value.first.return_value = None
        mock_db.query.return_value = mock_query

        result = service.unregister_device_token(token)

        assert result is False
        mock_db.commit.assert_not_called()

    # Test 8: Get user tokens
    def test_get_user_tokens(self, service, mock_db, mock_user):
        """Test retrieving all active tokens for a user."""
        # Mock tokens
        token1 = Mock(spec=PushToken)
        token1.token = "token-1"
        token1.is_active = True

        token2 = Mock(spec=PushToken)
        token2.token = "token-2"
        token2.is_active = True

        mock_query = Mock()
        mock_query.filter.return_value.all.return_value = [token1, token2]
        mock_db.query.return_value = mock_query

        result = service.get_user_tokens(mock_user.id)

        assert len(result) == 2
        assert result[0].token == "token-1"
        assert result[1].token == "token-2"

    # Test 9: Send notification to single user
    def test_send_notification_to_user(self, mock_db, mock_user):
        """Test sending a push notification to a single user."""
        # Create service with mock Firebase app
        service = PushNotificationService(mock_db)
        service._firebase_app = Mock()  # Fake that Firebase is initialized

        # Mock user tokens
        token1 = Mock(spec=PushToken)
        token1.token = "token-1"

        mock_query = Mock()
        mock_query.filter.return_value.all.return_value = [token1]
        mock_db.query.return_value = mock_query

        # Mock the internal _send_to_token method
        with patch.object(service, '_send_to_token', return_value=True) as mock_send:
            result = service.send_notification(
                user_id=mock_user.id,
                title="Test Notification",
                body="This is a test",
                notification_type=NotificationType.PAYMENT
            )

            assert result["success"] == 1
            assert result["failure"] == 0
            mock_send.assert_called_once()

    # Test 10: Send notification with custom data
    def test_send_notification_with_data(self, mock_db, mock_user):
        """Test sending a notification with custom data payload."""
        service = PushNotificationService(mock_db)
        service._firebase_app = Mock()

        token1 = Mock(spec=PushToken)
        token1.token = "token-1"

        mock_query = Mock()
        mock_query.filter.return_value.all.return_value = [token1]
        mock_db.query.return_value = mock_query

        custom_data = {"space_id": "space-456", "amount": "100"}

        with patch.object(service, '_send_to_token', return_value=True) as mock_send:
            result = service.send_notification(
                user_id=mock_user.id,
                title="Payment Received",
                body="You received $100",
                notification_type=NotificationType.PAYMENT,
                data=custom_data
            )

            assert result["success"] == 1
            # Verify the method was called with correct arguments
            mock_send.assert_called_once()
            call_args = mock_send.call_args
            assert call_args[1]['notification_type'] == NotificationType.PAYMENT
            assert call_args[1]['data'] == custom_data

    # Test 11: Send notification to user with no tokens
    def test_send_notification_no_tokens(self, service, mock_db, mock_user):
        """Test sending notification to user with no registered tokens."""
        mock_query = Mock()
        mock_query.filter.return_value.all.return_value = []
        mock_db.query.return_value = mock_query

        result = service.send_notification(
            user_id=mock_user.id,
            title="Test",
            body="Test"
        )

        assert result["success"] == 0
        assert result["failure"] == 0

    # Test 12: Send notification with FCM error
    def test_send_notification_fcm_error(self, mock_db, mock_user):
        """Test handling FCM errors when sending notifications."""
        service = PushNotificationService(mock_db)
        service._firebase_app = Mock()

        token1 = Mock(spec=PushToken)
        token1.token = "token-1"
        token1.is_active = True

        mock_query = Mock()
        mock_query.filter.return_value.all.return_value = [token1]
        mock_db.query.return_value = mock_query

        # Mock FCM error
        with patch.object(service, '_send_to_token', side_effect=Exception("Invalid token")):
            result = service.send_notification(
                user_id=mock_user.id,
                title="Test",
                body="Test"
            )

            assert result["success"] == 0
            assert result["failure"] == 1
            # Token should be deactivated after error
            assert token1.is_active is False

    # Test 13: Send notification to multiple users
    def test_send_notification_to_multiple_users(self, mock_db):
        """Test sending notification to multiple users."""
        service = PushNotificationService(mock_db)
        service._firebase_app = Mock()

        user_ids = ["user-1", "user-2", "user-3"]

        # Mock tokens for each user
        def mock_filter(*args, **kwargs):
            mock = Mock()
            mock.all.return_value = [Mock(token=f"token-{i}") for i in range(2)]
            return mock

        mock_query = Mock()
        mock_query.filter = mock_filter
        mock_db.query.return_value = mock_query

        with patch.object(service, '_send_to_token', return_value=True):
            result = service.send_notification_to_multiple(
                user_ids=user_ids,
                title="Group Notification",
                body="This is for everyone"
            )

            assert result["success"] == 6  # 3 users * 2 tokens each
            assert result["failure"] == 0

    # Test 14: Send notification with badge count
    def test_send_notification_with_badge(self, mock_db, mock_user):
        """Test sending notification with iOS badge count."""
        service = PushNotificationService(mock_db)
        service._firebase_app = Mock()

        token1 = Mock(spec=PushToken)
        token1.token = "token-1"

        mock_query = Mock()
        mock_query.filter.return_value.all.return_value = [token1]
        mock_db.query.return_value = mock_query

        with patch.object(service, '_send_to_token', return_value=True) as mock_send:
            result = service.send_notification(
                user_id=mock_user.id,
                title="New Message",
                body="You have 5 unread messages",
                badge=5
            )

            assert result["success"] == 1
            # Verify badge was passed to the send method
            mock_send.assert_called_once()
            call_args = mock_send.call_args
            assert call_args[1]['badge'] == 5

    # Test 15: Send silent notification (data-only)
    def test_send_silent_notification(self, mock_db, mock_user):
        """Test sending a silent (data-only) notification."""
        service = PushNotificationService(mock_db)
        service._firebase_app = Mock()

        token1 = Mock(spec=PushToken)
        token1.token = "token-1"

        mock_query = Mock()
        mock_query.filter.return_value.all.return_value = [token1]
        mock_db.query.return_value = mock_query

        with patch.object(service, '_send_silent_to_token', return_value=True) as mock_send:
            result = service.send_silent_notification(
                user_id=mock_user.id,
                data={"sync": "true", "timestamp": "123456"}
            )

            assert result["success"] == 1
            # Verify silent method was called with data
            mock_send.assert_called_once()
            call_args = mock_send.call_args
            assert call_args[1]['data'] == {"sync": "true", "timestamp": "123456"}

    # Test 16: Get all tokens count
    def test_get_all_tokens_count(self, service, mock_db):
        """Test getting the total count of active tokens."""
        mock_query = Mock()
        mock_query.filter.return_value.count.return_value = 42
        mock_db.query.return_value = mock_query

        count = service.get_active_tokens_count()

        assert count == 42

    # Test 17: Clean up invalid tokens
    def test_cleanup_invalid_tokens(self, service, mock_db):
        """Test cleaning up invalid/expired tokens."""
        # Mock invalid tokens
        invalid_tokens = [
            Mock(spec=PushToken, id=1, is_active=True),
            Mock(spec=PushToken, id=2, is_active=True),
        ]

        mock_query = Mock()
        mock_query.filter.return_value.all.return_value = invalid_tokens
        mock_db.query.return_value = mock_query

        result = service.cleanup_invalid_tokens(token_ids=[1, 2])

        assert result == 2
        for token in invalid_tokens:
            assert token.is_active is False
        mock_db.commit.assert_called_once()

    # Test 18: Send notification when service is disabled
    def test_send_notification_when_disabled(self, mock_db, mock_user):
        """Test that sending notifications fails gracefully when service is disabled."""
        service = PushNotificationService(mock_db)  # No FCM credentials

        result = service.send_notification(
            user_id=mock_user.id,
            title="Test",
            body="Test"
        )

        assert result["success"] == 0
        assert result["failure"] == 0

    # Test 19: Notification type enum
    def test_notification_types(self):
        """Test that all notification types are defined."""
        assert NotificationType.PAYMENT == "payment"
        assert NotificationType.PAYOUT == "payout"
        assert NotificationType.SPACE == "space"
        assert NotificationType.PLEDGE == "pledge"
        assert NotificationType.GENERAL == "general"

    # Test 20: Send notification with sound
    def test_send_notification_with_sound(self, mock_db, mock_user):
        """Test sending notification with custom sound."""
        service = PushNotificationService(mock_db)
        service._firebase_app = Mock()

        token1 = Mock(spec=PushToken)
        token1.token = "token-1"

        mock_query = Mock()
        mock_query.filter.return_value.all.return_value = [token1]
        mock_db.query.return_value = mock_query

        with patch.object(service, '_send_to_token', return_value=True) as mock_send:
            result = service.send_notification(
                user_id=mock_user.id,
                title="Alert",
                body="Important notification",
                sound="alert.wav"
            )

            assert result["success"] == 1
            # Verify sound was passed to the send method
            mock_send.assert_called_once()
            call_args = mock_send.call_args
            assert call_args[1]['sound'] == "alert.wav"
