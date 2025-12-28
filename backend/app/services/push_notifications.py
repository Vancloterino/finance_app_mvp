"""
Push Notification Service

Handles sending push notifications via Firebase Cloud Messaging (FCM).
"""

from enum import Enum
from typing import Optional, Dict, List, Any
from sqlalchemy.orm import Session
import logging

from app.models.push_token import PushToken

logger = logging.getLogger(__name__)


class NotificationType(str, Enum):
    """Notification type categories."""
    PAYMENT = "payment"
    PAYOUT = "payout"
    SPACE = "space"
    PLEDGE = "pledge"
    GENERAL = "general"


class PushNotificationService:
    """
    Service for managing push notifications via Firebase Cloud Messaging.

    Handles device token registration, notification sending, and token management.
    """

    def __init__(self, db: Session, fcm_credentials_path: Optional[str] = None):
        """
        Initialize the push notification service.

        Args:
            db: Database session
            fcm_credentials_path: Path to FCM service account JSON file
        """
        self.db = db
        self.fcm_credentials_path = fcm_credentials_path
        self._firebase_app = None

        # Initialize Firebase if credentials provided
        if fcm_credentials_path:
            self._init_firebase()

    def _init_firebase(self):
        """Initialize Firebase Admin SDK."""
        try:
            import firebase_admin
            from firebase_admin import credentials

            # Check if already initialized
            try:
                self._firebase_app = firebase_admin.get_app()
                logger.info("Firebase already initialized")
            except ValueError:
                # Not initialized yet, initialize now
                cred = credentials.Certificate(self.fcm_credentials_path)
                self._firebase_app = firebase_admin.initialize_app(cred)
                logger.info("Firebase initialized successfully")
        except Exception as e:
            logger.error(f"Failed to initialize Firebase: {e}")
            self._firebase_app = None

    def is_enabled(self) -> bool:
        """Check if push notifications are enabled."""
        return self._firebase_app is not None

    def register_device_token(
        self,
        user_id: str,
        token: str,
        device_type: str
    ) -> Optional[PushToken]:
        """
        Register or update a device token for push notifications.

        Args:
            user_id: User ID
            token: FCM device token
            device_type: Device type ('ios', 'android', 'web')

        Returns:
            PushToken instance or None
        """
        try:
            # Check if token already exists
            existing = self.db.query(PushToken).filter(
                PushToken.token == token
            ).first()

            if existing:
                # Update existing token
                existing.device_type = device_type
                existing.is_active = True
                existing.user_id = user_id
                self.db.commit()
                self.db.refresh(existing)
                return existing

            # Create new token
            push_token = PushToken(
                user_id=user_id,
                token=token,
                device_type=device_type,
                is_active=True
            )
            self.db.add(push_token)
            self.db.commit()
            self.db.refresh(push_token)
            return push_token

        except Exception as e:
            logger.error(f"Failed to register device token: {e}")
            self.db.rollback()
            return None

    def unregister_device_token(self, token: str) -> bool:
        """
        Unregister (deactivate) a device token.

        Args:
            token: FCM device token

        Returns:
            True if successful, False otherwise
        """
        try:
            push_token = self.db.query(PushToken).filter(
                PushToken.token == token
            ).first()

            if not push_token:
                return False

            push_token.is_active = False
            self.db.commit()
            return True

        except Exception as e:
            logger.error(f"Failed to unregister device token: {e}")
            self.db.rollback()
            return False

    def get_user_tokens(self, user_id: str) -> List[PushToken]:
        """
        Get all active device tokens for a user.

        Args:
            user_id: User ID

        Returns:
            List of PushToken instances
        """
        return self.db.query(PushToken).filter(
            PushToken.user_id == user_id,
            PushToken.is_active == True
        ).all()

    def send_notification(
        self,
        user_id: str,
        title: str,
        body: str,
        notification_type: Optional[NotificationType] = None,
        data: Optional[Dict[str, str]] = None,
        badge: Optional[int] = None,
        sound: Optional[str] = None
    ) -> Dict[str, int]:
        """
        Send a push notification to a user.

        Args:
            user_id: User ID
            title: Notification title
            body: Notification body
            notification_type: Type of notification
            data: Additional data payload
            badge: iOS badge count
            sound: Sound file name

        Returns:
            Dict with 'success' and 'failure' counts
        """
        if not self.is_enabled():
            logger.warning("Push notifications are disabled")
            return {"success": 0, "failure": 0}

        # Get user's active tokens
        tokens = self.get_user_tokens(user_id)

        if not tokens:
            logger.info(f"No active tokens found for user {user_id}")
            return {"success": 0, "failure": 0}

        success_count = 0
        failure_count = 0

        for push_token in tokens:
            try:
                result = self._send_to_token(
                    token=push_token.token,
                    title=title,
                    body=body,
                    notification_type=notification_type,
                    data=data,
                    badge=badge,
                    sound=sound
                )

                if result:
                    success_count += 1
                else:
                    failure_count += 1
                    # Deactivate failed token
                    push_token.is_active = False

            except Exception as e:
                logger.error(f"Failed to send notification to token {push_token.token}: {e}")
                failure_count += 1
                push_token.is_active = False

        # Commit token status updates
        self.db.commit()

        return {"success": success_count, "failure": failure_count}

    def send_notification_to_multiple(
        self,
        user_ids: List[str],
        title: str,
        body: str,
        notification_type: Optional[NotificationType] = None,
        data: Optional[Dict[str, str]] = None,
        badge: Optional[int] = None,
        sound: Optional[str] = None
    ) -> Dict[str, int]:
        """
        Send a push notification to multiple users.

        Args:
            user_ids: List of user IDs
            title: Notification title
            body: Notification body
            notification_type: Type of notification
            data: Additional data payload
            badge: iOS badge count
            sound: Sound file name

        Returns:
            Dict with 'success' and 'failure' counts
        """
        total_success = 0
        total_failure = 0

        for user_id in user_ids:
            result = self.send_notification(
                user_id=user_id,
                title=title,
                body=body,
                notification_type=notification_type,
                data=data,
                badge=badge,
                sound=sound
            )
            total_success += result["success"]
            total_failure += result["failure"]

        return {"success": total_success, "failure": total_failure}

    def send_silent_notification(
        self,
        user_id: str,
        data: Dict[str, str]
    ) -> Dict[str, int]:
        """
        Send a silent (data-only) notification to a user.

        Args:
            user_id: User ID
            data: Data payload

        Returns:
            Dict with 'success' and 'failure' counts
        """
        if not self.is_enabled():
            logger.warning("Push notifications are disabled")
            return {"success": 0, "failure": 0}

        tokens = self.get_user_tokens(user_id)

        if not tokens:
            return {"success": 0, "failure": 0}

        success_count = 0
        failure_count = 0

        for push_token in tokens:
            try:
                result = self._send_silent_to_token(
                    token=push_token.token,
                    data=data
                )

                if result:
                    success_count += 1
                else:
                    failure_count += 1
                    push_token.is_active = False

            except Exception as e:
                logger.error(f"Failed to send silent notification: {e}")
                failure_count += 1
                push_token.is_active = False

        self.db.commit()

        return {"success": success_count, "failure": failure_count}

    def _send_to_token(
        self,
        token: str,
        title: str,
        body: str,
        notification_type: Optional[NotificationType] = None,
        data: Optional[Dict[str, str]] = None,
        badge: Optional[int] = None,
        sound: Optional[str] = None
    ) -> bool:
        """Send notification to a specific token."""
        try:
            from firebase_admin import messaging

            # Build notification
            notification = messaging.Notification(
                title=title,
                body=body
            )

            # Build data payload
            payload_data = data or {}
            if notification_type:
                payload_data["type"] = notification_type.value

            # Build APNS config (iOS)
            apns_config = messaging.APNSConfig(
                payload=messaging.APNSPayload(
                    aps=messaging.Aps(
                        badge=badge,
                        sound=sound or "default"
                    )
                )
            )

            # Build Android config
            android_config = messaging.AndroidConfig(
                notification=messaging.AndroidNotification(
                    sound=sound or "default"
                )
            )

            # Build message
            message = messaging.Message(
                notification=notification,
                data=payload_data if payload_data else None,
                token=token,
                apns=apns_config,
                android=android_config
            )

            # Send message
            response = messaging.send(message)
            logger.info(f"Successfully sent message: {response}")
            return True

        except Exception as e:
            from firebase_admin import exceptions

            # Handle specific FCM errors
            if isinstance(e, (exceptions.InvalidArgumentError, exceptions.NotFoundError)):
                logger.warning(f"Invalid or unregistered token: {token}")
            else:
                logger.error(f"Failed to send notification: {e}")

            return False

    def _send_silent_to_token(
        self,
        token: str,
        data: Dict[str, str]
    ) -> bool:
        """Send silent (data-only) notification to a specific token."""
        try:
            from firebase_admin import messaging

            # Build message (no notification, only data)
            message = messaging.Message(
                data=data,
                token=token
            )

            # Send message
            response = messaging.send(message)
            logger.info(f"Successfully sent silent message: {response}")
            return True

        except Exception as e:
            logger.error(f"Failed to send silent notification: {e}")
            return False

    def get_active_tokens_count(self) -> int:
        """Get the total count of active tokens."""
        return self.db.query(PushToken).filter(
            PushToken.is_active == True
        ).count()

    def cleanup_invalid_tokens(self, token_ids: List[int]) -> int:
        """
        Clean up invalid or expired tokens.

        Args:
            token_ids: List of token IDs to deactivate

        Returns:
            Number of tokens cleaned up
        """
        try:
            tokens = self.db.query(PushToken).filter(
                PushToken.id.in_(token_ids),
                PushToken.is_active == True
            ).all()

            count = len(tokens)

            for token in tokens:
                token.is_active = False

            self.db.commit()
            logger.info(f"Cleaned up {count} invalid tokens")
            return count

        except Exception as e:
            logger.error(f"Failed to cleanup tokens: {e}")
            self.db.rollback()
            return 0
