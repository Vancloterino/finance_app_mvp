from typing import Optional
from uuid import UUID
from fastapi import Depends, HTTPException, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import verify_token
from app.models.user import User
from app.services.user import UserService

security = HTTPBearer()


async def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
) -> User:
    """Get current user from JWT token"""
    from app.core.cache import CacheService

    credentials_exception = HTTPException(
        status_code=status.HTTP_401_UNAUTHORIZED,
        detail="Could not validate credentials",
        headers={"WWW-Authenticate": "Bearer"},
    )

    token = credentials.credentials

    try:
        payload = verify_token(token)
        if payload is None:
            raise credentials_exception

        user_id: str = payload.get("sub")
        if user_id is None:
            raise credentials_exception

        # Check if token is blacklisted
        token_blacklist_key = f"blacklist:token:{token}"
        if CacheService.get(token_blacklist_key):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Token has been revoked"
            )

        # Check if user is blacklisted (logout from all devices)
        user_blacklist_key = f"blacklist:user:{user_id}"
        if CacheService.get(user_blacklist_key):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Session has been terminated. Please login again."
            )

        user = UserService.get_user(db, UUID(user_id))
        if user is None:
            raise credentials_exception

        if not user.is_active:
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Inactive user"
            )

        return user

    except ValueError:  # Invalid UUID
        raise credentials_exception


async def get_current_active_user(current_user: User = Depends(get_current_user)) -> User:
    """Get current active user"""
    if not current_user.is_active:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Inactive user"
        )
    return current_user


# Optional: API Key authentication for development/testing
def get_api_key_user(api_key: str, db: Session) -> Optional[User]:
    """Get user by API key (development only)"""
    # In development, we can use a simple API key = user_id mapping
    # In production, this should be more secure
    try:
        # For now, assume API key is the user auth_id
        user = UserService.get_user_by_auth_id(db, api_key)
        return user if user and user.is_active else None
    except Exception:
        return None