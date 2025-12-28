"""
Photo Upload Schemas

Pydantic schemas for photo upload endpoints.
"""

from pydantic import BaseModel
from typing import Optional


class PhotoUploadResponse(BaseModel):
    """Schema for photo upload response."""
    url: str
    key: str
    thumbnail_url: Optional[str] = None
    thumbnail_key: Optional[str] = None
    message: str


class PhotoDeleteResponse(BaseModel):
    """Schema for photo deletion response."""
    message: str
    success: bool
