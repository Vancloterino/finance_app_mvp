from sqlalchemy import Column, Boolean, DateTime, ForeignKey
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func

from app.core.database import Base


class NotificationPreferences(Base):
    """User notification preferences model"""
    __tablename__ = "notification_preferences"

    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True)

    # Notification type preferences
    email_notifications = Column(Boolean, default=True, nullable=False)
    payment_notifications = Column(Boolean, default=True, nullable=False)
    space_updates = Column(Boolean, default=True, nullable=False)
    payout_notifications = Column(Boolean, default=True, nullable=False)
    pledge_reminders = Column(Boolean, default=True, nullable=False)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
