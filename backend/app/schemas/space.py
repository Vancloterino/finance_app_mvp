from datetime import datetime
from typing import Optional, List
from uuid import UUID
from decimal import Decimal
from pydantic import BaseModel, Field, field_validator

from app.models.space import CadenceEnum, RoleEnum
from app.core.validators import sanitize_string, validate_currency_code, validate_name


class SpaceBase(BaseModel):
    name: str = Field(..., min_length=3, max_length=255)
    description: Optional[str] = Field(None, max_length=1000)
    currency: str = Field(..., min_length=3, max_length=3, description="ISO 4217 currency code")
    cadence: CadenceEnum = CadenceEnum.MONTHLY
    due_date: Optional[int] = Field(None, ge=1, le=31, description="Day of month/week depending on cadence")

    @field_validator('name')
    @classmethod
    def sanitize_name(cls, v: str) -> str:
        """Sanitize and validate name field"""
        cleaned = sanitize_string(v, max_length=255)
        if not validate_name(cleaned, min_length=3, max_length=255):
            raise ValueError('Name must be between 3 and 255 characters')
        return cleaned

    @field_validator('description')
    @classmethod
    def sanitize_description(cls, v: Optional[str]) -> Optional[str]:
        """Sanitize description field"""
        if v is None:
            return v
        return sanitize_string(v, max_length=1000)

    @field_validator('currency')
    @classmethod
    def validate_currency(cls, v: str) -> str:
        """Validate currency code format"""
        v = v.upper().strip()
        if not validate_currency_code(v):
            raise ValueError('Currency must be a valid 3-letter ISO 4217 code')
        return v


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


class MemberUser(BaseModel):
    """User information for member allocation"""
    id: UUID
    name: str
    email: str

    class Config:
        from_attributes = True


class MemberAllocation(MemberAllocationBase):
    id: UUID
    space_id: UUID
    user_id: UUID
    is_active: bool = True
    created_at: datetime
    updated_at: Optional[datetime] = None
    user: Optional[MemberUser] = None

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