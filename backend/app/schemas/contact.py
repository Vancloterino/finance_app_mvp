"""
Schemas for contact/support form.
"""
from pydantic import BaseModel, EmailStr, validator
from typing import Optional


class ContactFormSubmission(BaseModel):
    """Schema for contact form submission"""
    name: str
    email: EmailStr
    subject: str
    message: str
    phone: Optional[str] = None
    company: Optional[str] = None

    @validator('name', 'subject', 'message')
    def not_empty(cls, v):
        if not v or not v.strip():
            raise ValueError('Field cannot be empty')
        return v.strip()

    @validator('name', 'subject', 'message')
    def sanitize_html(cls, v):
        """Remove HTML tags from input"""
        import re
        # Remove script tags and their content
        v = re.sub(r'<script[^>]*>.*?</script>', '', v, flags=re.DOTALL | re.IGNORECASE)
        # Remove all HTML tags
        v = re.sub(r'<[^>]+>', '', v)
        return v

    @validator('message')
    def message_min_length(cls, v):
        if len(v) < 10:
            raise ValueError('Message must be at least 10 characters')
        return v


class ContactFormResponse(BaseModel):
    """Response after contact form submission"""
    message: str
    ticket_id: Optional[str] = None
