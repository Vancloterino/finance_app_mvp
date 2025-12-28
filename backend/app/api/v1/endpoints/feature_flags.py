"""
Feature flag management endpoints.
"""
from typing import List
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.auth import get_current_user
from app.models.user import User
from app.services.feature_flags import FeatureFlagService
from app.schemas import feature_flag as schemas


router = APIRouter()


def get_feature_flag_service(db: Session = Depends(get_db)) -> FeatureFlagService:
    """Dependency to get feature flag service."""
    return FeatureFlagService(db)


@router.get("", response_model=List[schemas.FeatureFlag])
def list_feature_flags(
    service: FeatureFlagService = Depends(get_feature_flag_service),
    current_user: User = Depends(get_current_user)
):
    """
    List all feature flags.

    Note: In production, you might want to restrict this to admin users.
    """
    return service.get_all_flags()


@router.get("/{flag_name}", response_model=schemas.FeatureFlag)
def get_feature_flag(
    flag_name: str,
    service: FeatureFlagService = Depends(get_feature_flag_service),
    current_user: User = Depends(get_current_user)
):
    """Get a specific feature flag."""
    flag = service.get_flag(flag_name)
    if not flag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Feature flag '{flag_name}' not found"
        )
    return flag


@router.get("/{flag_name}/check", response_model=schemas.FeatureFlagCheck)
def check_feature_flag(
    flag_name: str,
    service: FeatureFlagService = Depends(get_feature_flag_service),
    current_user: User = Depends(get_current_user)
):
    """
    Check if a feature flag is enabled for the current user.
    """
    enabled = service.is_enabled_for_user(flag_name, str(current_user.id))
    return {"enabled": enabled}


@router.post("", response_model=schemas.FeatureFlag, status_code=status.HTTP_201_CREATED)
def create_feature_flag(
    flag: schemas.FeatureFlagCreate,
    service: FeatureFlagService = Depends(get_feature_flag_service),
    current_user: User = Depends(get_current_user)
):
    """
    Create a new feature flag.

    Note: In production, restrict this to admin users.
    """
    try:
        return service.create_flag(
            name=flag.name,
            enabled=flag.enabled,
            description=flag.description,
            rollout_percentage=flag.rollout_percentage
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.patch("/{flag_name}", response_model=schemas.FeatureFlag)
def update_feature_flag(
    flag_name: str,
    updates: schemas.FeatureFlagUpdate,
    service: FeatureFlagService = Depends(get_feature_flag_service),
    current_user: User = Depends(get_current_user)
):
    """
    Update a feature flag.

    Note: In production, restrict this to admin users.
    """
    flag = service.update_flag(
        flag_name=flag_name,
        enabled=updates.enabled,
        description=updates.description,
        rollout_percentage=updates.rollout_percentage
    )
    if not flag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Feature flag '{flag_name}' not found"
        )
    return flag


@router.delete("/{flag_name}", status_code=status.HTTP_204_NO_CONTENT)
def delete_feature_flag(
    flag_name: str,
    service: FeatureFlagService = Depends(get_feature_flag_service),
    current_user: User = Depends(get_current_user)
):
    """
    Delete a feature flag.

    Note: In production, restrict this to admin users.
    """
    deleted = service.delete_flag(flag_name)
    if not deleted:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Feature flag '{flag_name}' not found"
        )


@router.post("/{flag_name}/overrides", response_model=schemas.FeatureFlag)
def add_user_override(
    flag_name: str,
    override: schemas.UserOverride,
    service: FeatureFlagService = Depends(get_feature_flag_service),
    current_user: User = Depends(get_current_user)
):
    """
    Add or update a user-specific override.

    Note: In production, restrict this to admin users.
    """
    flag = service.add_user_override(flag_name, override.user_id, override.enabled)
    if not flag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Feature flag '{flag_name}' not found"
        )
    return flag


@router.delete("/{flag_name}/overrides/{user_id}", response_model=schemas.FeatureFlag)
def remove_user_override(
    flag_name: str,
    user_id: str,
    service: FeatureFlagService = Depends(get_feature_flag_service),
    current_user: User = Depends(get_current_user)
):
    """
    Remove a user-specific override.

    Note: In production, restrict this to admin users.
    """
    flag = service.remove_user_override(flag_name, user_id)
    if not flag:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail=f"Feature flag '{flag_name}' not found"
        )
    return flag
