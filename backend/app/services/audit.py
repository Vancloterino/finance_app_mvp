"""Audit logging service"""
from typing import Optional, Dict, Any
from uuid import UUID
from sqlalchemy.orm import Session
from fastapi import Request

from app.models.audit_log import AuditLog, AuditAction


class AuditService:
    """Service for creating audit log entries"""

    @staticmethod
    def log(
        db: Session,
        action: AuditAction,
        entity_type: str,
        entity_id: Optional[UUID] = None,
        user_id: Optional[UUID] = None,
        user_email: Optional[str] = None,
        description: Optional[str] = None,
        old_values: Optional[Dict[str, Any]] = None,
        new_values: Optional[Dict[str, Any]] = None,
        metadata: Optional[Dict[str, Any]] = None,
        amount: Optional[str] = None,
        currency: Optional[str] = None,
        request: Optional[Request] = None
    ) -> AuditLog:
        """
        Create an audit log entry

        Args:
            db: Database session
            action: Type of action performed
            entity_type: Type of entity affected (space, payout, payment, etc.)
            entity_id: ID of the affected entity
            user_id: ID of user who performed the action
            user_email: Email of user (captured at time of action)
            description: Human-readable description
            old_values: Previous state (for updates)
            new_values: New state
            metadata: Additional context
            amount: Financial amount (if applicable)
            currency: Currency code (if applicable)
            request: FastAPI request object for IP/user agent

        Returns:
            Created audit log entry
        """
        # Extract request information if provided
        ip_address = None
        user_agent = None
        if request:
            ip_address = request.client.host if request.client else None
            user_agent = request.headers.get("user-agent")

        audit_entry = AuditLog(
            action=action,
            entity_type=entity_type,
            entity_id=entity_id,
            user_id=user_id,
            user_email=user_email,
            description=description,
            old_values=old_values,
            new_values=new_values,
            metadata=metadata,
            amount=amount,
            currency=currency,
            ip_address=ip_address,
            user_agent=user_agent
        )

        db.add(audit_entry)
        db.commit()
        db.refresh(audit_entry)

        return audit_entry

    @staticmethod
    def log_payout_create(
        db: Session,
        payout_id: UUID,
        space_id: UUID,
        user_id: UUID,
        user_email: str,
        amount: str,
        currency: str,
        description: str,
        request: Optional[Request] = None
    ) -> AuditLog:
        """Log payout creation"""
        return AuditService.log(
            db=db,
            action=AuditAction.PAYOUT_CREATE,
            entity_type="payout",
            entity_id=payout_id,
            user_id=user_id,
            user_email=user_email,
            description=f"Created payout: {description}",
            new_values={"amount": amount, "currency": currency, "description": description},
            metadata={"space_id": str(space_id)},
            amount=amount,
            currency=currency,
            request=request
        )

    @staticmethod
    def log_consent_submit(
        db: Session,
        payout_id: UUID,
        user_id: UUID,
        user_email: str,
        approved: bool,
        comment: Optional[str] = None,
        request: Optional[Request] = None
    ) -> AuditLog:
        """Log consent submission"""
        action = AuditAction.PAYOUT_APPROVE if approved else AuditAction.PAYOUT_REJECT

        return AuditService.log(
            db=db,
            action=action,
            entity_type="consent",
            entity_id=payout_id,
            user_id=user_id,
            user_email=user_email,
            description=f"{'Approved' if approved else 'Rejected'} payout" + (f": {comment}" if comment else ""),
            new_values={"approved": approved, "comment": comment},
            metadata={"payout_id": str(payout_id)},
            request=request
        )

    @staticmethod
    def log_payout_execute(
        db: Session,
        payout_id: UUID,
        user_id: UUID,
        user_email: str,
        amount: str,
        currency: str,
        request: Optional[Request] = None
    ) -> AuditLog:
        """Log payout execution"""
        return AuditService.log(
            db=db,
            action=AuditAction.PAYOUT_EXECUTE,
            entity_type="payout",
            entity_id=payout_id,
            user_id=user_id,
            user_email=user_email,
            description=f"Executed payout for {amount} {currency}",
            new_values={"status": "executed"},
            amount=amount,
            currency=currency,
            request=request
        )

    @staticmethod
    def log_payment_success(
        db: Session,
        payment_intent_id: str,
        user_id: UUID,
        user_email: str,
        amount: str,
        currency: str,
        metadata: Optional[Dict[str, Any]] = None,
        request: Optional[Request] = None
    ) -> AuditLog:
        """Log successful payment"""
        return AuditService.log(
            db=db,
            action=AuditAction.PAYMENT_SUCCESS,
            entity_type="payment",
            user_id=user_id,
            user_email=user_email,
            description=f"Payment succeeded: {amount} {currency}",
            new_values={"payment_intent_id": payment_intent_id, "status": "succeeded"},
            metadata=metadata or {},
            amount=amount,
            currency=currency,
            request=request
        )

    @staticmethod
    def log_payment_failure(
        db: Session,
        payment_intent_id: str,
        user_id: Optional[UUID],
        user_email: Optional[str],
        amount: str,
        currency: str,
        error_message: str,
        metadata: Optional[Dict[str, Any]] = None,
        request: Optional[Request] = None
    ) -> AuditLog:
        """Log failed payment"""
        return AuditService.log(
            db=db,
            action=AuditAction.PAYMENT_FAILURE,
            entity_type="payment",
            user_id=user_id,
            user_email=user_email,
            description=f"Payment failed: {error_message}",
            new_values={
                "payment_intent_id": payment_intent_id,
                "status": "failed",
                "error": error_message
            },
            metadata=metadata or {},
            amount=amount,
            currency=currency,
            request=request
        )
