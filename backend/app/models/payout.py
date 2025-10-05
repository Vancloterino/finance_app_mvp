from sqlalchemy import Column, String, DateTime, BigInteger, ForeignKey, Text, Boolean
from sqlalchemy.dialects.postgresql import UUID, ENUM
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum

from app.core.database import Base


class PayoutStatusEnum(enum.Enum):
    PROPOSED = "proposed"
    CONSENT_PENDING = "consent_pending"
    READY = "ready"
    EXECUTING = "executing"
    SETTLED = "settled"
    FAILED = "failed"
    CANCELLED = "cancelled"


class ConsentDecisionEnum(enum.Enum):
    APPROVE = "approve"
    DENY = "deny"
    PENDING = "pending"
    AUTO_APPROVE = "auto_approve"


class Payout(Base):
    __tablename__ = "payouts"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    space_id = Column(UUID(as_uuid=True), ForeignKey("spaces.id"), nullable=False)

    # Amount in minor units (cents)
    amount_minor = Column(BigInteger, nullable=False)
    currency = Column(String(3), nullable=False)

    # Payee information
    payee_name = Column(String(255), nullable=False)
    payee_account = Column(Text, nullable=True)  # Bank details, encrypted

    # Status
    status = Column(ENUM(PayoutStatusEnum), nullable=False, default=PayoutStatusEnum.PROPOSED)

    # Scheduling
    scheduled_at = Column(DateTime(timezone=True), nullable=True)
    consent_deadline = Column(DateTime(timezone=True), nullable=True)

    # Metadata
    description = Column(Text, nullable=True)
    memo = Column(Text, nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    executed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    space = relationship("Space", back_populates="payouts")
    consents = relationship("Consent", back_populates="payout")
    payment_intents = relationship("PaymentIntent", back_populates="payout")


class Consent(Base):
    __tablename__ = "consents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    payout_id = Column(UUID(as_uuid=True), ForeignKey("payouts.id"), nullable=False)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    # Decision
    decision = Column(ENUM(ConsentDecisionEnum), nullable=False, default=ConsentDecisionEnum.PENDING)

    # Metadata
    reason = Column(Text, nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    decided_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    payout = relationship("Payout", back_populates="consents")
    user = relationship("User")