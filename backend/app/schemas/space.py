from datetime import datetime
from typing import Optional, List
from uuid import UUID
from decimal import Decimal
from pydantic import BaseModel, Field

from app.models.space import CadenceEnum, RoleEnum


class SpaceBase(BaseModel):
    name: str = Field(..., max_length=255)
    description: Optional[str] = None
    currency: str = Field(..., max_length=3, description="ISO 4217 currency code")
    cadence: CadenceEnum = CadenceEnum.MONTHLY
    due_date: Optional[int] = Field(None, description="Day of month/week depending on cadence")


class SpaceCreate(SpaceBase):
    pass


class SpaceUpdate(BaseModel):
    name: Optional[str] = Field(None, max_length=255)
    description: Optional[str] = None
    cadence: Optional[CadenceEnum] = None
    due_date: Optional[int] = None


class MemberAllocationBase(BaseModel):
    allocation_pct: Decimal = Field(..., ge=0, le=1, description="Allocation percentage (0.0 to 1.0)")
    role: RoleEnum = RoleEnum.MEMBER


class MemberAllocationCreate(MemberAllocationBase):
    user_id: UUID


class MemberAllocationUpdate(BaseModel):
    allocation_pct: Optional[Decimal] = Field(None, ge=0, le=1)
    role: Optional[RoleEnum] = None
    is_active: Optional[bool] = None


class MemberAllocation(MemberAllocationBase):
    id: UUID
    space_id: UUID
    user_id: UUID
    is_active: bool = True
    created_at: datetime
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True


class Space(SpaceBase):
    id: UUID
    is_active: bool = True
    created_at: datetime
    updated_at: Optional[datetime] = None
    members: List[MemberAllocation] = []

    class Config:
        from_attributes = True