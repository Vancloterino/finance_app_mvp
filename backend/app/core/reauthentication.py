"""
Re-authentication utilities for sensitive operations.
Requires users to verify their password before performing critical actions.
"""

from fastapi import HTTPException, status
from sqlalchemy.orm import Session
from uuid import UUID
from app.services.user import UserService


def require_password_verification(
    db: Session,
    user_id: UUID,
    password: str
) -> None:
    """
    Verify that the provided password matches the user's current password.
    Raises HTTPException if verification fails.

    Args:
        db: Database session
        user_id: User ID to verify
        password: Password to verify

    Raises:
        HTTPException: If password verification fails
    """
    user = UserService.authenticate_user(db, None, password, user_id=user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Password verification failed. Please enter your current password."
        )
