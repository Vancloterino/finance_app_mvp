"""
Tests for feature flag system.

Tests feature flag storage, retrieval, user-specific overrides,
and percentage-based rollouts.
"""
import pytest
from datetime import datetime
from app.models.feature_flag import FeatureFlag
from app.services.feature_flags import FeatureFlagService
from app.core.database import get_db


class TestFeatureFlagModel:
    """Test FeatureFlag database model."""

    def test_create_feature_flag(self, db):
        """Test creating a feature flag."""
        flag = FeatureFlag(
            name="dark_mode_v2",
            enabled=True,
            description="New dark mode implementation",
            rollout_percentage=100
        )
        db.add(flag)
        db.commit()
        db.refresh(flag)

        assert flag.id is not None
        assert flag.name == "dark_mode_v2"
        assert flag.enabled is True
        assert flag.rollout_percentage == 100
        assert flag.created_at is not None

    def test_feature_flag_unique_name(self, db):
        """Test that feature flag names must be unique."""
        flag1 = FeatureFlag(name="test_feature", enabled=True)
        db.add(flag1)
        db.commit()

        flag2 = FeatureFlag(name="test_feature", enabled=False)
        db.add(flag2)

        with pytest.raises(Exception):  # IntegrityError
            db.commit()

    def test_feature_flag_default_values(self, db):
        """Test default values for feature flags."""
        flag = FeatureFlag(name="minimal_flag")
        db.add(flag)
        db.commit()
        db.refresh(flag)

        assert flag.enabled is False
        assert flag.rollout_percentage == 0
        assert flag.user_overrides == {}


class TestFeatureFlagService:
    """Test FeatureFlagService business logic."""

    def test_is_enabled_global_enabled(self, db):
        """Test flag enabled globally."""
        flag = FeatureFlag(name="global_feature", enabled=True, rollout_percentage=100)
        db.add(flag)
        db.commit()

        service = FeatureFlagService(db)
        assert service.is_enabled("global_feature") is True

    def test_is_enabled_global_disabled(self, db):
        """Test flag disabled globally."""
        flag = FeatureFlag(name="disabled_feature", enabled=False)
        db.add(flag)
        db.commit()

        service = FeatureFlagService(db)
        assert service.is_enabled("disabled_feature") is False

    def test_is_enabled_nonexistent_flag(self, db):
        """Test nonexistent flag returns False."""
        service = FeatureFlagService(db)
        assert service.is_enabled("nonexistent_flag") is False

    def test_is_enabled_for_user_override_true(self, db):
        """Test user-specific override to enable."""
        flag = FeatureFlag(
            name="beta_feature",
            enabled=False,
            user_overrides={"user-123": True, "user-456": False}
        )
        db.add(flag)
        db.commit()

        service = FeatureFlagService(db)
        assert service.is_enabled_for_user("beta_feature", "user-123") is True

    def test_is_enabled_for_user_override_false(self, db):
        """Test user-specific override to disable."""
        flag = FeatureFlag(
            name="rollout_feature",
            enabled=True,
            rollout_percentage=100,
            user_overrides={"user-456": False}
        )
        db.add(flag)
        db.commit()

        service = FeatureFlagService(db)
        assert service.is_enabled_for_user("rollout_feature", "user-456") is False

    def test_is_enabled_for_user_no_override(self, db):
        """Test user without override uses global setting."""
        flag = FeatureFlag(
            name="global_feature",
            enabled=True,
            rollout_percentage=100
        )
        db.add(flag)
        db.commit()

        service = FeatureFlagService(db)
        assert service.is_enabled_for_user("global_feature", "user-999") is True

    def test_rollout_percentage_deterministic(self, db):
        """Test percentage rollout is deterministic for same user."""
        flag = FeatureFlag(
            name="partial_rollout",
            enabled=True,
            rollout_percentage=50
        )
        db.add(flag)
        db.commit()

        service = FeatureFlagService(db)

        # Same user should get same result
        user_id = "consistent-user"
        result1 = service.is_enabled_for_user("partial_rollout", user_id)
        result2 = service.is_enabled_for_user("partial_rollout", user_id)
        assert result1 == result2

    def test_rollout_percentage_0(self, db):
        """Test 0% rollout disables for all users."""
        flag = FeatureFlag(
            name="no_rollout",
            enabled=True,
            rollout_percentage=0
        )
        db.add(flag)
        db.commit()

        service = FeatureFlagService(db)

        # Try multiple users - all should be disabled
        for i in range(10):
            assert service.is_enabled_for_user("no_rollout", f"user-{i}") is False

    def test_rollout_percentage_100(self, db):
        """Test 100% rollout enables for all users."""
        flag = FeatureFlag(
            name="full_rollout",
            enabled=True,
            rollout_percentage=100
        )
        db.add(flag)
        db.commit()

        service = FeatureFlagService(db)

        # Try multiple users - all should be enabled
        for i in range(10):
            assert service.is_enabled_for_user("full_rollout", f"user-{i}") is True

    def test_get_all_flags(self, db):
        """Test retrieving all feature flags."""
        flag1 = FeatureFlag(name="flag1", enabled=True)
        flag2 = FeatureFlag(name="flag2", enabled=False)
        db.add_all([flag1, flag2])
        db.commit()

        service = FeatureFlagService(db)
        flags = service.get_all_flags()

        assert len(flags) == 2
        assert any(f.name == "flag1" for f in flags)
        assert any(f.name == "flag2" for f in flags)

    def test_create_flag(self, db):
        """Test creating a new flag."""
        service = FeatureFlagService(db)
        flag = service.create_flag(
            name="new_feature",
            enabled=True,
            description="Test feature",
            rollout_percentage=50
        )

        assert flag.name == "new_feature"
        assert flag.enabled is True
        assert flag.rollout_percentage == 50

        # Verify it's in the database
        db_flag = db.query(FeatureFlag).filter_by(name="new_feature").first()
        assert db_flag is not None

    def test_update_flag(self, db):
        """Test updating an existing flag."""
        flag = FeatureFlag(name="update_test", enabled=False, rollout_percentage=0)
        db.add(flag)
        db.commit()

        service = FeatureFlagService(db)
        updated = service.update_flag("update_test", enabled=True, rollout_percentage=75)

        assert updated.enabled is True
        assert updated.rollout_percentage == 75

    def test_delete_flag(self, db):
        """Test deleting a flag."""
        flag = FeatureFlag(name="delete_test", enabled=True)
        db.add(flag)
        db.commit()

        service = FeatureFlagService(db)
        service.delete_flag("delete_test")

        # Verify it's gone
        db_flag = db.query(FeatureFlag).filter_by(name="delete_test").first()
        assert db_flag is None

    def test_add_user_override(self, db):
        """Test adding user override."""
        flag = FeatureFlag(name="override_test", enabled=False, user_overrides={})
        db.add(flag)
        db.commit()

        service = FeatureFlagService(db)
        service.add_user_override("override_test", "user-123", True)

        # Verify override was added
        updated_flag = db.query(FeatureFlag).filter_by(name="override_test").first()
        assert updated_flag.user_overrides.get("user-123") is True

    def test_remove_user_override(self, db):
        """Test removing user override."""
        flag = FeatureFlag(
            name="remove_override_test",
            enabled=True,
            user_overrides={"user-123": False}
        )
        db.add(flag)
        db.commit()

        service = FeatureFlagService(db)
        service.remove_user_override("remove_override_test", "user-123")

        # Verify override was removed
        updated_flag = db.query(FeatureFlag).filter_by(name="remove_override_test").first()
        assert "user-123" not in updated_flag.user_overrides


