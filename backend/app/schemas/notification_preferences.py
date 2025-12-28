from typing import Optional
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel


class NotificationPreferencesBase(BaseModel):
    """Base schema for notification preferences"""
    email_notifications: Optional[bool] = None
    payment_notifications: Optional[bool] = None
    space_updates: Optional[bool] = None
    payout_notifications: Optional[bool] = None
    pledge_reminders: Optional[bool] = None


class NotificationPreferencesUpdate(NotificationPreferencesBase):
    """Schema for updating notification preferences (all fields optional)"""
    pass


class NotificationPreferencesResponse(BaseModel):
    """Schema for notification preferences response"""
    user_id: UUID
    email_notifications: bool
    payment_notifications: bool
    space_updates: bool
    payout_notifications: bool
    pledge_reminders: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True
