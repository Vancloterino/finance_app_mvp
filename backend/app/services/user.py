from typing import Optional
from uuid import UUID
from sqlalchemy.orm import Session

from app.models.user import User
from app.schemas.user import UserCreate, UserUpdate


class UserService:
    @staticmethod
    def create_user(db: Session, user: UserCreate) -> User:
        """Create a new user"""
        db_user = User(**user.dict())
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