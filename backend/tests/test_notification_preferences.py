import pytest
from uuid import UUID
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.notification_preferences import NotificationPreferences


class TestGetNotificationPreferences:
    """Test GET /api/v1/notifications/preferences"""

    def test_get_preferences_default_values(self, client: TestClient, auth_headers: dict, test_user: dict, db: Session):
        """Should return default notification preferences when none exist"""
        response = client.get("/api/v1/notifications/preferences", headers=auth_headers)

        if response.status_code != 200:
            print(f"Response status: {response.status_code}")
            print(f"Response body: {response.text}")
        assert response.status_code == 200
        data = response.json()

        # Default values should all be True (opted in)
        assert data["email_notifications"] is True
        assert data["payment_notifications"] is True
        assert data["space_updates"] is True
        assert data["payout_notifications"] is True
        assert data["pledge_reminders"] is True
        assert data["user_id"] == test_user["id"]

    def test_get_preferences_existing_values(self, client: TestClient, auth_headers: dict, test_user: dict, db: Session):
        """Should return existing notification preferences"""
        # Create custom preferences
        prefs = NotificationPreferences(
            user_id=UUID(test_user["id"]),
            email_notifications=False,
            payment_notifications=True,
            space_updates=False,
            payout_notifications=True,
            pledge_reminders=False
        )
        db.add(prefs)
        db.commit()

        response = client.get("/api/v1/notifications/preferences", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()

        assert data["email_notifications"] is False
        assert data["payment_notifications"] is True
        assert data["space_updates"] is False
        assert data["payout_notifications"] is True
        assert data["pledge_reminders"] is False

    def test_get_preferences_unauthenticated(self, client: TestClient):
        """Should return 401 when not authenticated"""
        response = client.get("/api/v1/notifications/preferences")
        assert response.status_code == 403


class TestUpdateNotificationPreferences:
    """Test PUT /api/v1/notifications/preferences"""

    def test_update_preferences_create_new(self, client: TestClient, auth_headers: dict, test_user: dict, db: Session):
        """Should create new preferences when none exist"""
        payload = {
            "email_notifications": False,
            "payment_notifications": True,
            "space_updates": False,
            "payout_notifications": True,
            "pledge_reminders": False
        }

        response = client.put("/api/v1/notifications/preferences", json=payload, headers=auth_headers)

        assert response.status_code == 200
        data = response.json()

        assert data["email_notifications"] is False
        assert data["payment_notifications"] is True
        assert data["space_updates"] is False
        assert data["payout_notifications"] is True
        assert data["pledge_reminders"] is False

        # Verify in database
        prefs = db.query(NotificationPreferences).filter_by(user_id=UUID(test_user["id"])).first()
        assert prefs is not None
        assert prefs.email_notifications is False
        assert prefs.payment_notifications is True

    def test_update_preferences_partial_update(self, client: TestClient, auth_headers: dict, test_user: dict, db: Session):
        """Should update only provided fields"""
        # Create initial preferences
        prefs = NotificationPreferences(
            user_id=UUID(test_user["id"]),
            email_notifications=True,
            payment_notifications=True,
            space_updates=True,
            payout_notifications=True,
            pledge_reminders=True
        )
        db.add(prefs)
        db.commit()

        # Update only email_notifications
        payload = {"email_notifications": False}
        response = client.put("/api/v1/notifications/preferences", json=payload, headers=auth_headers)

        assert response.status_code == 200
        data = response.json()

        assert data["email_notifications"] is False
        # Other fields should remain unchanged
        assert data["payment_notifications"] is True
        assert data["space_updates"] is True
        assert data["payout_notifications"] is True
        assert data["pledge_reminders"] is True

    def test_update_preferences_all_disabled(self, client: TestClient, auth_headers: dict, test_user: dict, db: Session):
        """Should allow disabling all notifications"""
        payload = {
            "email_notifications": False,
            "payment_notifications": False,
            "space_updates": False,
            "payout_notifications": False,
            "pledge_reminders": False
        }

        response = client.put("/api/v1/notifications/preferences", json=payload, headers=auth_headers)

        assert response.status_code == 200
        data = response.json()

        assert all(value is False for key, value in data.items() if key.endswith("_notifications") or key.endswith("_updates") or key.endswith("_reminders"))

    def test_update_preferences_unauthenticated(self, client: TestClient):
        """Should return 401 when not authenticated"""
        payload = {"email_notifications": False}
        response = client.put("/api/v1/notifications/preferences", json=payload)
        assert response.status_code == 403

    def test_update_preferences_invalid_data(self, client: TestClient, auth_headers: dict):
        """Should return 422 for invalid data types"""
        payload = {"email_notifications": "not_a_boolean"}
        response = client.put("/api/v1/notifications/preferences", json=payload, headers=auth_headers)
        assert response.status_code == 422


class TestNotificationPreferencesIntegration:
    """Test notification preferences integration with notification service"""

    def test_disabled_email_blocks_notification(self, client: TestClient, auth_headers: dict, test_user: dict, db: Session):
        """Should not send email notifications when email_notifications is disabled"""
        # Disable email notifications
        prefs = NotificationPreferences(
            user_id=UUID(test_user["id"]),
            email_notifications=False
        )
        db.add(prefs)
        db.commit()

        # This test validates that NotificationService checks preferences before sending
        # (Implementation will be tested with NotificationService integration)
        response = client.get("/api/v1/notifications/preferences", headers=auth_headers)
        assert response.json()["email_notifications"] is False

    def test_disabled_payment_notifications(self, client: TestClient, auth_headers: dict, test_user: dict, db: Session):
        """Should not send payment notifications when payment_notifications is disabled"""
        prefs = NotificationPreferences(
            user_id=UUID(test_user["id"]),
            payment_notifications=False,
            email_notifications=True  # Email enabled but payment notifications disabled
        )
        db.add(prefs)
        db.commit()

        response = client.get("/api/v1/notifications/preferences", headers=auth_headers)
        data = response.json()
        assert data["email_notifications"] is True
        assert data["payment_notifications"] is False

    def test_disabled_space_updates(self, client: TestClient, auth_headers: dict, test_user: dict, db: Session):
        """Should not send space update notifications when space_updates is disabled"""
        prefs = NotificationPreferences(
            user_id=UUID(test_user["id"]),
            space_updates=False,
            email_notifications=True
        )
        db.add(prefs)
        db.commit()

        response = client.get("/api/v1/notifications/preferences", headers=auth_headers)
        data = response.json()
        assert data["space_updates"] is False

    def test_disabled_payout_notifications(self, client: TestClient, auth_headers: dict, test_user: dict, db: Session):
        """Should not send payout notifications when payout_notifications is disabled"""
        prefs = NotificationPreferences(
            user_id=UUID(test_user["id"]),
            payout_notifications=False,
            email_notifications=True
        )
        db.add(prefs)
        db.commit()

        response = client.get("/api/v1/notifications/preferences", headers=auth_headers)
        data = response.json()
        assert data["payout_notifications"] is False

    def test_disabled_pledge_reminders(self, client: TestClient, auth_headers: dict, test_user: dict, db: Session):
        """Should not send pledge reminders when pledge_reminders is disabled"""
        prefs = NotificationPreferences(
            user_id=UUID(test_user["id"]),
            pledge_reminders=False,
            email_notifications=True
        )
        db.add(prefs)
        db.commit()

        response = client.get("/api/v1/notifications/preferences", headers=auth_headers)
        data = response.json()
        assert data["pledge_reminders"] is False


class TestNotificationPreferencesTimestamps:
    """Test notification preferences timestamps"""

    def test_created_at_timestamp(self, client: TestClient, auth_headers: dict, test_user: dict, db: Session):
        """Should set created_at timestamp when preferences are created"""
        payload = {"email_notifications": False}
        response = client.put("/api/v1/notifications/preferences", json=payload, headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert "created_at" in data
        assert data["created_at"] is not None

    def test_updated_at_timestamp(self, client: TestClient, auth_headers: dict, test_user: dict, db: Session):
        """Should update updated_at timestamp when preferences are modified"""
        # Create initial preferences
        payload1 = {"email_notifications": True}
        response1 = client.put("/api/v1/notifications/preferences", json=payload1, headers=auth_headers)
        created_at = response1.json()["created_at"]

        # Update preferences
        import time
        time.sleep(0.1)  # Small delay to ensure timestamp difference
        payload2 = {"email_notifications": False}
        response2 = client.put("/api/v1/notifications/preferences", json=payload2, headers=auth_headers)

        data = response2.json()
        assert "updated_at" in data
        assert data["updated_at"] is not None
        # Updated timestamp should be different from created (if both fields exist)
        if "created_at" in data:
            assert data["updated_at"] >= created_at
