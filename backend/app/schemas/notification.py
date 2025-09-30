from typing import Optional
from enum import Enum
from datetime import datetime
from uuid import UUID
from pydantic import BaseModel, EmailStr


class NotificationTypeEnum(str, Enum):
    SPACE_INVITATION = "SPACE_INVITATION"
    PAYOUT_CONSENT_REQUEST = "PAYOUT_CONSENT_REQUEST"
    PAYOUT_STATUS_UPDATE = "PAYOUT_STATUS_UPDATE"
    PAYMENT_FAILURE = "PAYMENT_FAILURE"
    PLEDGE_REMINDER = "PLEDGE_REMINDER"
    GENERAL = "GENERAL"


class NotificationCreate(BaseModel):
    recipient_email: EmailStr
    notification_type: NotificationTypeEnum
    subject: str
    html_content: str
    text_content: Optional[str] = None
    metadata: Optional[dict] = None


class NotificationResponse(BaseModel):
    id: UUID
    recipient_email: EmailStr
    notification_type: NotificationTypeEnum
    subject: str
    sent_at: Optional[datetime] = None
    success: bool
    error_message: Optional[str] = None
    metadata: Optional[dict] = None
    created_at: datetime

    class Config:
        from_attributes = True


class EmailTestRequest(BaseModel):
    to_email: EmailStr
    subject: str = "Test Email"
    message: str = "This is a test email from the finance app."