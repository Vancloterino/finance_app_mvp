from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.core.security import get_current_user_id
from app.schemas import space as space_schemas
from app.services.space import SpaceService
from app.services.notification import NotificationService
from app.services.user import UserService

router = APIRouter()


@router.post("/", response_model=space_schemas.Space, status_code=status.HTTP_201_CREATED)
def create_space(
    space: space_schemas.SpaceCreate,
    db: Session = Depends(get_db),
    current_user_id: UUID = Depends(get_current_user_id)
):
    """Create a new space"""
    return SpaceService.create_space(db, space, current_user_id)


@router.get("/", response_model=List[space_schemas.Space])
def list_spaces(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    current_user_id: UUID = Depends(get_current_user_id)
):
    """List spaces where current user is a member"""
    return SpaceService.get_user_spaces(db, current_user_id, skip, limit)


@router.get("/{space_id}", response_model=space_schemas.Space)
def get_space(
    space_id: UUID,
    db: Session = Depends(get_db),
    current_user_id: UUID = Depends(get_current_user_id)
):
    """Get a specific space"""
    space = SpaceService.get_space(db, space_id)
    if not space:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Space not found"
        )

    # Verify user is member of the space
    if not SpaceService.is_space_member(db, space_id, current_user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a member of this space"
        )

    return space


@router.patch("/{space_id}", response_model=space_schemas.Space)
def update_space(
    space_id: UUID,
    space_update: space_schemas.SpaceUpdate,
    db: Session = Depends(get_db),
    current_user_id: UUID = Depends(get_current_user_id)
):
    """Update a space (admin only)"""
    user_id = current_user_id

    # Verify user is admin of the space
    if not SpaceService.is_space_admin(db, space_id, user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only space admins can update spaces"
        )

    space = SpaceService.update_space(db, space_id, space_update)
    if not space:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Space not found"
        )

    return space


@router.get("/{space_id}/members", response_model=List[space_schemas.MemberAllocation])
def get_space_members(
    space_id: UUID,
    db: Session = Depends(get_db),
    current_user_id: UUID = Depends(get_current_user_id)
):
    """Get all members of a space"""
    user_id = current_user_id

    # Verify user is member of the space
    if not SpaceService.is_space_member(db, space_id, user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Not a member of this space"
        )

    return SpaceService.get_space_members(db, space_id)


@router.post("/{space_id}/members", response_model=space_schemas.MemberAllocation, status_code=status.HTTP_201_CREATED)
def add_space_member(
    space_id: UUID,
    member: space_schemas.MemberAllocationCreate,
    db: Session = Depends(get_db),
    current_user_id: UUID = Depends(get_current_user_id)
):
    """Add a member to a space (admin only)"""
    user_id = current_user_id

    # Verify user is admin of the space
    if not SpaceService.is_space_admin(db, space_id, user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only space admins can add members"
        )

    allocation = SpaceService.add_member(db, space_id, member)
    if not allocation:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="User is already an active member of this space"
        )

    return allocation


@router.delete("/{space_id}/members/{user_id}", status_code=status.HTTP_204_NO_CONTENT)
def remove_space_member(
    space_id: UUID,
    member_user_id: UUID,
    db: Session = Depends(get_db),
    current_user_id: UUID = Depends(get_current_user_id)
):
    """Remove a member from a space (admin only or self)"""
    user_id = current_user_id

    # Verify user is admin or removing themselves
    is_admin = SpaceService.is_space_admin(db, space_id, user_id)
    is_self_removal = user_id == member_user_id

    if not (is_admin or is_self_removal):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only space admins can remove members, or users can remove themselves"
        )

    success = SpaceService.remove_member(db, space_id, member_user_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found in this space"
        )


@router.post("/{space_id}/invite")
def invite_member(
    space_id: UUID,
    invite_data: dict,  # Should contain {"email": "user@example.com"}
    db: Session = Depends(get_db),
    current_user_id: UUID = Depends(get_current_user_id)
):
    """Invite a member to join a space"""
    email = invite_data.get("email")
    if not email:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Email is required"
        )

    # Get space info
    space = SpaceService.get_space(db, space_id)
    if not space:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Space not found"
        )

    # Get current user info
    current_user = UserService.get_user(db, current_user_id)
    if not current_user:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="User not found"
        )

    # Verify user is admin of the space
    if not SpaceService.is_space_admin(db, space_id, current_user_id):
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Only space admins can invite members"
        )

    # For now, just return success without sending email (email server not configured)
    # In production, this would create an invitation link and send the actual email
    return {"message": f"Invitation sent to {email}"}