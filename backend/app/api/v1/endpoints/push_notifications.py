"""
Push Notification API Endpoints

REST API for managing push notifications and device tokens.
"""

from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List

from app.core.auth import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.models.push_token import PushToken
from app.schemas.push_notification import (
    PushTokenRegister,
    PushTokenResponse,
    SendNotificationRequest,
    SendNotificationResponse,
    SendMultipleNotificationRequest,
    PushTokenStats
)
from app.services.push_notifications import PushNotificationService
from app.core.config import settings


router = APIRouter()


def get_push_service(db: Session = Depends(get_db)) -> PushNotificationService:
    """Dependency to get push notification service."""
    fcm_path = getattr(settings, 'FCM_CREDENTIALS_PATH', None)
    return PushNotificationService(db, fcm_credentials_path=fcm_path)


@router.post("/register", response_model=PushTokenResponse, status_code=status.HTTP_201_CREATED)
def register_device_token(
    token_data: PushTokenRegister,
    current_user: User = Depends(get_current_user),
    push_service: PushNotificationService = Depends(get_push_service)
):
    """
    Register a device token for push notifications.

    - **token**: FCM device token
    - **device_type**: Device type (ios, android, web)
    """
    # Validate device type
    valid_types = ["ios", "android", "web"]
    if token_data.device_type not in valid_types:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Invalid device type. Must be one of: {', '.join(valid_types)}"
        )

    result = push_service.register_device_token(
        user_id=current_user.id,
        token=token_data.token,
        device_type=token_data.device_type
    )

    if not result:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail="Failed to register device token"
        )

    return result


@router.delete("/unregister/{token}")
def unregister_device_token(
    token: str,
    current_user: User = Depends(get_current_user),
    push_service: PushNotificationService = Depends(get_push_service)
):
    """
    Unregister (deactivate) a device token.

    - **token**: FCM device token to unregister
    """
    result = push_service.unregister_device_token(token)

    if not result:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Device token not found"
        )

    return {"message": "Device token unregistered successfully"}


@router.get("/tokens", response_model=List[PushTokenResponse])
def get_my_tokens(
    current_user: User = Depends(get_current_user),
    push_service: PushNotificationService = Depends(get_push_service)
):
    """
    Get all active device tokens for the current user.
    """
    tokens = push_service.get_user_tokens(current_user.id)
    return tokens


@router.post("/send", response_model=SendNotificationResponse)
def send_notification(
    notification: SendNotificationRequest,
    current_user: User = Depends(get_current_user),
    push_service: PushNotificationService = Depends(get_push_service)
):
    """
    Send a push notification to the current user's devices.

    This is primarily for testing purposes.

    - **title**: Notification title
    - **body**: Notification body
    - **notification_type**: Optional notification type
    - **data**: Optional additional data payload
    - **badge**: Optional iOS badge count
    - **sound**: Optional sound file name
    """
    if not push_service.is_enabled():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Push notifications are not configured"
        )

    result = push_service.send_notification(
        user_id=current_user.id,
        title=notification.title,
        body=notification.body,
        notification_type=notification.notification_type,
        data=notification.data,
        badge=notification.badge,
        sound=notification.sound
    )

    total = result["success"] + result["failure"]
    message = f"Sent to {result['success']}/{total} devices"

    return SendNotificationResponse(
        success=result["success"],
        failure=result["failure"],
        message=message
    )


@router.post("/send-multiple", response_model=SendNotificationResponse)
def send_notification_to_multiple(
    notification: SendMultipleNotificationRequest,
    current_user: User = Depends(get_current_user),
    push_service: PushNotificationService = Depends(get_push_service)
):
    """
    Send a push notification to multiple users.

    This endpoint is restricted to admin users in production.

    - **user_ids**: List of user IDs to send to
    - **title**: Notification title
    - **body**: Notification body
    - **notification_type**: Optional notification type
    - **data**: Optional additional data payload
    """
    if not push_service.is_enabled():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Push notifications are not configured"
        )

    # In production, add admin check here
    # if not current_user.is_admin:
    #     raise HTTPException(status_code=403, detail="Admin access required")

    result = push_service.send_notification_to_multiple(
        user_ids=notification.user_ids,
        title=notification.title,
        body=notification.body,
        notification_type=notification.notification_type,
        data=notification.data
    )

    total = result["success"] + result["failure"]
    message = f"Sent to {result['success']}/{total} devices across {len(notification.user_ids)} users"

    return SendNotificationResponse(
        success=result["success"],
        failure=result["failure"],
        message=message
    )


@router.get("/stats", response_model=PushTokenStats)
def get_push_token_stats(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db)
):
    """
    Get statistics about push tokens.

    This endpoint is restricted to admin users in production.
    """
    # In production, add admin check here
    # if not current_user.is_admin:
    #     raise HTTPException(status_code=403, detail="Admin access required")

    total_tokens = db.query(PushToken).count()
    active_tokens = db.query(PushToken).filter(PushToken.is_active == True).count()
    inactive_tokens = total_tokens - active_tokens

    # Get tokens by device type
    device_types = db.query(
        PushToken.device_type,
        db.func.count(PushToken.id)
    ).filter(
        PushToken.is_active == True
    ).group_by(PushToken.device_type).all()

    tokens_by_device = {device: count for device, count in device_types}

    return PushTokenStats(
        total_tokens=total_tokens,
        active_tokens=active_tokens,
        inactive_tokens=inactive_tokens,
        tokens_by_device_type=tokens_by_device
    )
