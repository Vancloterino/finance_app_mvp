"""Audit log model for tracking financial operations"""
from datetime import datetime
from uuid import uuid4, UUID
from sqlalchemy import Column, String, DateTime, Text, JSON, Enum as SQLEnum
from sqlalchemy.dialects.postgresql import UUID as PGUUID
import enum

from app.core.database import Base


class AuditAction(str, enum.Enum):
    """Types of auditable actions"""
    # User actions
    USER_LOGIN = "user_login"
    USER_REGISTER = "user_register"
    USER_UPDATE = "user_update"

    # Space actions
    SPACE_CREATE = "space_create"
    SPACE_UPDATE = "space_update"
    SPACE_DELETE = "space_delete"
    MEMBER_ADD = "member_add"
    MEMBER_REMOVE = "member_remove"
    MEMBER_UPDATE = "member_update"

    # Financial actions
    PLEDGE_CREATE = "pledge_create"
    PLEDGE_UPDATE = "pledge_update"
    PLEDGE_DELETE = "pledge_delete"

    PAYOUT_CREATE = "payout_create"
    PAYOUT_APPROVE = "payout_approve"
    PAYOUT_REJECT = "payout_reject"
    PAYOUT_EXECUTE = "payout_execute"
    PAYOUT_CANCEL = "payout_cancel"

    CONSENT_SUBMIT = "consent_submit"
    CONSENT_CHANGE = "consent_change"

    # Payment actions
    PAYMENT_METHOD_ADD = "payment_method_add"
    PAYMENT_METHOD_REMOVE = "payment_method_remove"
    PAYMENT_INTENT_CREATE = "payment_intent_create"
    PAYMENT_SUCCESS = "payment_success"
    PAYMENT_FAILURE = "payment_failure"
    REFUND_ISSUE = "refund_issue"


class AuditLog(Base):
    """
    Audit log for tracking all financial and administrative operations.
    Provides complete audit trail for compliance and security.
    """
    __tablename__ = "audit_logs"

    id = Column(PGUUID(as_uuid=True), primary_key=True, default=uuid4)

    # Action details
    action = Column(SQLEnum(AuditAction), nullable=False, index=True)
    entity_type = Column(String(50), nullable=False, index=True)  # space, payout, payment, etc.
    entity_id = Column(PGUUID(as_uuid=True), index=True)  # ID of the affected entity

    # User information
    user_id = Column(PGUUID(as_uuid=True), index=True)  # User who performed the action
    user_email = Column(String(255))  # Email at time of action

    # Request information
    ip_address = Column(String(45))  # IPv4 or IPv6
    user_agent = Column(Text)  # Browser/client information

    # Action details
    description = Column(Text)  # Human-readable description
    old_values = Column(JSON)  # Previous state (for updates)
    new_values = Column(JSON)  # New state
    metadata = Column(JSON)  # Additional context (e.g., space_id, payout_id)

    # Financial tracking
    amount = Column(String(20))  # Amount involved (if applicable)
    currency = Column(String(3))  # Currency code (if applicable)

    # Timestamp
    created_at = Column(DateTime, default=datetime.utcnow, nullable=False, index=True)

    def __repr__(self):
        return f"<AuditLog(id={self.id}, action={self.action}, user_id={self.user_id})>"
