from sqlalchemy import Column, String, DateTime, Boolean, Integer, ForeignKey, DECIMAL, Text
from sqlalchemy.dialects.postgresql import UUID, ENUM
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum

from app.core.database import Base


class CadenceEnum(enum.Enum):
    WEEKLY = "weekly"
    MONTHLY = "monthly"
    QUARTERLY = "quarterly"
    ANNUAL = "annual"
    ADHOC = "adhoc"


class RoleEnum(enum.Enum):
    ADMIN = "admin"
    MEMBER = "member"
    VIEWER = "viewer"


class Space(Base):
    __tablename__ = "spaces"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    name = Column(String(255), nullable=False)
    description = Column(Text, nullable=True)
    currency = Column(String(3), nullable=False, default="USD")  # ISO 4217

    # Schedule
    cadence = Column(ENUM(CadenceEnum), nullable=False, default=CadenceEnum.MONTHLY)
    due_date = Column(Integer, nullable=True)  # Day of month for monthly, day of week for weekly

    # Status
    is_active = Column(Boolean, default=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    members = relationship("MemberAllocation", back_populates="space")
    pledges = relationship("Pledge", back_populates="space")
    payouts = relationship("Payout", back_populates="space")
    ledger_entries = relationship("LedgerEntry", back_populates="space")


class MemberAllocation(Base):
    __tablename__ = "member_allocations"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    space_id = Column(UUID(as_uuid=True), ForeignKey("spaces.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    # Allocation
    allocation_pct = Column(DECIMAL(5, 4), nullable=False)  # 0.0000 to 1.0000
    role = Column(ENUM(RoleEnum), nullable=False, default=RoleEnum.MEMBER)

    # Status
    is_active = Column(Boolean, default=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())

    # Relationships
    space = relationship("Space", back_populates="members")
    user = relationship("User")