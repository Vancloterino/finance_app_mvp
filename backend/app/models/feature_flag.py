"""
Feature flag model for gradual rollouts and A/B testing.
"""
from sqlalchemy import Column, String, Boolean, Integer, DateTime, JSON, Text
from sqlalchemy.sql import func
from app.core.database import Base


class FeatureFlag(Base):
    """
    Feature flag for controlling feature rollouts.

    Supports:
    - Global enable/disable
    - Percentage-based rollouts (0-100%)
    - User-specific overrides
    """
    __tablename__ = "feature_flags"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False, index=True)
    enabled = Column(Boolean, default=False, nullable=False)
    description = Column(Text, nullable=True)
    rollout_percentage = Column(Integer, default=0, nullable=False)  # 0-100
    user_overrides = Column(JSON, default=dict, nullable=False)  # {"user_id": true/false}
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
