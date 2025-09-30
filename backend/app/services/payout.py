from typing import List, Optional, Dict
from uuid import UUID
from datetime import datetime, timedelta
from sqlalchemy.orm import Session
from sqlalchemy import and_, or_

from app.models.payout import Payout, Consent, PayoutStatusEnum, ConsentDecisionEnum
from app.models.space import MemberAllocation
from app.models.ledger import LedgerEntry
from app.schemas.payout import PayoutCreate, PayoutUpdate, ConsentCreate
from app.services.space import SpaceService
from app.services.stripe_service import StripeService
from app.services.user import UserService
from app.services.notification import NotificationService


class PayoutService:
    @staticmethod
    def create_payout(db: Session, payout: PayoutCreate, creator_user_id: UUID) -> Payout:
        """Create a new payout proposal"""
        # Verify creator is admin of the space
        if not SpaceService.is_space_admin(db, payout.space_id, creator_user_id):
            raise ValueError("Only space admins can create payouts")

        # Set consent deadline if not provided (48 hours from now)
        consent_deadline = datetime.utcnow() + timedelta(hours=48)

        db_payout = Payout(
            **payout.dict(),
            status=PayoutStatusEnum.PROPOSED,
            consent_deadline=consent_deadline
        )
        db.add(db_payout)
        db.flush()  # Get the payout ID

        # Create consent records for all active members
        members = SpaceService.get_space_members(db, payout.space_id)
        for member in members:
            db_consent = Consent(
                payout_id=db_payout.id,
                user_id=member.user_id,
                decision=ConsentDecisionEnum.PENDING
            )
            db.add(db_consent)

        # Update status to consent_pending
        db_payout.status = PayoutStatusEnum.CONSENT_PENDING

        db.commit()
        db.refresh(db_payout)

        # Send consent request notifications to all members
        try:
            PayoutService._send_consent_notifications(db, db_payout.id)
        except Exception as e:
            print(f"Failed to send consent notifications: {str(e)}")

        return db_payout

    @staticmethod
    def get_payout(db: Session, payout_id: UUID) -> Optional[Payout]:
        """Get a payout by ID"""
        return db.query(Payout).filter(Payout.id == payout_id).first()

    @staticmethod
    def get_space_payouts(db: Session, space_id: UUID, skip: int = 0, limit: int = 100) -> List[Payout]:
        """Get all payouts for a space"""
        return (
            db.query(Payout)
            .filter(Payout.space_id == space_id)
            .order_by(Payout.created_at.desc())
            .offset(skip)
            .limit(limit)
            .all()
        )

    @staticmethod
    def submit_consent(db: Session, payout_id: UUID, user_id: UUID, consent_data: ConsentCreate) -> Optional[Consent]:
        """Submit user consent for a payout"""
        # Get the consent record
        db_consent = db.query(Consent).filter(
            and_(
                Consent.payout_id == payout_id,
                Consent.user_id == user_id
            )
        ).first()

        if not db_consent:
            return None

        # Update consent
        db_consent.decision = consent_data.decision
        db_consent.reason = consent_data.reason
        db_consent.decided_at = datetime.utcnow()

        db.commit()

        # Check if payout is ready for execution
        PayoutService._check_payout_ready(db, payout_id)

        db.refresh(db_consent)
        return db_consent

    @staticmethod
    def _check_payout_ready(db: Session, payout_id: UUID) -> bool:
        """Check if payout has enough consents and update status"""
        payout = db.query(Payout).filter(Payout.id == payout_id).first()
        if not payout or payout.status != PayoutStatusEnum.CONSENT_PENDING:
            return False

        # Get all consents
        consents = db.query(Consent).filter(Consent.payout_id == payout_id).all()

        # Get member allocations for quorum calculation
        members = db.query(MemberAllocation).filter(
            and_(
                MemberAllocation.space_id == payout.space_id,
                MemberAllocation.is_active == True
            )
        ).all()

        # Calculate consent by allocation percentage
        total_allocation = sum(member.allocation_pct for member in members)
        approved_allocation = 0
        denied_allocation = 0
        pending_allocation = 0

        consent_by_user = {consent.user_id: consent for consent in consents}

        for member in members:
            consent = consent_by_user.get(member.user_id)
            if consent:
                if consent.decision == ConsentDecisionEnum.APPROVE:
                    approved_allocation += member.allocation_pct
                elif consent.decision == ConsentDecisionEnum.DENY:
                    denied_allocation += member.allocation_pct
                elif consent.decision == ConsentDecisionEnum.AUTO_APPROVE:
                    approved_allocation += member.allocation_pct
                else:  # PENDING
                    pending_allocation += member.allocation_pct

        # Check if we have quorum (75% approval by allocation)
        quorum_threshold = 0.75
        if approved_allocation / total_allocation >= quorum_threshold:
            payout.status = PayoutStatusEnum.READY
            db.commit()
            return True

        # Check if payout is impossible (too many denials)
        if denied_allocation / total_allocation > (1 - quorum_threshold):
            payout.status = PayoutStatusEnum.FAILED
            db.commit()
            return False

        # Check for timeout and auto-approve pending consents
        if datetime.utcnow() > payout.consent_deadline:
            PayoutService._auto_approve_pending_consents(db, payout_id)
            return PayoutService._check_payout_ready(db, payout_id)

        return False

    @staticmethod
    def _auto_approve_pending_consents(db: Session, payout_id: UUID):
        """Auto-approve pending consents after deadline"""
        pending_consents = db.query(Consent).filter(
            and_(
                Consent.payout_id == payout_id,
                Consent.decision == ConsentDecisionEnum.PENDING
            )
        ).all()

        for consent in pending_consents:
            consent.decision = ConsentDecisionEnum.AUTO_APPROVE
            consent.decided_at = datetime.utcnow()
            consent.reason = "Auto-approved after consent deadline"

        db.commit()

    @staticmethod
    def get_payout_consents(db: Session, payout_id: UUID) -> List[Consent]:
        """Get all consents for a payout"""
        return db.query(Consent).filter(Consent.payout_id == payout_id).all()

    @staticmethod
    def get_consent_summary(db: Session, payout_id: UUID) -> Dict:
        """Get consent summary with allocation percentages"""
        payout = db.query(Payout).filter(Payout.id == payout_id).first()
        if not payout:
            return {}

        consents = db.query(Consent).filter(Consent.payout_id == payout_id).all()
        members = db.query(MemberAllocation).filter(
            and_(
                MemberAllocation.space_id == payout.space_id,
                MemberAllocation.is_active == True
            )
        ).all()

        total_allocation = sum(member.allocation_pct for member in members)
        consent_by_user = {consent.user_id: consent for consent in consents}

        summary = {
            "approved_allocation": 0,
            "denied_allocation": 0,
            "pending_allocation": 0,
            "auto_approved_allocation": 0,
            "total_allocation": float(total_allocation),
            "quorum_needed": 0.75,
            "ready_for_execution": False,
            "consents": []
        }

        for member in members:
            consent = consent_by_user.get(member.user_id)
            allocation_pct = float(member.allocation_pct)

            consent_info = {
                "user_id": member.user_id,
                "allocation_pct": allocation_pct,
                "decision": consent.decision if consent else ConsentDecisionEnum.PENDING,
                "decided_at": consent.decided_at if consent else None,
                "reason": consent.reason if consent else None
            }
            summary["consents"].append(consent_info)

            if consent:
                if consent.decision == ConsentDecisionEnum.APPROVE:
                    summary["approved_allocation"] += allocation_pct
                elif consent.decision == ConsentDecisionEnum.DENY:
                    summary["denied_allocation"] += allocation_pct
                elif consent.decision == ConsentDecisionEnum.AUTO_APPROVE:
                    summary["auto_approved_allocation"] += allocation_pct
                else:
                    summary["pending_allocation"] += allocation_pct
            else:
                summary["pending_allocation"] += allocation_pct

        # Check if ready
        total_approved = summary["approved_allocation"] + summary["auto_approved_allocation"]
        summary["ready_for_execution"] = (total_approved / summary["total_allocation"]) >= summary["quorum_needed"]

        return summary

    @staticmethod
    def execute_payout(db: Session, payout_id: UUID) -> bool:
        """Mark payout as executing (actual Stripe processing will be separate)"""
        payout = db.query(Payout).filter(Payout.id == payout_id).first()
        if not payout or payout.status != PayoutStatusEnum.READY:
            return False

        payout.status = PayoutStatusEnum.EXECUTING
        payout.executed_at = datetime.utcnow()
        db.commit()
        return True

    @staticmethod
    def process_payout_payments(db: Session, payout_id: UUID) -> Dict:
        """Process payments for a payout via Stripe"""
        payout = db.query(Payout).filter(Payout.id == payout_id).first()
        if not payout or payout.status != PayoutStatusEnum.EXECUTING:
            raise ValueError("Payout is not in executing status")

        # Get all active members with their payment methods
        members = db.query(MemberAllocation).filter(
            and_(
                MemberAllocation.space_id == payout.space_id,
                MemberAllocation.is_active == True
            )
        ).all()

        member_payments = []
        errors = []

        for member in members:
            try:
                # Get user with Stripe info
                user = UserService.get_user(db, member.user_id)
                if not user:
                    errors.append(f"User {member.user_id} not found")
                    continue

                if not user.stripe_customer_id:
                    errors.append(f"User {user.email} has no Stripe customer ID")
                    continue

                if not user.payment_method_id:
                    errors.append(f"User {user.email} has no default payment method")
                    continue

                member_payments.append({
                    "user_id": member.user_id,
                    "customer_id": user.stripe_customer_id,
                    "payment_method_id": user.payment_method_id,
                    "allocation_pct": member.allocation_pct
                })

            except Exception as e:
                errors.append(f"Error processing user {member.user_id}: {str(e)}")

        if errors:
            return {
                "success": False,
                "errors": errors,
                "payment_results": []
            }

        # Create PaymentIntents via Stripe
        try:
            payment_results = StripeService.create_bulk_payment_intents(
                total_amount_minor=payout.amount_minor,
                currency=payout.currency,
                member_payments=member_payments,
                payout_id=payout_id,
                description=f"Payment for: {payout.payee_name} - {payout.description}"
            )

            return {
                "success": True,
                "errors": [],
                "payment_results": payment_results
            }

        except Exception as e:
            return {
                "success": False,
                "errors": [f"Stripe processing error: {str(e)}"],
                "payment_results": []
            }

    @staticmethod
    def complete_payout(db: Session, payout_id: UUID) -> bool:
        """Mark payout as settled and create ledger entries"""
        payout = db.query(Payout).filter(Payout.id == payout_id).first()
        if not payout or payout.status != PayoutStatusEnum.EXECUTING:
            return False

        # Get member allocations
        members = db.query(MemberAllocation).filter(
            and_(
                MemberAllocation.space_id == payout.space_id,
                MemberAllocation.is_active == True
            )
        ).all()

        # Create debit entries for each member based on their allocation
        for member in members:
            member_share = int(payout.amount_minor * member.allocation_pct)

            db_ledger_entry = LedgerEntry(
                space_id=payout.space_id,
                user_id=member.user_id,
                type="DEBIT",
                currency=payout.currency,
                amount_minor=member_share,  # Stored as positive, but semantically a debit
                ref_type="PAYOUT",
                ref_id=str(payout.id),
                event_time=payout.executed_at,
                memo=f"Payout to {payout.payee_name}"
            )
            db.add(db_ledger_entry)

        payout.status = PayoutStatusEnum.SETTLED
        db.commit()

        # Send status update notifications
        try:
            PayoutService.send_payout_status_notifications(db, payout_id, "settled")
        except Exception as e:
            print(f"Failed to send status update notifications: {str(e)}")

        return True

    @staticmethod
    def _send_consent_notifications(db: Session, payout_id: UUID):
        """Send consent request notifications to all space members"""
        payout = PayoutService.get_payout(db, payout_id)
        if not payout:
            return

        space = SpaceService.get_space(db, payout.space_id)
        if not space:
            return

        # Get all space members
        members = SpaceService.get_space_members(db, payout.space_id)

        for member in members:
            try:
                user = UserService.get_user(db, member.user_id)
                if user:
                    # Generate consent link (in production this would be a proper frontend URL)
                    consent_link = f"http://localhost:3000/spaces/{space.id}/payouts/{payout_id}/consent"

                    NotificationService.send_payout_consent_request(
                        user=user,
                        payout=payout,
                        space=space,
                        consent_link=consent_link
                    )
            except Exception as e:
                print(f"Failed to send consent notification to user {member.user_id}: {str(e)}")

    @staticmethod
    def send_payout_status_notifications(db: Session, payout_id: UUID, status_change: str):
        """Send payout status update notifications to all space members"""
        payout = PayoutService.get_payout(db, payout_id)
        if not payout:
            return

        space = SpaceService.get_space(db, payout.space_id)
        if not space:
            return

        # Get all space members
        members = SpaceService.get_space_members(db, payout.space_id)

        for member in members:
            try:
                user = UserService.get_user(db, member.user_id)
                if user:
                    NotificationService.send_payout_status_update(
                        user=user,
                        payout=payout,
                        space=space,
                        status_change=status_change
                    )
            except Exception as e:
                print(f"Failed to send status update notification to user {member.user_id}: {str(e)}")