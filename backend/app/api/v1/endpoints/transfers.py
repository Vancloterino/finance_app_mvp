from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.schemas.transfer import TransferCreate, Transfer
from app.services.space import SpaceService

router = APIRouter()


@router.post("/", response_model=Transfer, status_code=status.HTTP_201_CREATED)
def create_transfer(
    transfer: TransferCreate,
    db: Session = Depends(get_db),
    current_user_id: UUID = Depends(get_current_user_id)
):
    """Transfer funds between two spaces"""
    # Verify user is member of both spaces
    if not SpaceService.is_space_member(db, transfer.from_space_id, current_user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a member of the source space"
        )

    if not SpaceService.is_space_member(db, transfer.to_space_id, current_user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a member of the destination space"
        )

    # Verify spaces are different
    if transfer.from_space_id == transfer.to_space_id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot transfer to the same space"
        )

    # Create ledger entries for the transfer
    from datetime import datetime
    from app.models.ledger import LedgerEntry
    import uuid

    # Debit from source space (negative amount represents withdrawal)
    debit_entry = LedgerEntry(
        space_id=transfer.from_space_id,
        user_id=current_user_id,
        type="DEBIT",
        currency=transfer.currency,
        amount_minor=transfer.amount_minor,  # Positive amount for debit
        ref_type="TRANSFER",
        ref_id=str(uuid.uuid4()),
        event_time=datetime.utcnow(),
        memo=transfer.memo or f"Transfer to another space"
    )
    db.add(debit_entry)

    # Credit to destination space
    credit_entry = LedgerEntry(
        space_id=transfer.to_space_id,
        user_id=current_user_id,
        type="CREDIT",
        currency=transfer.currency,
        amount_minor=transfer.amount_minor,
        ref_type="TRANSFER",
        ref_id=str(uuid.uuid4()),
        event_time=datetime.utcnow(),
        memo=transfer.memo or f"Transfer from another space"
    )
    db.add(credit_entry)

    db.commit()

    return Transfer(
        from_space_id=transfer.from_space_id,
        to_space_id=transfer.to_space_id,
        amount_minor=transfer.amount_minor,
        currency=transfer.currency,
        memo=transfer.memo,
        user_id=current_user_id
    )
