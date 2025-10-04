from datetime import timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.database import get_db
from app.core.security import create_access_token, get_current_user_id
from app.core.config import settings
from uuid import UUID
from app.schemas.auth import LoginRequest, Token, EmailPasswordLogin, RegisterRequest, TokenWithUser
from app.schemas.user import UserCreate
from app.services.user import UserService

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


@router.post("/login", response_model=Token)
@limiter.limit("5/minute")
def login(
    request: Request,
    login_request: LoginRequest,
    db: Session = Depends(get_db)
):
    """Login or register user with external auth provider"""
    # Check if user exists
    user = UserService.get_user_by_auth_id(db, login_request.auth_id)

    if not user:
        # User doesn't exist, create new user
        if not login_request.email or not login_request.name:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email and name are required for new users"
            )

        user_create = UserCreate(
            email=login_request.email,
            name=login_request.name,
            auth_id=login_request.auth_id
        )

        try:
            user = UserService.create_user(db, user_create)
        except Exception as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Failed to create user"
            )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is deactivated"
        )

    # Create access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=access_token_expires
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


@router.post("/dev-token", response_model=Token)
def create_dev_token(
    user_id: str,
    db: Session = Depends(get_db)
):
    """Create development token for testing (should be removed in production)"""
    try:
        from uuid import UUID
        user = UserService.get_user(db, UUID(user_id))
        if not user:
            raise HTTPException(
                status_code=status.HTTP_404_NOT_FOUND,
                detail="User not found"
            )

        access_token = create_access_token(data={"sub": str(user.id)})
        return {
            "access_token": access_token,
            "token_type": "bearer"
        }
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID format"
        )


@router.post("/register", response_model=Token)
@limiter.limit("3/minute")
def register(
    request: Request,
    register_request: RegisterRequest,
    db: Session = Depends(get_db)
):
    """Register a new user with email and password"""
    # Check if user already exists
    existing_user = UserService.get_user_by_email(db, register_request.email)
    if existing_user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email already registered"
        )

    # Create new user
    user_create = UserCreate(
        email=register_request.email,
        name=register_request.name,
        password=register_request.password
    )

    try:
        user = UserService.create_user(db, user_create)
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Failed to create user"
        )

    # Create access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=access_token_expires
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }


@router.post("/login-email", response_model=TokenWithUser)
@limiter.limit("5/minute")
def login_email(
    request: Request,
    login_request: EmailPasswordLogin,
    db: Session = Depends(get_db)
):
    """Login with email and password"""
    user = UserService.authenticate_user(db, login_request.email, login_request.password)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is deactivated"
        )

    # Create access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=access_token_expires
    )

    return {
        "access_token": access_token,
        "token_type": "bearer",
        "user": {
            "id": str(user.id),
            "email": user.email,
            "name": user.name,
            "is_active": user.is_active,
            "email_verified": user.email_verified
        }
    }


@router.post("/refresh", response_model=Token)
@limiter.limit("10/minute")
def refresh_token(
    request: Request,
    db: Session = Depends(get_db),
    current_user_id: UUID = Depends(get_current_user_id)
):
    """Refresh access token using current valid token"""
    # Verify user still exists and is active
    user = UserService.get_user(db, current_user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    if not user.is_active:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is deactivated"
        )

    # Create new access token
    access_token_expires = timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)
    access_token = create_access_token(
        data={"sub": str(user.id)},
        expires_delta=access_token_expires
    )

    return {
        "access_token": access_token,
        "token_type": "bearer"
    }