from typing import List
from uuid import UUID
from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session

from app.core.database import get_db
from app.schemas import space as space_schemas
from app.services.space import SpaceService

router = APIRouter()


@router.post("/", response_model=space_schemas.Space, status_code=status.HTTP_201_CREATED)
def create_space(
    space: space_schemas.SpaceCreate,
    db: Session = Depends(get_db),
    # current_user: User = Depends(get_current_user)  # TODO: Add auth
):
    """Create a new space"""
    # TODO: Get current user from auth
    creator_user_id = UUID("550e8400-e29b-41d4-a716-446655440000")  # Mock user ID

    return SpaceService.create_space(db, space, creator_user_id)


@router.get("/", response_model=List[space_schemas.Space])
def list_spaces(
    skip: int = 0,
    limit: int = 100,
    db: Session = Depends(get_db),
    # current_user: User = Depends(get_current_user)  # TODO: Add auth
):
    """List spaces where current user is a member"""
    # TODO: Get current user from auth
    user_id = UUID("550e8400-e29b-41d4-a716-446655440000")  # Mock user ID

    return SpaceService.get_user_spaces(db, user_id, skip, limit)


@router.get("/{space_id}", response_model=space_schemas.Space)
def get_space(
    space_id: UUID,
    db: Session = Depends(get_db),
    # current_user: User = Depends(get_current_user)  # TODO: Add auth
):
    """Get a specific space"""
    # TODO: Get current user from auth and verify membership
    user_id = UUID("550e8400-e29b-41d4-a716-446655440000")  # Mock user ID

    space = SpaceService.get_space(db, space_id)
    if not space:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Space not found"
        )

    # TODO: Check if user is member
    # if not SpaceService.is_space_member(db, space_id, user_id):
    #     raise HTTPException(
    #         status_code=status.HTTP_403_FORBIDDEN,
    #         detail="Not a member of this space"
    #     )

    return space


@router.patch("/{space_id}", response_model=space_schemas.Space)
def update_space(
    space_id: UUID,
    space_update: space_schemas.SpaceUpdate,
    db: Session = Depends(get_db),
    # current_user: User = Depends(get_current_user)  # TODO: Add auth
):
    """Update a space (admin only)"""
    # TODO: Get current user from auth
    user_id = UUID("550e8400-e29b-41d4-a716-446655440000")  # Mock user ID

    # TODO: Check if user is admin
    # if not SpaceService.is_space_admin(db, space_id, user_id):
    #     raise HTTPException(
    #         status_code=status.HTTP_403_FORBIDDEN,
    #         detail="Only space admins can update spaces"
    #     )

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
    # current_user: User = Depends(get_current_user)  # TODO: Add auth
):
    """Get all members of a space"""
    # TODO: Get current user from auth and verify membership
    user_id = UUID("550e8400-e29b-41d4-a716-446655440000")  # Mock user ID

    # TODO: Check if user is member
    # if not SpaceService.is_space_member(db, space_id, user_id):
    #     raise HTTPException(
    #         status_code=status.HTTP_403_FORBIDDEN,
    #         detail="Not a member of this space"
    #     )

    return SpaceService.get_space_members(db, space_id)


@router.post("/{space_id}/members", response_model=space_schemas.MemberAllocation, status_code=status.HTTP_201_CREATED)
def add_space_member(
    space_id: UUID,
    member: space_schemas.MemberAllocationCreate,
    db: Session = Depends(get_db),
    # current_user: User = Depends(get_current_user)  # TODO: Add auth
):
    """Add a member to a space (admin only)"""
    # TODO: Get current user from auth
    user_id = UUID("550e8400-e29b-41d4-a716-446655440000")  # Mock user ID

    # TODO: Check if user is admin
    # if not SpaceService.is_space_admin(db, space_id, user_id):
    #     raise HTTPException(
    #         status_code=status.HTTP_403_FORBIDDEN,
    #         detail="Only space admins can add members"
    #     )

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
    # current_user: User = Depends(get_current_user)  # TODO: Add auth
):
    """Remove a member from a space (admin only or self)"""
    # TODO: Get current user from auth
    user_id = UUID("550e8400-e29b-41d4-a716-446655440000")  # Mock user ID

    # TODO: Check if user is admin or removing themselves
    # is_admin = SpaceService.is_space_admin(db, space_id, user_id)
    # is_self_removal = user_id == member_user_id
    #
    # if not (is_admin or is_self_removal):
    #     raise HTTPException(
    #         status_code=status.HTTP_403_FORBIDDEN,
    #         detail="Only space admins can remove members, or users can remove themselves"
    #     )

    success = SpaceService.remove_member(db, space_id, member_user_id)
    if not success:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Member not found in this space"
        )