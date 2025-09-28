from datetime import datetime
from typing import Optional, List
from uuid import UUID
from pydantic import BaseModel, Field

from app.models.payout import PayoutStatusEnum, ConsentDecisionEnum


class PayoutBase(BaseModel):
    amount_minor: int = Field(..., gt=0, description="Amount in minor units (cents)")
    currency: str = Field(..., max_length=3, description="ISO 4217 currency code")
    payee_name: str = Field(..., max_length=255)
    payee_account: Optional[str] = None
    description: Optional[str] = None
    memo: Optional[str] = None


class PayoutCreate(PayoutBase):
    space_id: UUID
    scheduled_at: Optional[datetime] = None


class PayoutUpdate(BaseModel):
    status: Optional[PayoutStatusEnum] = None
    scheduled_at: Optional[datetime] = None
    consent_deadline: Optional[datetime] = None
    executed_at: Optional[datetime] = None


class ConsentBase(BaseModel):
    decision: ConsentDecisionEnum
    reason: Optional[str] = None


class ConsentCreate(ConsentBase):
    pass


class ConsentUpdate(BaseModel):
    decision: Optional[ConsentDecisionEnum] = None
    reason: Optional[str] = None


class Consent(ConsentBase):
    id: UUID
    payout_id: UUID
    user_id: UUID
    created_at: datetime
    decided_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class Payout(PayoutBase):
    id: UUID
    space_id: UUID
    status: PayoutStatusEnum = PayoutStatusEnum.PROPOSED
    scheduled_at: Optional[datetime] = None
    consent_deadline: Optional[datetime] = None
    created_at: datetime
    updated_at: Optional[datetime] = None
    executed_at: Optional[datetime] = None
    consents: List[Consent] = []

    class Config:
        from_attributes = True