from typing import List, Dict
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.services.stripe_service import StripeService
from app.services.user import UserService

router = APIRouter()


@router.post("/setup-intent")
def create_setup_intent(
    db: Session = Depends(get_db),
    current_user_id: UUID = Depends(get_current_user_id)
):
    """Create a SetupIntent for saving payment methods"""
    user_id = current_user_id

    user = UserService.get_user(db, user_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Create Stripe customer if not exists
    if not user.stripe_customer_id:
        try:
            customer = StripeService.create_customer(
                email=user.email,
                name=user.name,
                metadata={"user_id": str(user.id)}
            )
            user = UserService.update_stripe_customer(db, user.id, customer.id)
        except ValueError as e:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=str(e)
            )

    # Create SetupIntent
    try:
        setup_intent = StripeService.create_setup_intent(user.stripe_customer_id)
        return {
            "client_secret": setup_intent.client_secret,
            "setup_intent_id": setup_intent.id
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/payment-methods")
def get_payment_methods(
    db: Session = Depends(get_db),
    current_user_id: UUID = Depends(get_current_user_id)
):
    """Get user's payment methods"""
    user_id = current_user_id

    user = UserService.get_user(db, user_id)
    if not user or not user.stripe_customer_id:
        return {"payment_methods": []}

    try:
        payment_methods = StripeService.get_payment_methods(user.stripe_customer_id)
        return {
            "payment_methods": [
                {
                    "id": pm.id,
                    "type": pm.type,
                    "card": {
                        "brand": pm.card.brand,
                        "last4": pm.card.last4,
                        "exp_month": pm.card.exp_month,
                        "exp_year": pm.card.exp_year
                    } if pm.card else None
                }
                for pm in payment_methods
            ]
        }
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.post("/payment-methods/{payment_method_id}/set-default")
def set_default_payment_method(
    payment_method_id: str,
    db: Session = Depends(get_db),
    current_user_id: UUID = Depends(get_current_user_id)
):
    """Set default payment method for user"""
    user_id = current_user_id

    user = UserService.update_payment_method(db, user_id, payment_method_id)
    if not user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    return {"message": "Default payment method updated"}


@router.delete("/payment-methods/{payment_method_id}")
def remove_payment_method(
    payment_method_id: str,
    db: Session = Depends(get_db),
    current_user_id: UUID = Depends(get_current_user_id)
):
    """Remove a payment method"""
    user_id = current_user_id

    try:
        StripeService.detach_payment_method(payment_method_id)

        # If this was the user's default payment method, clear it
        user = UserService.get_user(db, user_id)
        if user and user.payment_method_id == payment_method_id:
            UserService.update_payment_method(db, user_id, None)

        return {"message": "Payment method removed"}
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )


@router.get("/stripe-config")
def get_stripe_config():
    """Get Stripe public configuration"""
    from app.core.config import settings
    return {
        "publishable_key": settings.STRIPE_PUBLISHABLE_KEY
    }