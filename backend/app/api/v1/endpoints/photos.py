"""
Photo Upload API Endpoints

REST API for uploading and managing profile photos.
"""

from fastapi import APIRouter, Depends, HTTPException, status, UploadFile, File
from sqlalchemy.orm import Session

from app.core.auth import get_current_user
from app.core.database import get_db
from app.models.user import User
from app.schemas.photo import PhotoUploadResponse, PhotoDeleteResponse
from app.services.photo_upload import PhotoUploadService
from app.core.config import settings


router = APIRouter()


def get_photo_service() -> PhotoUploadService:
    """Dependency to get photo upload service."""
    return PhotoUploadService(
        bucket_name=getattr(settings, 'S3_BUCKET_NAME', None),
        aws_access_key=getattr(settings, 'AWS_ACCESS_KEY_ID', None),
        aws_secret_key=getattr(settings, 'AWS_SECRET_ACCESS_KEY', None),
        region=getattr(settings, 'AWS_REGION', 'us-east-1')
    )


@router.post("/upload", response_model=PhotoUploadResponse)
async def upload_profile_photo(
    file: UploadFile = File(...),
    current_user: User = Depends(get_current_user),
    photo_service: PhotoUploadService = Depends(get_photo_service),
    db: Session = Depends(get_db)
):
    """
    Upload a profile photo.

    - **file**: Image file (JPG, PNG, GIF, WEBP, max 5MB)

    Returns the uploaded photo URL.
    """
    if not photo_service.is_enabled():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Photo upload is not configured. Please contact support."
        )

    # Validate content type
    if not file.content_type or not file.content_type.startswith('image/'):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="File must be an image"
        )

    try:
        # Read file
        contents = await file.read()
        from io import BytesIO
        file_obj = BytesIO(contents)

        # Delete old photo if exists
        if current_user.profile_photo_url:
            photo_service.delete_photo(current_user.profile_photo_url)

        # Upload new photo
        result = photo_service.upload_photo(
            file_obj,
            str(current_user.id),
            file.filename,
            generate_thumbnail=True
        )

        # Update user profile
        current_user.profile_photo_url = result.get('url') or result.get('original_url')
        db.commit()
        db.refresh(current_user)

        return PhotoUploadResponse(
            url=result.get('url') or result.get('original_url'),
            key=result['key'],
            thumbnail_url=result.get('thumbnail_url'),
            thumbnail_key=result.get('thumbnail_key'),
            message="Profile photo uploaded successfully"
        )

    except ValueError as e:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=str(e)
        )
    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to upload photo: {str(e)}"
        )


@router.delete("/delete", response_model=PhotoDeleteResponse)
def delete_profile_photo(
    current_user: User = Depends(get_current_user),
    photo_service: PhotoUploadService = Depends(get_photo_service),
    db: Session = Depends(get_db)
):
    """
    Delete the current user's profile photo.
    """
    if not current_user.profile_photo_url:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No profile photo to delete"
        )

    if not photo_service.is_enabled():
        raise HTTPException(
            status_code=status.HTTP_503_SERVICE_UNAVAILABLE,
            detail="Photo upload is not configured"
        )

    try:
        # Delete from S3
        success = photo_service.delete_photo(current_user.profile_photo_url)

        # Update user profile
        current_user.profile_photo_url = None
        db.commit()

        return PhotoDeleteResponse(
            message="Profile photo deleted successfully",
            success=success
        )

    except Exception as e:
        raise HTTPException(
            status_code=status.HTTP_500_INTERNAL_SERVER_ERROR,
            detail=f"Failed to delete photo: {str(e)}"
        )
