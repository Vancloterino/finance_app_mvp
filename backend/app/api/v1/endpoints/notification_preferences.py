from uuid import UUID
from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.models.notification_preferences import NotificationPreferences
from app.schemas.notification_preferences import (
    NotificationPreferencesUpdate,
    NotificationPreferencesResponse
)

router = APIRouter()


@router.get("/preferences", response_model=NotificationPreferencesResponse)
def get_notification_preferences(
    db: Session = Depends(get_db),
    current_user_id: UUID = Depends(get_current_user_id)
):
    """Get user's notification preferences"""
    prefs = db.query(NotificationPreferences).filter_by(user_id=current_user_id).first()

    # If no preferences exist, create default values
    if not prefs:
        prefs = NotificationPreferences(
            user_id=current_user_id,
            email_notifications=True,
            payment_notifications=True,
            space_updates=True,
            payout_notifications=True,
            pledge_reminders=True
        )
        db.add(prefs)
        db.commit()
        db.refresh(prefs)

    return prefs


@router.put("/preferences", response_model=NotificationPreferencesResponse)
def update_notification_preferences(
    preferences: NotificationPreferencesUpdate,
    db: Session = Depends(get_db),
    current_user_id: UUID = Depends(get_current_user_id)
):
    """Update user's notification preferences"""
    prefs = db.query(NotificationPreferences).filter_by(user_id=current_user_id).first()

    if not prefs:
        # Create new preferences with provided values
        prefs = NotificationPreferences(
            user_id=current_user_id,
            email_notifications=preferences.email_notifications if preferences.email_notifications is not None else True,
            payment_notifications=preferences.payment_notifications if preferences.payment_notifications is not None else True,
            space_updates=preferences.space_updates if preferences.space_updates is not None else True,
            payout_notifications=preferences.payout_notifications if preferences.payout_notifications is not None else True,
            pledge_reminders=preferences.pledge_reminders if preferences.pledge_reminders is not None else True
        )
        db.add(prefs)
    else:
        # Update existing preferences (only update provided fields)
        update_data = preferences.model_dump(exclude_unset=True)
        for field, value in update_data.items():
            setattr(prefs, field, value)

    db.commit()
    db.refresh(prefs)

    return prefs
