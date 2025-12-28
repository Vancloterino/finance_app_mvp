"""
Schemas for password reset functionality.
"""
from pydantic import BaseModel, EmailStr, validator


class PasswordResetRequest(BaseModel):
    """Request password reset for an email address"""
    email: EmailStr


class PasswordResetConfirm(BaseModel):
    """Confirm password reset with token and new password"""
    token: str
    new_password: str

    @validator('new_password')
    def validate_password(cls, v):
        if len(v) < 6:
            raise ValueError('Password must be at least 6 characters long')
        return v


class PasswordResetResponse(BaseModel):
    """Response for password reset request"""
    message: str
