from datetime import datetime
from typing import Optional
from uuid import UUID
from pydantic import BaseModel, Field


class PledgeBase(BaseModel):
    amount_minor: int = Field(..., gt=0, description="Amount in minor units (cents)")
    currency: str = Field(..., max_length=3, description="ISO 4217 currency code")
    memo: Optional[str] = None


class PledgeCreate(PledgeBase):
    space_id: UUID


class PledgeUpdate(BaseModel):
    amount_minor: Optional[int] = Field(None, gt=0, description="Amount in minor units (cents)")
    currency: Optional[str] = Field(None, max_length=3, description="ISO 4217 currency code")
    memo: Optional[str] = None


class PledgeUser(BaseModel):
    """User information for pledge"""
    id: UUID
    name: str
    email: str

    class Config:
        from_attributes = True


class Pledge(PledgeBase):
    id: UUID
    space_id: UUID
    user_id: UUID
    created_at: datetime
    user: Optional[PledgeUser] = None

    class Config:
        from_attributes = True