class TestFeatureFlagAPI:
    """Test feature flag API endpoints."""

    def test_get_flags_endpoint(self, client, auth_headers, db):
        """Test GET /api/v1/feature-flags endpoint."""
        flag1 = FeatureFlag(name="api_test_1", enabled=True)
        flag2 = FeatureFlag(name="api_test_2", enabled=False)
        db.add_all([flag1, flag2])
        db.commit()

        response = client.get("/api/v1/feature-flags", headers=auth_headers)

        assert response.status_code == 200
        data = response.json()
        assert len(data) >= 2
        assert any(f["name"] == "api_test_1" for f in data)

    def test_check_flag_endpoint(self, client, test_user, auth_headers, db):
        """Test GET /api/v1/feature-flags/{name}/check endpoint."""
        flag = FeatureFlag(name="user_check_test", enabled=True, rollout_percentage=100)
        db.add(flag)
        db.commit()

        response = client.get("/api/v1/feature-flags/user_check_test/check", headers=auth_headers)

        assert response.status_code == 200
        assert response.json()["enabled"] is True

    def test_create_flag_endpoint(self, client, auth_headers):
        """Test POST /api/v1/feature-flags endpoint."""
        response = client.post(
            "/api/v1/feature-flags",
            headers=auth_headers,
            json={
                "name": "api_created_flag",
                "enabled": True,
                "description": "Created via API",
                "rollout_percentage": 50
            }
        )

        assert response.status_code == 201
        data = response.json()
        assert data["name"] == "api_created_flag"
        assert data["enabled"] is True

    def test_update_flag_endpoint(self, client, auth_headers, db):
        """Test PATCH /api/v1/feature-flags/{name} endpoint."""
        flag = FeatureFlag(name="api_update_test", enabled=False)
        db.add(flag)
        db.commit()

        response = client.patch(
            "/api/v1/feature-flags/api_update_test",
            headers=auth_headers,
            json={"enabled": True, "rollout_percentage": 80}
        )

        assert response.status_code == 200
        data = response.json()
        assert data["enabled"] is True
        assert data["rollout_percentage"] == 80

    def test_delete_flag_endpoint(self, client, auth_headers, db):
        """Test DELETE /api/v1/feature-flags/{name} endpoint."""
        flag = FeatureFlag(name="api_delete_test", enabled=True)
        db.add(flag)
        db.commit()

        response = client.delete("/api/v1/feature-flags/api_delete_test", headers=auth_headers)

        assert response.status_code == 204
