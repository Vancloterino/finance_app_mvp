"""
Feature flag schemas for API requests/responses.
"""
from pydantic import BaseModel, Field
from typing import Optional, Dict
from datetime import datetime


class FeatureFlagBase(BaseModel):
    """Base feature flag schema."""
    name: str = Field(..., min_length=1, max_length=100)
    enabled: bool = False
    description: Optional[str] = None
    rollout_percentage: int = Field(default=0, ge=0, le=100)


class FeatureFlagCreate(FeatureFlagBase):
    """Schema for creating a feature flag."""
    pass


class FeatureFlagUpdate(BaseModel):
    """Schema for updating a feature flag."""
    enabled: Optional[bool] = None
    description: Optional[str] = None
    rollout_percentage: Optional[int] = Field(default=None, ge=0, le=100)


class FeatureFlag(FeatureFlagBase):
    """Schema for feature flag response."""
    id: int
    user_overrides: Dict[str, bool] = Field(default_factory=dict)
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class FeatureFlagCheck(BaseModel):
    """Schema for checking if a flag is enabled."""
    enabled: bool


class UserOverride(BaseModel):
    """Schema for adding/updating user override."""
    user_id: str
    enabled: bool
