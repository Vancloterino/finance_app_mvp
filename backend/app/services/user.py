from typing import Optional
from uuid import UUID
from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate
from app.core.security import get_password_hash, verify_password


class UserService:
    @staticmethod
    def create_user(db: Session, user: UserCreate) -> User:
        """Create a new user"""
        user_data = user.dict()

        # Hash password if provided
        if user_data.get('password'):
            user_data['password_hash'] = get_password_hash(user_data['password'])
            del user_data['password']  # Remove plain password

        # Generate unique auth_id for email/password users if not provided
        if not user_data.get('auth_id'):
            user_data['auth_id'] = f"email:{user_data['email']}"

        db_user = User(**user_data)
        db.add(db_user)
        db.commit()
        db.refresh(db_user)
        return db_user

    @staticmethod
    def get_user(db: Session, user_id: UUID) -> Optional[User]:
        """Get a user by ID"""
        return db.query(User).filter(User.id == user_id).first()

    @staticmethod
    def get_user_by_email(db: Session, email: str) -> Optional[User]:
        """Get a user by email"""
        return db.query(User).filter(User.email == email).first()

    @staticmethod
    def get_user_by_auth_id(db: Session, auth_id: str) -> Optional[User]:
        """Get a user by auth ID"""
        return db.query(User).filter(User.auth_id == auth_id).first()

    @staticmethod
    def update_user(db: Session, user_id: UUID, user_update: UserUpdate) -> Optional[User]:
        """Update a user"""
        db_user = db.query(User).filter(User.id == user_id).first()
        if not db_user:
            return None

        for field, value in user_update.dict(exclude_unset=True).items():
            setattr(db_user, field, value)

        db.commit()
        db.refresh(db_user)
        return db_user

    @staticmethod
    def update_stripe_customer(db: Session, user_id: UUID, stripe_customer_id: str) -> Optional[User]:
        """Update user's Stripe customer ID"""
        db_user = db.query(User).filter(User.id == user_id).first()
        if not db_user:
            return None

        db_user.stripe_customer_id = stripe_customer_id
        db.commit()
        db.refresh(db_user)
        return db_user

    @staticmethod
    def update_payment_method(db: Session, user_id: UUID, payment_method_id: str) -> Optional[User]:
        """Update user's payment method ID"""
        db_user = db.query(User).filter(User.id == user_id).first()
        if not db_user:
            return None

        db_user.payment_method_id = payment_method_id
        db.commit()
        db.refresh(db_user)
        return db_user

    @staticmethod
    def deactivate_user(db: Session, user_id: UUID) -> bool:
        """Deactivate a user account"""
        db_user = db.query(User).filter(User.id == user_id).first()
        if not db_user:
            return False

        db_user.is_active = False
        db.commit()
        return True

    @staticmethod
    def verify_email(db: Session, user_id: UUID) -> bool:
        """Mark user's email as verified"""
        db_user = db.query(User).filter(User.id == user_id).first()
        if not db_user:
            return False

        db_user.email_verified = True
        db.commit()
        return True

    @staticmethod
    def authenticate_user(db: Session, email: Optional[str], password: str, user_id: Optional[UUID] = None) -> Optional[User]:
        """Authenticate a user with email and password, or by user_id for password verification"""
        if user_id:
            user = UserService.get_user(db, user_id)
        elif email:
            user = UserService.get_user_by_email(db, email)
        else:
            return None

        if not user or not user.password_hash:
            return None

        if not verify_password(password, user.password_hash):
            return None

        return user

    @staticmethod
    def change_password(db: Session, user_id: UUID, new_password: str) -> bool:
        """Change a user's password"""
        db_user = db.query(User).filter(User.id == user_id).first()
        if not db_user:
            return False

        db_user.password_hash = get_password_hash(new_password)
        db.commit()
        return True

    @staticmethod
    def get_user_spaces(db: Session, user_id: UUID):
        """Get all spaces a user is member of"""
        from app.models.space import MemberAllocation
        from sqlalchemy import and_

        allocations = db.query(MemberAllocation).filter(
            and_(
                MemberAllocation.user_id == user_id,
                MemberAllocation.is_active == True
            )
        ).all()

        # Return list of spaces with user's role and allocation
        return [
            {
                "id": alloc.space_id,
                "name": alloc.space.name if alloc.space else "",
                "description": alloc.space.description if alloc.space else None,
                "allocation_pct": float(alloc.allocation_pct),
                "is_admin": alloc.role == "admin",
                "created_at": alloc.created_at,
                "updated_at": alloc.updated_at
            }
            for alloc in allocations
        ]

    @staticmethod
    def get_user_total_balance(db: Session, user_id: UUID, currency: str = "USD") -> int:
        """Calculate user's total balance across all spaces"""
        from app.models.ledger import LedgerEntry
        from sqlalchemy import func, and_, or_

        # Sum all credits and pledges (positive contributions)
        credits = db.query(func.sum(LedgerEntry.amount_minor)).filter(
            and_(
                LedgerEntry.user_id == user_id,
                LedgerEntry.currency == currency,
                or_(
                    LedgerEntry.type == "CREDIT",
                    LedgerEntry.type == "PLEDGE"
                )
            )
        ).scalar() or 0

        # Sum all debits (negative contributions)
        debits = db.query(func.sum(LedgerEntry.amount_minor)).filter(
            and_(
                LedgerEntry.user_id == user_id,
                LedgerEntry.currency == currency,
                LedgerEntry.type == "DEBIT"
            )
        ).scalar() or 0

        return int(credits - debits)

    @staticmethod
    def get_user_ledger(db: Session, user_id: UUID, currency: str = "USD", skip: int = 0, limit: int = 100):
        """Get user's ledger entries"""
        from app.models.ledger import LedgerEntry
        from sqlalchemy import and_

        entries = db.query(LedgerEntry).filter(
            and_(
                LedgerEntry.user_id == user_id,
                LedgerEntry.currency == currency
            )
        ).order_by(LedgerEntry.event_time.desc()).offset(skip).limit(limit).all()

        return [
            {
                "id": str(entry.id),
                "space_id": str(entry.space_id),
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