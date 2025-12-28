"""Tests for user timezone preference storage and retrieval"""
import pytest
from fastapi.testclient import TestClient
from sqlalchemy.orm import Session

from app.models.user import User


class TestTimezoneStorage:
    """Test timezone field in user model"""

    def test_user_has_timezone_field(self, db: Session):
        """User model should have timezone field"""
        user = User(
            email="test@example.com",
            name="Test User",
            password_hash="hash",
            timezone="America/New_York"
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        assert user.timezone == "America/New_York"

    def test_timezone_defaults_to_none(self, db: Session):
        """Timezone should default to None if not specified"""
        user = User(
            email="test2@example.com",
            name="Test User",
            password_hash="hash"
        )
        db.add(user)
        db.commit()
        db.refresh(user)

        assert user.timezone is None

    def test_timezone_can_be_updated(self, db: Session):
        """User should be able to update timezone"""
        user = User(
            email="test3@example.com",
            name="Test User",
            password_hash="hash",
            timezone="UTC"
        )
        db.add(user)
        db.commit()

        user.timezone = "Europe/London"
        db.commit()
        db.refresh(user)

        assert user.timezone == "Europe/London"

    def test_timezone_accepts_all_iana_zones(self, db: Session):
        """Should accept all valid IANA timezone strings"""
        timezones = [
            "America/New_York",
            "America/Los_Angeles",
            "Europe/London",
            "Europe/Paris",
            "Asia/Tokyo",
            "Australia/Sydney",
            "Pacific/Auckland",
            "UTC"
        ]

        for i, tz in enumerate(timezones):
            user = User(
                email=f"test{i}@example.com",
                name="Test User",
                password_hash="hash",
                timezone=tz
            )
            db.add(user)
            db.commit()
            db.refresh(user)

            assert user.timezone == tz


class TestTimezoneAPI:
    """Test timezone preference API endpoints"""

    def test_get_user_profile_includes_timezone(self, client: TestClient, auth_headers: dict):
        """GET /users/me should include timezone in response"""
        response = client.get("/api/v1/users/me", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert "timezone" in data

    def test_update_timezone_via_profile(self, client: TestClient, auth_headers: dict):
        """PATCH /users/me should allow updating timezone"""
        response = client.patch(
            "/api/v1/users/me",
            json={"timezone": "America/New_York"},
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["timezone"] == "America/New_York"

    def test_update_timezone_validates_iana_format(self, client: TestClient, auth_headers: dict):
        """Should reject invalid timezone strings"""
        response = client.patch(
            "/api/v1/users/me",
            json={"timezone": "Invalid/Timezone"},
            headers=auth_headers
        )

        assert response.status_code == 422  # Validation error

    def test_update_timezone_accepts_utc(self, client: TestClient, auth_headers: dict):
        """Should accept UTC as valid timezone"""
        response = client.patch(
            "/api/v1/users/me",
            json={"timezone": "UTC"},
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["timezone"] == "UTC"

    def test_update_timezone_accepts_common_zones(self, client: TestClient, auth_headers: dict):
        """Should accept common IANA timezones"""
        timezones = [
            "America/New_York",
            "America/Los_Angeles",
            "Europe/London",
            "Asia/Tokyo"
        ]

        for tz in timezones:
            response = client.patch(
                "/api/v1/users/me",
                json={"timezone": tz},
                headers=auth_headers
            )

            assert response.status_code == 200
            data = response.json()
            assert data["timezone"] == tz

    def test_clear_timezone_with_null(self, client: TestClient, auth_headers: dict):
        """Should allow clearing timezone by setting to null"""
        # First set a timezone
        client.patch(
            "/api/v1/users/me",
            json={"timezone": "America/New_York"},
            headers=auth_headers
        )

        # Then clear it
        response = client.patch(
            "/api/v1/users/me",
            json={"timezone": None},
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["timezone"] is None

    def test_timezone_persists_across_requests(self, client: TestClient, auth_headers: dict):
        """Timezone should persist after being set"""
        # Set timezone
        client.patch(
            "/api/v1/users/me",
            json={"timezone": "Europe/Paris"},
            headers=auth_headers
        )

        # Retrieve profile
        response = client.get("/api/v1/users/me", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert data["timezone"] == "Europe/Paris"


class TestTimezoneValidation:
    """Test timezone validation logic"""

    def test_validate_valid_timezones(self):
        """Should validate common IANA timezone strings"""
        from app.core.validators import validate_timezone

        valid_timezones = [
            "UTC",
            "America/New_York",
            "America/Los_Angeles",
            "Europe/London",
            "Europe/Paris",
            "Asia/Tokyo",
            "Asia/Shanghai",
            "Australia/Sydney",
            "Pacific/Auckland"
        ]

        for tz in valid_timezones:
            assert validate_timezone(tz) is True, f"{tz} should be valid"

    def test_reject_invalid_timezones(self):
        """Should reject invalid timezone strings"""
        from app.core.validators import validate_timezone

        invalid_timezones = [
            "Invalid/Timezone",
            "Not_A_Zone",
            "",
            "America/Fake_City",
            "123",
            "NotATimezone"
        ]

        for tz in invalid_timezones:
            assert validate_timezone(tz) is False, f"{tz} should be invalid"

    def test_validate_none_returns_true(self):
        """None should be valid (allows clearing timezone)"""
        from app.core.validators import validate_timezone

        assert validate_timezone(None) is True

    def test_validate_accepts_standard_formats(self):
        """Timezone validation should accept standard IANA formats"""
        from app.core.validators import validate_timezone

        # Standard IANA format
        assert validate_timezone("America/New_York") is True

        # pytz also accepts some variations
        # This test just verifies the validator works as expected
        assert validate_timezone("NotRealTimezone") is False


class TestTimezoneSchema:
    """Test timezone in user schema"""

    def test_user_response_schema_includes_timezone(self, client: TestClient, auth_headers: dict):
        """UserResponse schema should include timezone field"""
        response = client.get("/api/v1/users/me", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()

        # Check all expected fields
        assert "id" in data
        assert "email" in data
        assert "name" in data
        assert "timezone" in data

    def test_user_update_schema_accepts_timezone(self, client: TestClient, auth_headers: dict):
        """UserUpdate schema should accept timezone field"""
        response = client.patch(
            "/api/v1/users/me",
            json={
                "name": "Updated Name",
                "timezone": "America/Chicago"
            },
            headers=auth_headers
        )

        assert response.status_code == 200
        data = response.json()
        assert data["name"] == "Updated Name"
        assert data["timezone"] == "America/Chicago"
