from uuid import UUID
from pydantic import BaseModel, Field
from typing import Optional


class TransferCreate(BaseModel):
    from_space_id: UUID
    to_space_id: UUID
    amount_minor: int = Field(..., gt=0, description="Amount in minor units (cents)")
    currency: str = Field(..., max_length=3, description="ISO 4217 currency code")
    memo: Optional[str] = None


class Transfer(BaseModel):
    from_space_id: UUID
    to_space_id: UUID
    amount_minor: int
    currency: str
    memo: Optional[str]
    user_id: UUID

    class Config:
        from_attributes = True
