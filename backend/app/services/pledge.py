from typing import List, Optional
from uuid import UUID
from datetime import datetime
from sqlalchemy.orm import Session
from sqlalchemy import and_, desc

from app.models.pledge import Pledge
from app.models.ledger import LedgerEntry
from app.schemas.pledge import PledgeCreate


class PledgeService:
    @staticmethod
    def create_pledge(db: Session, pledge: PledgeCreate, user_id: UUID) -> Pledge:
        """Create a new pledge and corresponding ledger entry"""
        # Create the pledge
        db_pledge = Pledge(
            **pledge.dict(),
            user_id=user_id
        )
        db.add(db_pledge)
        db.flush()  # Get the pledge ID

        # Create corresponding ledger entry
        db_ledger_entry = LedgerEntry(
            space_id=pledge.space_id,
            user_id=user_id,
            type="PLEDGE",
            currency=pledge.currency,
            amount_minor=pledge.amount_minor,  # Positive for pledges
            ref_type="PLEDGE",
            ref_id=str(db_pledge.id),
            event_time=datetime.utcnow(),
            memo=pledge.memo
        )
        db.add(db_ledger_entry)

        db.commit()
        db.refresh(db_pledge)
        return db_pledge

    @staticmethod
    def get_pledge(db: Session, pledge_id: UUID) -> Optional[Pledge]:
        """Get a pledge by ID"""
        return db.query(Pledge).filter(Pledge.id == pledge_id).first()

    @staticmethod
    def get_space_pledges(db: Session, space_id: UUID, skip: int = 0, limit: int = 100) -> List[Pledge]:
        """Get all pledges for a space"""
        return (
            db.query(Pledge)
            .filter(Pledge.space_id == space_id)
            .order_by(desc(Pledge.created_at))
            .offset(skip)
            .limit(limit)
            .all()
        )

    @staticmethod
    def get_user_pledges(
        db: Session,
        user_id: UUID,
        space_id: Optional[UUID] = None,
        skip: int = 0,
        limit: int = 100
    ) -> List[Pledge]:
        """Get pledges by user, optionally filtered by space"""
        query = db.query(Pledge).filter(Pledge.user_id == user_id)

        if space_id:
            query = query.filter(Pledge.space_id == space_id)

        return (
            query.order_by(desc(Pledge.created_at))
            .offset(skip)
            .limit(limit)
            .all()
        )

    @staticmethod
    def get_space_total_pledges(db: Session, space_id: UUID, currency: str) -> int:
        """Get total pledged amount for a space in minor units"""
        result = (
            db.query(LedgerEntry)
            .filter(
                and_(
                    LedgerEntry.space_id == space_id,
                    LedgerEntry.type == "PLEDGE",
                    LedgerEntry.currency == currency
                )
            )
            .all()
        )

        return sum(entry.amount_minor for entry in result)

    @staticmethod
    def get_user_space_pledges_total(db: Session, user_id: UUID, space_id: UUID, currency: str) -> int:
        """Get total pledged amount by user for a space in minor units"""
        result = (
            db.query(LedgerEntry)
            .filter(
                and_(
                    LedgerEntry.space_id == space_id,
                    LedgerEntry.user_id == user_id,
                    LedgerEntry.type == "PLEDGE",
                    LedgerEntry.currency == currency
                )
            )
            .all()
        )

        return sum(entry.amount_minor for entry in result)

    @staticmethod
    def get_user_balance(db: Session, user_id: UUID, space_id: UUID, currency: str) -> int:
        """Get user's current balance in a space (pledges - debits + credits)"""
        entries = (
            db.query(LedgerEntry)
            .filter(
                and_(
                    LedgerEntry.space_id == space_id,
                    LedgerEntry.user_id == user_id,
                    LedgerEntry.currency == currency
                )
            )
            .all()
        )

        balance = 0
        for entry in entries:
            if entry.type in ["PLEDGE", "CREDIT"]:
                balance += entry.amount_minor
            elif entry.type in ["DEBIT", "FEE"]:
                balance -= entry.amount_minor
            elif entry.type == "ADJUST":
                balance += entry.amount_minor  # Can be positive or negative

        return balance