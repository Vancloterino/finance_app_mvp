from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.schemas import user as user_schemas
from app.services.user import UserService

router = APIRouter()


@router.post("/", response_model=user_schemas.User, status_code=status.HTTP_201_CREATED)
def create_user(
    user: user_schemas.UserCreate,
    db: Session = Depends(get_db)
):
    """Create a new user"""
    # Check if user with email already exists
    existing_user = UserService.get_user_by_email(db, user.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Check if user with auth_id already exists
    existing_auth_user = UserService.get_user_by_auth_id(db, user.auth_id)
    if existing_auth_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Auth ID already registered"
        )

    return UserService.create_user(db, user)


@router.get("/me", response_model=user_schemas.User)
def get_current_user(
    db: Session = Depends(get_db),
    current_user_id: UUID = Depends(get_current_user_id)
):
    """Get current user profile"""
    user = UserService.get_user(db, current_user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    return user


@router.get("/{user_id}", response_model=user_schemas.User)
def get_user(
    user_id: UUID,
    db: Session = Depends(get_db),
    # current_user: User = Depends(get_current_user)  # TODO: Add auth
):
    """Get user by ID"""
    user = UserService.get_user(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    return user


@router.patch("/me", response_model=user_schemas.User)
def update_current_user(
    user_update: user_schemas.UserUpdate,
    db: Session = Depends(get_db),
    current_user_id: UUID = Depends(get_current_user_id)
):
    """Update current user profile"""
    user = UserService.update_user(db, current_user_id, user_update)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    return user


@router.post("/me/verify-email", status_code=status.HTTP_204_NO_CONTENT)
def verify_user_email(
    db: Session = Depends(get_db),
    current_user_id: UUID = Depends(get_current_user_id)
):
    """Mark current user's email as verified"""
    success = UserService.verify_email(db, current_user_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )


@router.post("/me/deactivate", status_code=status.HTTP_204_NO_CONTENT)
def deactivate_current_user(
    db: Session = Depends(get_db),
    current_user_id: UUID = Depends(get_current_user_id)
):
    """Deactivate current user account"""
    success = UserService.deactivate_user(db, current_user_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )