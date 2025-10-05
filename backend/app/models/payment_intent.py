from sqlalchemy import Column, String, DateTime, BigInteger, ForeignKey, Text, Boolean
from sqlalchemy.dialects.postgresql import UUID, ENUM
from sqlalchemy.orm import relationship
from sqlalchemy.sql import func
import uuid
import enum

from app.core.database import Base


class PaymentIntentStatusEnum(enum.Enum):
    """Status of individual payment intents"""
    CREATED = "created"
    PROCESSING = "processing"
    REQUIRES_ACTION = "requires_action"
    SUCCEEDED = "succeeded"
    FAILED = "failed"
    CANCELED = "canceled"


class PaymentIntent(Base):
    """
    Tracks individual Stripe PaymentIntents for payout payments.
    Each payout has multiple payment intents (one per member).
    """
    __tablename__ = "payment_intents"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)

    # Link to payout
    payout_id = Column(UUID(as_uuid=True), ForeignKey("payouts.id"), nullable=False)

    # Link to user (member making the payment)
    user_id = Column(UUID(as_uuid=True), ForeignKey("users.id"), nullable=False)

    # Stripe PaymentIntent ID
    stripe_payment_intent_id = Column(String(255), nullable=False, unique=True, index=True)

    # Amount for this specific member's share (in minor units/cents)
    amount_minor = Column(BigInteger, nullable=False)
    currency = Column(String(3), nullable=False)

    # Status tracking
    status = Column(ENUM(PaymentIntentStatusEnum), nullable=False, default=PaymentIntentStatusEnum.CREATED)

    # Stripe customer and payment method used
    stripe_customer_id = Column(String(255), nullable=True)
    stripe_payment_method_id = Column(String(255), nullable=True)

    # Client secret for frontend (if needed)
    client_secret = Column(Text, nullable=True)

    # Error tracking
    error_code = Column(String(100), nullable=True)
    error_message = Column(Text, nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    succeeded_at = Column(DateTime(timezone=True), nullable=True)
    failed_at = Column(DateTime(timezone=True), nullable=True)

    # Relationships
    payout = relationship("Payout", back_populates="payment_intents")
    user = relationship("User")

    def __repr__(self):
        return f"<PaymentIntent {self.stripe_payment_intent_id} - {self.status.value}>"
