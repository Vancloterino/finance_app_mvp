from typing import List, Optional
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas import pledge as pledge_schemas
from app.services.pledge import PledgeService
from app.services.space import SpaceService

router = APIRouter()


@router.post("/", response_model=pledge_schemas.Pledge, status_code=status.HTTP_201_CREATED)
def create_pledge(
    pledge: pledge_schemas.PledgeCreate,
    db: Session = Depends(get_db),
    # current_user: User = Depends(get_current_user)  # TODO: Add auth
):
    """Create a new pledge"""
    # TODO: Get current user from auth
    user_id = UUID("550e8400-e29b-41d4-a716-446655440000")  # Mock user ID

    # TODO: Verify user is member of the space
    # if not SpaceService.is_space_member(db, pledge.space_id, user_id):
    #     raise HTTPException(
    #         status_code=status.HTTP_403_FORBIDDEN,
    #         detail="Not a member of this space"
    #     )

    return PledgeService.create_pledge(db, pledge, user_id)


@router.get("/", response_model=List[pledge_schemas.Pledge])
def list_pledges(
    space_id: Optional[UUID] = Query(None, description="Filter by space ID"),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    # current_user: User = Depends(get_current_user)  # TODO: Add auth
):
    """List pledges, optionally filtered by space"""
    # TODO: Get current user from auth
    user_id = UUID("550e8400-e29b-41d4-a716-446655440000")  # Mock user ID

    if space_id:
        # TODO: Verify user is member of the space
        # if not SpaceService.is_space_member(db, space_id, user_id):
        #     raise HTTPException(
        #         status_code=status.HTTP_403_FORBIDDEN,
        #         detail="Not a member of this space"
        #     )
        return PledgeService.get_space_pledges(db, space_id, skip, limit)
    else:
        return PledgeService.get_user_pledges(db, user_id, skip=skip, limit=limit)


@router.get("/me", response_model=List[pledge_schemas.Pledge])
def list_my_pledges(
    space_id: Optional[UUID] = Query(None, description="Filter by space ID"),
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    # current_user: User = Depends(get_current_user)  # TODO: Add auth
):
    """List current user's pledges"""
    # TODO: Get current user from auth
    user_id = UUID("550e8400-e29b-41d4-a716-446655440000")  # Mock user ID

    return PledgeService.get_user_pledges(db, user_id, space_id, skip, limit)


@router.get("/{pledge_id}", response_model=pledge_schemas.Pledge)
def get_pledge(
    pledge_id: UUID,
    db: Session = Depends(get_db),
    # current_user: User = Depends(get_current_user)  # TODO: Add auth
):
    """Get a specific pledge"""
    # TODO: Get current user from auth
    user_id = UUID("550e8400-e29b-41d4-a716-446655440000")  # Mock user ID

    pledge = PledgeService.get_pledge(db, pledge_id)
    if not pledge:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Pledge not found"
        )

    # TODO: Verify user is member of the space
    # if not SpaceService.is_space_member(db, pledge.space_id, user_id):
    #     raise HTTPException(
    #         status_code=status.HTTP_403_FORBIDDEN,
    #         detail="Not a member of this space"
    #     )

    return pledge


# Additional endpoints for pledge analytics
@router.get("/spaces/{space_id}/total")
def get_space_pledge_total(
    space_id: UUID,
    currency: str = Query(..., description="Currency code (e.g., USD)"),
    db: Session = Depends(get_db),
    # current_user: User = Depends(get_current_user)  # TODO: Add auth
):
    """Get total pledged amount for a space"""
    # TODO: Get current user from auth and verify membership
    user_id = UUID("550e8400-e29b-41d4-a716-446655440000")  # Mock user ID

    # TODO: Verify user is member of the space
    # if not SpaceService.is_space_member(db, space_id, user_id):
    #     raise HTTPException(
    #         status_code=status.HTTP_403_FORBIDDEN,
    #         detail="Not a member of this space"
    #     )

    total = PledgeService.get_space_total_pledges(db, space_id, currency)
    return {
        "space_id": space_id,
        "currency": currency,
        "total_amount_minor": total,
        "total_amount": total / 100  # Convert to major units for display
    }


@router.get("/spaces/{space_id}/balance")
def get_my_space_balance(
    space_id: UUID,
    currency: str = Query(..., description="Currency code (e.g., USD)"),
    db: Session = Depends(get_db),
    # current_user: User = Depends(get_current_user)  # TODO: Add auth
):
    """Get current user's balance in a space"""
    # TODO: Get current user from auth
    user_id = UUID("550e8400-e29b-41d4-a716-446655440000")  # Mock user ID

    # TODO: Verify user is member of the space
    # if not SpaceService.is_space_member(db, space_id, user_id):
    #     raise HTTPException(
    #         status_code=status.HTTP_403_FORBIDDEN,
    #         detail="Not a member of this space"
    #     )

    balance = PledgeService.get_user_balance(db, user_id, space_id, currency)
    pledged_total = PledgeService.get_user_space_pledges_total(db, user_id, space_id, currency)

    return {
        "space_id": space_id,
        "user_id": user_id,
        "currency": currency,
        "balance_minor": balance,
        "balance": balance / 100,  # Convert to major units
        "total_pledged_minor": pledged_total,
        "total_pledged": pledged_total / 100,
        "status": "surplus" if balance > 0 else "settled" if balance == 0 else "deficit"
    }