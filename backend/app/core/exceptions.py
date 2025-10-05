"""
Custom exceptions and error handling utilities for the application.
Provides standardized error responses and transaction rollback patterns.
"""

from typing import Optional, Dict, Any
from fastapi import HTTPException, status


class AppException(Exception):
    """Base application exception"""
    def __init__(
        self,
        message: str,
        status_code: int = status.HTTP_500_INTERNAL_SERVER_ERROR,
        details: Optional[Dict[str, Any]] = None
    ):
        self.message = message
        self.status_code = status_code
        self.details = details or {}
        super().__init__(self.message)

    def to_http_exception(self) -> HTTPException:
        """Convert to FastAPI HTTPException"""
        return HTTPException(
            status_code=self.status_code,
            detail={
                "message": self.message,
                **self.details
            }
        )


class NotFoundError(AppException):
    """Resource not found error"""
    def __init__(self, resource: str, identifier: Any = None):
        message = f"{resource} not found"
        if identifier:
            message += f": {identifier}"
        super().__init__(message, status_code=status.HTTP_404_NOT_FOUND)


class PermissionDeniedError(AppException):
    """Permission denied error"""
    def __init__(self, message: str = "Permission denied"):
        super().__init__(message, status_code=status.HTTP_403_FORBIDDEN)


class ValidationError(AppException):
    """Validation error"""
    def __init__(self, message: str, field: Optional[str] = None):
        details = {"field": field} if field else {}
        super().__init__(message, status_code=status.HTTP_400_BAD_REQUEST, details=details)


class ConflictError(AppException):
    """Resource conflict error (e.g., duplicate)"""
    def __init__(self, message: str):
        super().__init__(message, status_code=status.HTTP_409_CONFLICT)


class PaymentError(AppException):
    """Payment processing error"""
    def __init__(self, message: str, payment_intent_id: Optional[str] = None):
        details = {"payment_intent_id": payment_intent_id} if payment_intent_id else {}
        super().__init__(message, status_code=status.HTTP_402_PAYMENT_REQUIRED, details=details)


class DatabaseError(AppException):
    """Database operation error"""
    def __init__(self, message: str = "Database operation failed"):
        super().__init__(message, status_code=status.HTTP_500_INTERNAL_SERVER_ERROR)


def handle_db_error(func):
    """
    Decorator to handle database errors with automatic rollback.

    Usage:
        @handle_db_error
        def some_service_method(db: Session, ...):
            # Database operations
            pass
    """
    def wrapper(*args, **kwargs):
        db = None
        # Find db Session in args or kwargs
        for arg in args:
            if hasattr(arg, 'rollback'):
                db = arg
                break
        if not db and 'db' in kwargs:
            db = kwargs['db']

        try:
            return func(*args, **kwargs)
        except AppException:
            # Re-raise app exceptions without wrapping
            if db:
                db.rollback()
            raise
        except Exception as e:
            # Rollback and wrap unexpected errors
            if db:
                db.rollback()
            raise DatabaseError(f"Database operation failed: {str(e)}")

    return wrapper


# Standard error messages
class ErrorMessages:
    """Centralized error messages"""

    # Resource not found
    USER_NOT_FOUND = "User not found"
    SPACE_NOT_FOUND = "Space not found"
    PLEDGE_NOT_FOUND = "Pledge not found"
    PAYOUT_NOT_FOUND = "Payout not found"

    # Permission errors
    NOT_SPACE_MEMBER = "Not a member of this space"
    NOT_SPACE_ADMIN = "Only space admins can perform this action"
    INSUFFICIENT_PERMISSIONS = "Insufficient permissions"

    # Validation errors
    INVALID_EMAIL = "Invalid email address"
    INVALID_AMOUNT = "Amount must be positive"
    INVALID_ALLOCATION = "Allocation percentage must be between 0 and 1"
    ALLOCATION_EXCEEDS_100 = "Total allocation exceeds 100%"

    # Conflict errors
    EMAIL_ALREADY_EXISTS = "Email already registered"
    ALREADY_SPACE_MEMBER = "User is already a member of this space"

    # Payment errors
    PAYMENT_FAILED = "Payment processing failed"
    INSUFFICIENT_FUNDS = "Insufficient funds"
    PAYMENT_METHOD_REQUIRED = "Payment method required"

    # Payout errors
    PAYOUT_NOT_READY = "Payout is not ready for execution"
    PAYOUT_ALREADY_EXECUTED = "Payout has already been executed"
    CONSENT_REQUIRED = "User consent required for this payout"
