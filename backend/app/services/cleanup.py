"""
Cleanup and cascade delete handlers for maintaining data integrity.
"""

from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import and_

from app.models.space import Space, MemberAllocation
from app.models.pledge import Pledge
from app.models.payout import Payout, Consent
from app.models.ledger import LedgerEntry
from app.models.payment_intent import PaymentIntent


class CleanupService:
    """Service for handling cleanup and cascade operations"""

    @staticmethod
    def cleanup_space_deletion(db: Session, space_id: UUID) -> dict:
        """
        Cleanup when a space is deleted (soft delete).
        Returns summary of affected records.
        """
        # Deactivate all member allocations
        allocations = db.query(MemberAllocation).filter(
            MemberAllocation.space_id == space_id
        ).all()
        for allocation in allocations:
            allocation.is_active = False

        # Cancel pending pledges
        pending_pledges = db.query(Pledge).filter(
            and_(
                Pledge.space_id == space_id,
                Pledge.status.in_(["active", "pending"])
            )
        ).all()
        for pledge in pending_pledges:
            pledge.status = "cancelled"

        # Cancel pending payouts
        pending_payouts = db.query(Payout).filter(
            and_(
                Payout.space_id == space_id,
                Payout.status.in_(["proposed", "consent_pending", "ready"])
            )
        ).all()
        for payout in pending_payouts:
            payout.status = "cancelled"

        # Mark space as inactive
        space = db.query(Space).filter(Space.id == space_id).first()
        if space:
            space.is_active = False

        db.commit()

        return {
            "space_id": str(space_id),
            "allocations_deactivated": len(allocations),
            "pledges_cancelled": len(pending_pledges),
            "payouts_cancelled": len(pending_payouts)
        }

    @staticmethod
    def cleanup_user_deletion(db: Session, user_id: UUID) -> dict:
        """
        Cleanup when a user is deleted (soft delete).
        Returns summary of affected records.
        """
        # Deactivate user's member allocations
        allocations = db.query(MemberAllocation).filter(
            MemberAllocation.user_id == user_id
        ).all()
        for allocation in allocations:
            allocation.is_active = False

        # Cancel user's active pledges
        active_pledges = db.query(Pledge).filter(
            and_(
                Pledge.user_id == user_id,
                Pledge.status.in_(["active", "pending"])
            )
        ).all()
        for pledge in active_pledges:
            pledge.status = "cancelled"

        db.commit()

        return {
            "user_id": str(user_id),
            "allocations_deactivated": len(allocations),
            "pledges_cancelled": len(active_pledges)
        }

    @staticmethod
    def cleanup_failed_payout(db: Session, payout_id: UUID) -> dict:
        """
        Cleanup when a payout fails.
        Handles refunds, ledger corrections, etc.
        """
        # Get all payment intents for this payout
        payment_intents = db.query(PaymentIntent).filter(
            PaymentIntent.payout_id == payout_id
        ).all()

        # Get succeeded payments that need refunding
        succeeded_payments = [
            pi for pi in payment_intents
            if pi.status == "succeeded"
        ]

        # TODO: Implement actual Stripe refunds here
        # For now, just log what would need to be refunded

        db.commit()

        return {
            "payout_id": str(payout_id),
            "total_payments": len(payment_intents),
            "succeeded_payments": len(succeeded_payments),
            "refunds_needed": len(succeeded_payments),
            "note": "Actual refund processing not yet implemented"
        }

    @staticmethod
    def get_user_orphaned_data(db: Session, user_id: UUID) -> dict:
        """
        Check for orphaned data before user deletion.
        Returns what would be affected.
        """
        # Count active allocations
        active_allocations = db.query(MemberAllocation).filter(
            and_(
                MemberAllocation.user_id == user_id,
                MemberAllocation.is_active == True
            )
        ).count()

        # Count active pledges
        active_pledges = db.query(Pledge).filter(
            and_(
                Pledge.user_id == user_id,
                Pledge.status.in_(["active", "pending"])
            )
        ).count()

        # Count ledger entries
        ledger_entries = db.query(LedgerEntry).filter(
            LedgerEntry.user_id == user_id
        ).count()

        # Count pending consents
        pending_consents = db.query(Consent).filter(
            and_(
                Consent.user_id == user_id,
                Consent.decision == "pending"
            )
        ).count()

        return {
            "user_id": str(user_id),
            "active_allocations": active_allocations,
            "active_pledges": active_pledges,
            "ledger_entries": ledger_entries,
            "pending_consents": pending_consents,
            "can_delete_safely": (
                active_allocations == 0 and
                active_pledges == 0 and
                pending_consents == 0
            )
        }

    @staticmethod
    def get_space_orphaned_data(db: Session, space_id: UUID) -> dict:
        """
        Check for orphaned data before space deletion.
        Returns what would be affected.
        """
        # Count active members
        active_members = db.query(MemberAllocation).filter(
            and_(
                MemberAllocation.space_id == space_id,
                MemberAllocation.is_active == True
            )
        ).count()

        # Count active pledges
        active_pledges = db.query(Pledge).filter(
            and_(
                Pledge.space_id == space_id,
                Pledge.status.in_(["active", "pending"])
            )
        ).count()

        # Count pending/executing payouts
        active_payouts = db.query(Payout).filter(
            and_(
                Payout.space_id == space_id,
                Payout.status.in_(["proposed", "consent_pending", "ready", "executing"])
            )
        ).count()

        # Count ledger entries
        ledger_entries = db.query(LedgerEntry).filter(
            LedgerEntry.space_id == space_id
        ).count()

        return {
            "space_id": str(space_id),
            "active_members": active_members,
            "active_pledges": active_pledges,
            "active_payouts": active_payouts,
            "ledger_entries": ledger_entries,
            "can_delete_safely": (
                active_pledges == 0 and
                active_payouts == 0
            )
        }
