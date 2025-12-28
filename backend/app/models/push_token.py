"""
Push Token Model

Stores device tokens for push notifications (FCM).
"""

from sqlalchemy import Column, String, Boolean, DateTime, ForeignKey, Integer
from sqlalchemy.sql import func
from app.core.database import Base


class PushToken(Base):
    """Push notification device token."""

    __tablename__ = "push_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(String(36), ForeignKey("users.id", ondelete="CASCADE"), nullable=False, index=True)
    token = Column(String(255), unique=True, nullable=False, index=True)
    device_type = Column(String(20), nullable=False)  # 'ios', 'android', 'web'
    is_active = Column(Boolean, default=True, nullable=False, index=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now(), nullable=False)
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    def __repr__(self):
        return f"<PushToken(id={self.id}, user_id={self.user_id}, device_type={self.device_type}, active={self.is_active})>"
