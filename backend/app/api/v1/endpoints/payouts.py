from typing import List, Dict
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Request
from sqlalchemy.orm import Session
from slowapi import Limiter
from slowapi.util import get_remote_address

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.schemas import payout as payout_schemas
from app.services.payout import PayoutService
from app.services.space import SpaceService
from app.services.audit import AuditService
from app.services.user import UserService

router = APIRouter()
limiter = Limiter(key_func=get_remote_address)


@router.post("/", response_model=payout_schemas.Payout, status_code=status.HTTP_201_CREATED)
@limiter.limit("10/minute")  # Rate limit: 10 payout creations per minute
def create_payout(
    payout: payout_schemas.PayoutCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user_id: UUID = Depends(get_current_user_id)
):
    """Create a new payout proposal (admin only)"""
    user_id = current_user_id

    try:
        result = PayoutService.create_payout(db, payout, user_id)

        # Audit log
        user = UserService.get_user(db, user_id)
        if user:
            AuditService.log_payout_create(
                db=db,
                payout_id=result.id,
                space_id=payout.space_id,
                user_id=user_id,
                user_email=user.email,
                amount=str(payout.amount_minor),
                currency=payout.currency,
                description=payout.description,
                request=request
            )

        return result
    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail=str(e)
        )


@router.get("/", response_model=List[payout_schemas.Payout])
def list_payouts(
    space_id: UUID,
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user_id: UUID = Depends(get_current_user_id)
):
    """List payouts for a space"""
    user_id = current_user_id

    # Verify user is member of the space
    if not SpaceService.is_space_member(db, space_id, user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a member of this space"
        )

    return PayoutService.get_space_payouts(db, space_id, skip, limit)


@router.get("/{payout_id}", response_model=payout_schemas.Payout)
def get_payout(
    payout_id: UUID,
    db: Session = Depends(get_db),
    current_user_id: UUID = Depends(get_current_user_id)
):
    """Get a specific payout"""
    user_id = current_user_id

    payout = PayoutService.get_payout(db, payout_id)
    if not payout:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payout not found"
        )

    # Verify user is member of the space
    if not SpaceService.is_space_member(db, payout.space_id, user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a member of this space"
        )

    return payout


@router.post("/{payout_id}/consent", response_model=payout_schemas.Consent, status_code=status.HTTP_201_CREATED)
@limiter.limit("20/minute")  # Rate limit: 20 consent submissions per minute
def submit_consent(
    payout_id: UUID,
    consent: payout_schemas.ConsentCreate,
    request: Request,
    db: Session = Depends(get_db),
    current_user_id: UUID = Depends(get_current_user_id)
):
    """Submit consent for a payout"""
    user_id = current_user_id

    # Verify payout exists and user is member
    payout = PayoutService.get_payout(db, payout_id)
    if not payout:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payout not found"
        )

    # Verify user is member of the space
    if not SpaceService.is_space_member(db, payout.space_id, user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a member of this space"
        )

    consent_record = PayoutService.submit_consent(db, payout_id, user_id, consent)
    if not consent_record:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Consent record not found for this user and payout"
        )

    # Audit log
    user = UserService.get_user(db, user_id)
    if user:
        approved = consent.decision.value == "approve" if hasattr(consent.decision, 'value') else consent.decision == "approve"
        AuditService.log_consent_submit(
            db=db,
            payout_id=payout_id,
            user_id=user_id,
            user_email=user.email,
            approved=approved,
            comment=consent.reason,
            request=request
        )

    return consent_record


@router.get("/{payout_id}/consents", response_model=List[payout_schemas.Consent])
def get_payout_consents(
    payout_id: UUID,
    db: Session = Depends(get_db),
    current_user_id: UUID = Depends(get_current_user_id)
):
    """Get all consents for a payout"""
    user_id = current_user_id

    # Verify payout exists and user is member
    payout = PayoutService.get_payout(db, payout_id)
    if not payout:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payout not found"
        )

    # Verify user is member of the space
    if not SpaceService.is_space_member(db, payout.space_id, user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a member of this space"
        )

    return PayoutService.get_payout_consents(db, payout_id)


@router.get("/{payout_id}/consent-summary")
def get_consent_summary(
    payout_id: UUID,
    db: Session = Depends(get_db),
    current_user_id: UUID = Depends(get_current_user_id)
):
    """Get consent summary with allocation percentages"""
    user_id = current_user_id

    # Verify payout exists
    payout = PayoutService.get_payout(db, payout_id)
    if not payout:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payout not found"
        )

    # Verify user is member of the space
    if not SpaceService.is_space_member(db, payout.space_id, user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a member of this space"
        )

    summary = PayoutService.get_consent_summary(db, payout_id)
    return {
        "payout_id": payout_id,
        "payout_amount_minor": payout.amount_minor,
        "payout_amount": payout.amount_minor / 100,  # Convert to major units
        "payee_name": payout.payee_name,
        "status": payout.status,
        "consent_deadline": payout.consent_deadline,
        **summary
    }


@router.post("/{payout_id}/execute", status_code=status.HTTP_204_NO_CONTENT)
@limiter.limit("5/minute")  # Rate limit: 5 payout executions per minute (strict limit for financial operations)
def execute_payout(
    payout_id: UUID,
    request: Request,
    db: Session = Depends(get_db),
    current_user_id: UUID = Depends(get_current_user_id)
):
    """Execute a payout (admin only)"""
    user_id = current_user_id

    # Verify payout exists
    payout = PayoutService.get_payout(db, payout_id)
    if not payout:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payout not found"
        )

    # Verify user is admin of the space
    if not SpaceService.is_space_admin(db, payout.space_id, user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only space admins can execute payouts"
        )

    success = PayoutService.execute_payout(db, payout_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payout is not ready for execution"
        )

    # Audit log
    user = UserService.get_user(db, user_id)
    if user:
        AuditService.log_payout_execute(
            db=db,
            payout_id=payout_id,
            user_id=user_id,
            user_email=user.email,
            amount=str(payout.amount_minor),
            currency=payout.currency,
            request=request
        )


@router.post("/{payout_id}/process-payments")
def process_payout_payments(
    payout_id: UUID,
    db: Session = Depends(get_db),
    current_user_id: UUID = Depends(get_current_user_id)
):
    """Process payments for a payout via Stripe"""
    user_id = current_user_id

    # Verify payout exists
    payout = PayoutService.get_payout(db, payout_id)
    if not payout:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Payout not found"
        )

    # Verify user is admin of the space
    if not SpaceService.is_space_admin(db, payout.space_id, user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only space admins can process payout payments"
        )

    try:
        result = PayoutService.process_payout_payments(db, payout_id)

        if not result["success"]:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail={
                    "message": "Failed to process payout payments",
                    "errors": result["errors"]
                }
            )

        return {
            "payout_id": payout_id,
            "message": "Payment intents created successfully",
            "payment_results": result["payment_results"]
        }

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Internal error processing payments: {str(e)}"
        )


@router.post("/{payout_id}/complete", status_code=status.HTTP_204_NO_CONTENT)
def complete_payout(
    payout_id: UUID,
    db: Session = Depends(get_db)
):
    """Complete a payout and create ledger entries (system/webhook only)"""
    # NOTE: This endpoint is for internal/webhook use only - no user auth required

    success = PayoutService.complete_payout(db, payout_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Payout is not in executing state"
        )