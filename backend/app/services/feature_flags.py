"""
Feature flag service for managing feature rollouts.
"""
import hashlib
from typing import Optional, List, Dict, Any
from sqlalchemy.orm import Session
from app.models.feature_flag import FeatureFlag


class FeatureFlagService:
    """Service for feature flag operations."""

    def __init__(self, db: Session):
        self.db = db

    def is_enabled(self, flag_name: str) -> bool:
        """
        Check if a feature flag is enabled globally.

        Args:
            flag_name: Name of the feature flag

        Returns:
            True if enabled, False otherwise
        """
        flag = self.db.query(FeatureFlag).filter_by(name=flag_name).first()
        if not flag:
            return False
        return flag.enabled and flag.rollout_percentage == 100

    def is_enabled_for_user(self, flag_name: str, user_id: str) -> bool:
        """
        Check if a feature flag is enabled for a specific user.

        Checks in order:
        1. User-specific override
        2. Percentage-based rollout (deterministic based on user_id)
        3. Global enabled status

        Args:
            flag_name: Name of the feature flag
            user_id: User ID to check

        Returns:
            True if enabled for this user, False otherwise
        """
        flag = self.db.query(FeatureFlag).filter_by(name=flag_name).first()
        if not flag:
            return False

        # If flag is globally disabled, only user overrides can enable it
        if not flag.enabled:
            return flag.user_overrides.get(user_id, False)

        # Check user-specific override first
        if user_id in flag.user_overrides:
            return flag.user_overrides[user_id]

        # Use percentage-based rollout (deterministic)
        if flag.rollout_percentage == 0:
            return False
        if flag.rollout_percentage == 100:
            return True

        # Hash user_id + flag_name for deterministic percentage
        hash_input = f"{flag_name}:{user_id}".encode()
        hash_value = int(hashlib.md5(hash_input).hexdigest(), 16)
        user_percentage = hash_value % 100

        return user_percentage < flag.rollout_percentage

    def get_all_flags(self) -> List[FeatureFlag]:
        """Get all feature flags."""
        return self.db.query(FeatureFlag).all()

    def get_flag(self, flag_name: str) -> Optional[FeatureFlag]:
        """Get a specific feature flag by name."""
        return self.db.query(FeatureFlag).filter_by(name=flag_name).first()

    def create_flag(
        self,
        name: str,
        enabled: bool = False,
        description: Optional[str] = None,
        rollout_percentage: int = 0
    ) -> FeatureFlag:
        """
        Create a new feature flag.

        Args:
            name: Unique flag name
            enabled: Whether flag is enabled
            description: Optional description
            rollout_percentage: Percentage of users to enable (0-100)

        Returns:
            Created FeatureFlag
        """
        flag = FeatureFlag(
            name=name,
            enabled=enabled,
            description=description,
            rollout_percentage=rollout_percentage,
            user_overrides={}
        )
        self.db.add(flag)
        self.db.commit()
        self.db.refresh(flag)
        return flag

    def update_flag(
        self,
        flag_name: str,
        enabled: Optional[bool] = None,
        description: Optional[str] = None,
        rollout_percentage: Optional[int] = None
    ) -> Optional[FeatureFlag]:
        """
        Update an existing feature flag.

        Args:
            flag_name: Name of flag to update
            enabled: New enabled status
            description: New description
            rollout_percentage: New rollout percentage

        Returns:
            Updated FeatureFlag or None if not found
        """
        flag = self.get_flag(flag_name)
        if not flag:
            return None

        if enabled is not None:
            flag.enabled = enabled
        if description is not None:
            flag.description = description
        if rollout_percentage is not None:
            flag.rollout_percentage = rollout_percentage

        self.db.commit()
        self.db.refresh(flag)
        return flag

    def delete_flag(self, flag_name: str) -> bool:
        """
        Delete a feature flag.

        Args:
            flag_name: Name of flag to delete

        Returns:
            True if deleted, False if not found
        """
        flag = self.get_flag(flag_name)
        if not flag:
            return False

        self.db.delete(flag)
        self.db.commit()
        return True

    def add_user_override(self, flag_name: str, user_id: str, enabled: bool) -> Optional[FeatureFlag]:
        """
        Add or update a user-specific override.

        Args:
            flag_name: Name of the flag
            user_id: User ID
            enabled: Whether to enable for this user

        Returns:
            Updated FeatureFlag or None if not found
        """
        flag = self.get_flag(flag_name)
        if not flag:
            return None

        # Update user_overrides dict
        if flag.user_overrides is None:
            flag.user_overrides = {}

        # Create a new dict to force SQLAlchemy to detect the change
        new_overrides = dict(flag.user_overrides)
        new_overrides[user_id] = enabled
        flag.user_overrides = new_overrides

        # Mark the flag as modified
        from sqlalchemy.orm.attributes import flag_modified
        flag_modified(flag, "user_overrides")

        self.db.commit()
        self.db.refresh(flag)
        return flag

    def remove_user_override(self, flag_name: str, user_id: str) -> Optional[FeatureFlag]:
        """
        Remove a user-specific override.

        Args:
            flag_name: Name of the flag
            user_id: User ID

        Returns:
            Updated FeatureFlag or None if not found
        """
        flag = self.get_flag(flag_name)
        if not flag or not flag.user_overrides:
            return flag

        if user_id in flag.user_overrides:
            # Create a new dict without the user_id
            new_overrides = dict(flag.user_overrides)
            del new_overrides[user_id]
            flag.user_overrides = new_overrides

            # Mark the flag as modified
            from sqlalchemy.orm.attributes import flag_modified
            flag_modified(flag, "user_overrides")

            self.db.commit()
            self.db.refresh(flag)

        return flag

    def get_user_flags(self, user_id: str) -> Dict[str, bool]:
        """
        Get all feature flags evaluated for a specific user.

        Args:
            user_id: User ID

        Returns:
            Dictionary mapping flag names to enabled status
        """
        flags = self.get_all_flags()
        return {
            flag.name: self.is_enabled_for_user(flag.name, user_id)
            for flag in flags
        }
