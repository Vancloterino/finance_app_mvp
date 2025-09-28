from sqlalchemy import Column, String, DateTime, BigInteger, ForeignKey, Text
from sqlalchemy.dialects.postgresql import UUID, ENUM
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum

from app.core.database import Base


class EntryTypeEnum(enum.Enum):
    PLEDGE = "pledge"
    DEBIT = "debit"
    CREDIT = "credit"
    ADJUST = "adjust"
    FEE = "fee"


class RefTypeEnum(enum.Enum):
    PLEDGE = "pledge"
    PAYOUT = "payout"
    PAYMENT = "payment"
    REFUND = "refund"
    ADJUSTMENT = "adjustment"


class LedgerEntry(Base):
    __tablename__ = "ledger_entries"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    space_id = Column(UUID(as_uuid=True), ForeignKey("spaces.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=True)  # Null for space-wide entries

    # Entry details
    type = Column(ENUM(EntryTypeEnum), nullable=False)
    currency = Column(String(3), nullable=False)
    amount_minor = Column(BigInteger, nullable=False)  # Can be negative

    # Reference
    ref_type = Column(ENUM(RefTypeEnum), nullable=False)
    ref_id = Column(String(255), nullable=False)  # UUID or external ID

    # Timing
    event_time = Column(DateTime(timezone=True), nullable=False)  # Business event time
    recorded_at = Column(DateTime(timezone=True), server_default=func.now())  # System record time

    # Idempotency
    idempotency_key = Column(String(255), unique=True, nullable=True)

    # Metadata
    memo = Column(Text, nullable=True)

    # Relationships
    space = relationship("Space", back_populates="ledger_entries")
    user = relationship("User")