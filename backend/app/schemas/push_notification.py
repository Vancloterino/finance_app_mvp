"""
Push Notification Schemas

Pydantic schemas for push notification API endpoints.
"""

from pydantic import BaseModel, Field
from typing import Optional, Dict, List
from datetime import datetime


class PushTokenRegister(BaseModel):
    """Schema for registering a push token."""
    token: str = Field(..., description="FCM device token")
    device_type: str = Field(..., description="Device type: ios, android, or web")


class PushTokenResponse(BaseModel):
    """Schema for push token response."""
    id: int
    user_id: str
    token: str
    device_type: str
    is_active: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class SendNotificationRequest(BaseModel):
    """Schema for sending a notification."""
    title: str = Field(..., min_length=1, max_length=200, description="Notification title")
    body: str = Field(..., min_length=1, max_length=1000, description="Notification body")
    notification_type: Optional[str] = Field(None, description="Notification type")
    data: Optional[Dict[str, str]] = Field(None, description="Additional data payload")
    badge: Optional[int] = Field(None, ge=0, description="iOS badge count")
    sound: Optional[str] = Field(None, description="Sound file name")


class SendNotificationResponse(BaseModel):
    """Schema for notification send response."""
    success: int = Field(..., description="Number of successful sends")
    failure: int = Field(..., description="Number of failed sends")
    message: str = Field(..., description="Result message")


class SendMultipleNotificationRequest(BaseModel):
    """Schema for sending notification to multiple users."""
    user_ids: List[str] = Field(..., min_items=1, description="List of user IDs")
    title: str = Field(..., min_length=1, max_length=200, description="Notification title")
    body: str = Field(..., min_length=1, max_length=1000, description="Notification body")
    notification_type: Optional[str] = Field(None, description="Notification type")
    data: Optional[Dict[str, str]] = Field(None, description="Additional data payload")


class PushTokenStats(BaseModel):
    """Schema for push token statistics."""
    total_tokens: int
    active_tokens: int
    inactive_tokens: int
    tokens_by_device_type: Dict[str, int]
