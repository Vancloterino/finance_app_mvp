from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, EmailStr


class UserBase(BaseModel):
    email: EmailStr
    name: str
    phone: Optional[str] = None


class UserCreate(UserBase):
    auth_id: Optional[str] = None  # For external auth
    password: Optional[str] = None  # For email/password auth


class UserUpdate(BaseModel):
    name: Optional[str] = None
    phone: Optional[str] = None
    profile_image_url: Optional[str] = None


class PasswordChange(BaseModel):
    current_password: str
    new_password: str


class User(UserBase):
    id: UUID
    auth_id: str
    stripe_customer_id: Optional[str] = None
    payment_method_id: Optional[str] = None
    is_active: bool = True
    email_verified: bool = False
    profile_image_url: Optional[str] = None
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class UserSpace(BaseModel):
    """Schema for user's space membership"""
    id: UUID
    name: str
    description: Optional[str] = None
    allocation_pct: float
    is_admin: bool
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True