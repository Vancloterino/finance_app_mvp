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
    """Create development token for testing (DEVELOPMENT ONLY)"""
    # Only allow in development environment
    if settings.ENVIRONMENT != "development":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Endpoint not available"
        )

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

    # Send verification email
    from app.core.security import create_email_verification_token
    from app.services.notification import NotificationService

    verification_token = create_email_verification_token(str(user.id))
    NotificationService.send_verification_email(
        email=user.email,
        name=user.name,
        verification_token=verification_token
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
    print(f"[DEBUG] Login attempt for email: {login_request.email}")
    user = UserService.authenticate_user(db, login_request.email, login_request.password)
    if not user:
        print(f"[DEBUG] Authentication failed for: {login_request.email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Incorrect email or password"
        )

    print(f"[DEBUG] User found: email={user.email}, is_active={user.is_active}, email_verified={user.email_verified}")

    if not user.is_active:
        print(f"[DEBUG] User is not active: {user.email}")
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="User account is deactivated"
        )

    # Check if email is verified (skip in development)
    from app.core.config import settings
    if settings.ENVIRONMENT == "production" and not user.email_verified:
        print(f"[DEBUG] Email not verified for: {user.email}")
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Please verify your email address before logging in. Check your inbox for the verification link."
        )
    elif not user.email_verified:
        print(f"[DEBUG] Email not verified but allowing in {settings.ENVIRONMENT} environment")

    print(f"[DEBUG] All checks passed, creating token for: {user.email}")

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


@router.post("/logout", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit("10/minute")
def logout(
    request: Request,
    current_user_id: UUID = Depends(get_current_user_id)
):
    """
    Logout user by blacklisting current token.
    Token will be invalid until it naturally expires.
    """
    from app.core.cache import CacheService
    from jose import jwt

    # Extract token from Authorization header
    auth_header = request.headers.get("Authorization", "")
    if not auth_header.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authorization header"
        )

    token = auth_header.replace("Bearer ", "")

    # Decode token to get expiration time
    try:
        payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
        exp = payload.get("exp")
        if exp:
            import time
            ttl = int(exp - time.time())
            if ttl > 0:
                # Add token to blacklist with TTL matching token expiration
                cache_key = f"blacklist:token:{token}"
                CacheService.set(cache_key, "1", ttl=ttl)
    except Exception as e:
        # Token is already invalid or expired
        pass

    return None


@router.post("/logout-all", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit("5/minute")
def logout_all(
    request: Request,
    current_user_id: UUID = Depends(get_current_user_id)
):
    """
    Logout user from all devices by invalidating all tokens.
    Uses user-level blacklist that persists for token lifetime.
    """
    from app.core.cache import CacheService

    # Add user to blacklist for token expiration duration
    cache_key = f"blacklist:user:{str(current_user_id)}"
    ttl = settings.ACCESS_TOKEN_EXPIRE_MINUTES * 60  # Convert to seconds
    CacheService.set(cache_key, "1", ttl=ttl)

    return None


@router.post("/password-reset/request", status_code=status.HTTP_200_OK)
@limiter.limit("5/hour")
def request_password_reset(
    request: Request,
    reset_request: "PasswordResetRequest",
    db: Session = Depends(get_db)
):
    """
    Request password reset. Sends email with reset token.
    Always returns success to prevent email enumeration.
    """
    from app.schemas.password_reset import PasswordResetRequest, PasswordResetResponse
    from app.core.security import create_password_reset_token
    from app.services.notification import NotificationService

    # Look up user by email
    user = UserService.get_user_by_email(db, reset_request.email)

    if user:
        # Generate reset token
        reset_token = create_password_reset_token(str(user.id))

        # Send reset email
        NotificationService.send_password_reset_email(
            email=user.email,
            name=user.name,
            reset_token=reset_token
        )

    # Always return success (security best practice to prevent email enumeration)
    return PasswordResetResponse(
        message="If that email address is in our system, we have sent a password reset link to it."
    )


@router.post("/password-reset/confirm", status_code=status.HTTP_200_OK)
@limiter.limit("10/hour")
def confirm_password_reset(
    request: Request,
    reset_confirm: "PasswordResetConfirm",
    db: Session = Depends(get_db)
):
    """
    Confirm password reset with token and new password.
    """
    from app.schemas.password_reset import PasswordResetConfirm, PasswordResetResponse
    from app.core.security import verify_password_reset_token, get_password_hash

    # Verify reset token
    user_id = verify_password_reset_token(reset_confirm.token)

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired reset token"
        )

    # Get user
    from uuid import UUID
    try:
        user_uuid = UUID(user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID in token"
        )

    user = UserService.get_user_by_id(db, user_uuid)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Update password
    user.hashed_password = get_password_hash(reset_confirm.new_password)
    db.commit()

    return PasswordResetResponse(
        message="Your password has been reset successfully. You can now log in with your new password."
    )




@router.post("/verify-email", status_code=status.HTTP_200_OK)
@limiter.limit("10/hour")
def verify_email(
    request: Request,
    verification_data: dict,
    db: Session = Depends(get_db)
):
    """
    Verify email address with token.
    """
    from app.core.security import verify_email_verification_token
    from uuid import UUID

    token = verification_data.get("token")
    if not token:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Verification token is required"
        )

    # Verify token
    user_id = verify_email_verification_token(token)

    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid or expired verification token"
        )

    # Get user
    try:
        user_uuid = UUID(user_id)
    except ValueError:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Invalid user ID in token"
        )

    user = UserService.get_user_by_id(db, user_uuid)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Check if already verified
    if user.is_verified:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is already verified"
        )

    # Mark user as verified
    user.is_verified = True
    db.commit()

    return {"message": "Email verified successfully. You can now log in."}


@router.post("/resend-verification", status_code=status.HTTP_200_OK)
@limiter.limit("5/hour")
def resend_verification(
    request: Request,
    email_data: dict,
    db: Session = Depends(get_db)
):
    """
    Resend verification email.
    """
    from app.core.security import create_email_verification_token
    from app.services.notification import NotificationService

    email = email_data.get("email")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is required"
        )

    # Look up user
    user = UserService.get_user_by_email(db, email)

    if user:
        # Check if already verified
        if user.is_verified:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Email is already verified"
            )

        # Generate verification token
        verification_token = create_email_verification_token(str(user.id))

        # Send verification email
        NotificationService.send_verification_email(
            email=user.email,
            name=user.name,
            verification_token=verification_token
        )

    # Always return success (prevent email enumeration)
    return {"message": "If that email address is in our system, we have sent a verification link to it."}

