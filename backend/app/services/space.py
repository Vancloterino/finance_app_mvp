from typing import List, Optional
from uuid import UUID
from sqlalchemy.orm import Session
from sqlalchemy import and_

from app.models.space import Space, MemberAllocation
from app.schemas.space import SpaceCreate, SpaceUpdate, MemberAllocationCreate, MemberAllocationUpdate


class SpaceService:
    @staticmethod
    def create_space(db: Session, space: SpaceCreate, creator_user_id: UUID) -> Space:
        """Create a new space with the creator as admin"""
        db_space = Space(**space.dict())
        db.add(db_space)
        db.flush()  # Get the space ID

        # Add creator as admin with 100% allocation initially
        db_allocation = MemberAllocation(
            space_id=db_space.id,
            user_id=creator_user_id,
            allocation_pct=1.0,
            role="ADMIN",
            is_active=True
        )
        db.add(db_allocation)
        db.commit()
        db.refresh(db_space)
        return db_space

    @staticmethod
    def get_space(db: Session, space_id: UUID) -> Optional[Space]:
        """Get a space by ID"""
        return db.query(Space).filter(Space.id == space_id).first()

    @staticmethod
    def get_user_spaces(db: Session, user_id: UUID, skip: int = 0, limit: int = 100) -> List[Space]:
        """Get all spaces where user is a member"""
        return (
            db.query(Space)
            .join(MemberAllocation)
            .filter(
                and_(
                    MemberAllocation.user_id == user_id,
                    MemberAllocation.is_active == True,
                    Space.is_active == True
                )
            )
            .offset(skip)
            .limit(limit)
            .all()
        )

    @staticmethod
    def update_space(db: Session, space_id: UUID, space_update: SpaceUpdate) -> Optional[Space]:
        """Update a space"""
        db_space = db.query(Space).filter(Space.id == space_id).first()
        if not db_space:
            return None

        for field, value in space_update.dict(exclude_unset=True).items():
            setattr(db_space, field, value)

        db.commit()
        db.refresh(db_space)
        return db_space

    @staticmethod
    def add_member(db: Session, space_id: UUID, member: MemberAllocationCreate) -> Optional[MemberAllocation]:
        """Add a member to a space"""
        # Check if member already exists
        existing = db.query(MemberAllocation).filter(
            and_(
                MemberAllocation.space_id == space_id,
                MemberAllocation.user_id == member.user_id
            )
        ).first()

        if existing:
            # Reactivate if inactive
            if not existing.is_active:
                existing.is_active = True
                existing.allocation_pct = member.allocation_pct
                existing.role = member.role
                db.commit()
                db.refresh(existing)
                return existing
            return None  # Already active member

        db_allocation = MemberAllocation(
            space_id=space_id,
            **member.dict()
        )
        db.add(db_allocation)
        db.commit()
        db.refresh(db_allocation)
        return db_allocation

    @staticmethod
    def get_space_members(db: Session, space_id: UUID) -> List[MemberAllocation]:
        """Get all active members of a space"""
        return (
            db.query(MemberAllocation)
            .filter(
                and_(
                    MemberAllocation.space_id == space_id,
                    MemberAllocation.is_active == True
                )
            )
            .all()
        )

    @staticmethod
    def remove_member(db: Session, space_id: UUID, user_id: UUID) -> bool:
        """Remove a member from a space (soft delete)"""
        db_allocation = db.query(MemberAllocation).filter(
            and_(
                MemberAllocation.space_id == space_id,
                MemberAllocation.user_id == user_id
            )
        ).first()

        if not db_allocation:
            return False

        db_allocation.is_active = False
        db.commit()
        return True

    @staticmethod
    def is_space_admin(db: Session, space_id: UUID, user_id: UUID) -> bool:
        """Check if user is admin of the space"""
        allocation = db.query(MemberAllocation).filter(
            and_(
                MemberAllocation.space_id == space_id,
                MemberAllocation.user_id == user_id,
                MemberAllocation.role == "ADMIN",
                MemberAllocation.is_active == True
            )
        ).first()
        return allocation is not None

    @staticmethod
    def is_space_member(db: Session, space_id: UUID, user_id: UUID) -> bool:
        """Check if user is a member of the space"""
        allocation = db.query(MemberAllocation).filter(
            and_(
                MemberAllocation.space_id == space_id,
                MemberAllocation.user_id == user_id,
                MemberAllocation.is_active == True
            )
        ).first()
        return allocation is not None

    @staticmethod
    def delete_space(db: Session, space_id: UUID) -> bool:
        """Delete a space (soft delete)"""
        db_space = db.query(Space).filter(Space.id == space_id).first()
        if not db_space:
            return False

        db_space.is_active = False
        db.commit()
        return True

    @staticmethod
    def update_member_allocation(
        db: Session,
        space_id: UUID,
        user_id: UUID,
        allocation_update: MemberAllocationUpdate
    ) -> Optional[MemberAllocation]:
        """Update member allocation percentage and/or role"""
        db_allocation = db.query(MemberAllocation).filter(
            and_(
                MemberAllocation.space_id == space_id,
                MemberAllocation.user_id == user_id,
                MemberAllocation.is_active == True
            )
        ).first()

        if not db_allocation:
            return None

        for field, value in allocation_update.dict(exclude_unset=True).items():
            setattr(db_allocation, field, value)

        db.commit()
        db.refresh(db_allocation)
        return db_allocation

    @staticmethod
    def get_space_balance(db: Session, space_id: UUID, currency: str = "USD") -> int:
        """Calculate space balance (sum of all member balances)"""
        from app.models.ledger import LedgerEntry
        from sqlalchemy import func, or_

        # Sum all credits and pledges for this space
        credits = db.query(func.sum(LedgerEntry.amount_minor)).filter(
            and_(
                LedgerEntry.space_id == space_id,
                LedgerEntry.currency == currency,
                or_(
                    LedgerEntry.type == "CREDIT",
                    LedgerEntry.type == "PLEDGE"
                )
            )
        ).scalar() or 0

        # Sum all debits for this space
        debits = db.query(func.sum(LedgerEntry.amount_minor)).filter(
            and_(
                LedgerEntry.space_id == space_id,
                LedgerEntry.currency == currency,
                LedgerEntry.type == "DEBIT"
            )
        ).scalar() or 0

        return int(credits - debits)

    @staticmethod
    def get_space_ledger(
        db: Session,
        space_id: UUID,
        currency: str = "USD",
        skip: int = 0,
        limit: int = 100
    ):
        """Get space ledger entries"""
        from app.models.ledger import LedgerEntry

        entries = db.query(LedgerEntry).filter(
            and_(
                LedgerEntry.space_id == space_id,
                LedgerEntry.currency == currency
            )
        ).order_by(LedgerEntry.event_time.desc()).offset(skip).limit(limit).all()

        return [
            {
                "id": str(entry.id),
                "user_id": str(entry.user_id),
                "type": entry.type,
                "amount_minor": entry.amount_minor,
                "currency": entry.currency,
                "ref_type": entry.ref_type,
                "ref_id": entry.ref_id,
                "memo": entry.memo,
                "event_time": entry.event_time.isoformat() if entry.event_time else None
            }
            for entry in entries
        ]