"""
Photo Upload Service

Handles profile photo uploads to AWS S3 with image processing.
"""

import os
import logging
from typing import Optional, Dict, BinaryIO
from io import BytesIO
from datetime import datetime
import mimetypes

try:
    from PIL import Image
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False
    Image = None

logger = logging.getLogger(__name__)


class ImageProcessor:
    """Process and validate images before upload."""

    def __init__(self, max_size_mb: int = 5, max_dimension: int = 1024):
        """
        Initialize image processor.

        Args:
            max_size_mb: Maximum file size in megabytes
            max_dimension: Maximum width or height in pixels
        """
        self.max_size_mb = max_size_mb
        self.max_dimension = max_dimension
        self.allowed_formats = {'JPEG', 'PNG', 'GIF', 'WEBP'}

    def validate_image(self, file: BinaryIO, filename: str) -> bool:
        """
        Validate image file.

        Args:
            file: Image file object
            filename: Original filename

        Returns:
            True if valid

        Raises:
            ValueError: If image is invalid
        """
        if not PIL_AVAILABLE:
            raise ValueError("Image processing is not available. Install Pillow to enable photo uploads.")

        # Check file size
        file.seek(0, 2)  # Seek to end
        size_bytes = file.tell()
        file.seek(0)  # Reset to beginning

        max_bytes = self.max_size_mb * 1024 * 1024
        if size_bytes > max_bytes:
            raise ValueError(f"File size exceeds {self.max_size_mb}MB limit")

        # Validate image format
        try:
            img = Image.open(file)
            if img.format not in self.allowed_formats:
                raise ValueError(f"Invalid image format. Allowed: {', '.join(self.allowed_formats)}")
            file.seek(0)
            return True
        except Exception as e:
            raise ValueError(f"Invalid image format: {str(e)}")

    def resize_image(self, file: BinaryIO, format: str = 'JPEG') -> BytesIO:
        """
        Resize image if it exceeds max dimension.

        Args:
            file: Image file object
            format: Output format

        Returns:
            Resized image as BytesIO
        """
        if not PIL_AVAILABLE:
            raise ValueError("Image processing is not available. Install Pillow to enable photo uploads.")

        img = Image.open(file)

        # Check if resize needed
        width, height = img.size
        if width <= self.max_dimension and height <= self.max_dimension:
            # No resize needed, return original
            output = BytesIO()
            img.save(output, format=format, quality=85)
            output.seek(0)
            return output

        # Calculate new dimensions maintaining aspect ratio
        if width > height:
            new_width = self.max_dimension
            new_height = int(height * (self.max_dimension / width))
        else:
            new_height = self.max_dimension
            new_width = int(width * (self.max_dimension / height))

        # Resize
        img = img.resize((new_width, new_height), Image.LANCZOS)

        # Convert to RGB if PNG with transparency
        if format == 'JPEG' and img.mode in ('RGBA', 'LA', 'P'):
            background = Image.new('RGB', img.size, (255, 255, 255))
            if img.mode == 'P':
                img = img.convert('RGBA')
            background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
            img = background

        # Save to BytesIO
        output = BytesIO()
        img.save(output, format=format, quality=85)
        output.seek(0)
        return output

    def generate_thumbnail(self, file: BinaryIO, size: tuple = (150, 150)) -> BytesIO:
        """
        Generate thumbnail of image.

        Args:
            file: Image file object
            size: Thumbnail size (width, height)

        Returns:
            Thumbnail as BytesIO
        """
        if not PIL_AVAILABLE:
            raise ValueError("Image processing is not available. Install Pillow to enable photo uploads.")

        img = Image.open(file)

        # Convert to RGB if needed
        if img.mode in ('RGBA', 'LA', 'P'):
            background = Image.new('RGB', img.size, (255, 255, 255))
            if img.mode == 'P':
                img = img.convert('RGBA')
            background.paste(img, mask=img.split()[-1] if img.mode == 'RGBA' else None)
            img = background

        # Create thumbnail (maintains aspect ratio)
        img.thumbnail(size, Image.LANCZOS)

        # Save to BytesIO
        output = BytesIO()
        img.save(output, format='JPEG', quality=80)
        output.seek(0)
        return output


class PhotoUploadService:
    """
    Service for uploading profile photos to AWS S3.
    """

    def __init__(
        self,
        bucket_name: Optional[str] = None,
        aws_access_key: Optional[str] = None,
        aws_secret_key: Optional[str] = None,
        region: str = 'us-east-1'
    ):
        """
        Initialize photo upload service.

        Args:
            bucket_name: S3 bucket name
            aws_access_key: AWS access key ID
            aws_secret_key: AWS secret access key
            region: AWS region
        """
        self.bucket_name = bucket_name
        self.region = region
        self.s3_client = None
        self.image_processor = ImageProcessor()

        # Initialize S3 client if credentials provided
        if bucket_name and aws_access_key and aws_secret_key:
            try:
                import boto3
                self.s3_client = boto3.client(
                    's3',
                    aws_access_key_id=aws_access_key,
                    aws_secret_access_key=aws_secret_key,
                    region_name=region
                )
                logger.info("S3 client initialized successfully")
            except Exception as e:
                logger.error(f"Failed to initialize S3 client: {e}")
                self.s3_client = None

    def is_enabled(self) -> bool:
        """Check if S3 upload is enabled."""
        return self.s3_client is not None

    def upload_photo(
        self,
        file: BinaryIO,
        user_id: str,
        filename: str,
        generate_thumbnail: bool = False
    ) -> Dict[str, str]:
        """
        Upload photo to S3.

        Args:
            file: Image file object
            user_id: User ID
            filename: Original filename
            generate_thumbnail: Whether to generate thumbnail

        Returns:
            Dict with photo URL(s)

        Raises:
            ValueError: If image is invalid
            Exception: If upload fails
        """
        if not self.is_enabled():
            raise Exception("S3 upload is not configured")

        # Validate file extension
        if not self._is_valid_extension(filename):
            raise ValueError("Invalid file extension. Allowed: jpg, jpeg, png, gif, webp")

        # Validate and process image
        self.image_processor.validate_image(file, filename)

        # Determine format
        img = Image.open(file)
        format = img.format
        file.seek(0)

        # Resize if needed
        processed_file = self.image_processor.resize_image(file, format=format)

        # Generate unique filename
        s3_key = self._generate_filename(user_id, filename)

        # Upload to S3
        content_type = mimetypes.guess_type(filename)[0] or 'application/octet-stream'

        try:
            self.s3_client.upload_fileobj(
                processed_file,
                self.bucket_name,
                s3_key,
                ExtraArgs={
                    'ContentType': content_type,
                    'ACL': 'public-read'
                }
            )

            photo_url = self.get_photo_url(s3_key)
            result = {'url': photo_url, 'key': s3_key}

            # Generate thumbnail if requested
            if generate_thumbnail:
                file.seek(0)
                thumbnail = self.image_processor.generate_thumbnail(file)
                thumb_key = s3_key.replace(os.path.splitext(s3_key)[1], '_thumb.jpg')

                self.s3_client.upload_fileobj(
                    thumbnail,
                    self.bucket_name,
                    thumb_key,
                    ExtraArgs={
                        'ContentType': 'image/jpeg',
                        'ACL': 'public-read'
                    }
                )

                result['original_url'] = photo_url
                result['thumbnail_url'] = self.get_photo_url(thumb_key)
                result['thumbnail_key'] = thumb_key

            logger.info(f"Successfully uploaded photo for user {user_id}")
            return result

        except Exception as e:
            logger.error(f"Failed to upload photo: {e}")
            raise

    def delete_photo(self, photo_url: str) -> bool:
        """
        Delete photo from S3.

        Args:
            photo_url: Full URL of photo to delete

        Returns:
            True if successful
        """
        if not self.is_enabled():
            return False

        try:
            key = self._extract_key_from_url(photo_url)
            self.s3_client.delete_object(
                Bucket=self.bucket_name,
                Key=key
            )
            logger.info(f"Deleted photo: {key}")
            return True

        except Exception as e:
            logger.error(f"Failed to delete photo: {e}")
            return False

    def get_photo_url(self, key: str) -> str:
        """
        Get full URL for S3 object.

        Args:
            key: S3 object key

        Returns:
            Full HTTPS URL
        """
        return f"https://{self.bucket_name}.s3.{self.region}.amazonaws.com/{key}"

    def _generate_filename(self, user_id: str, original_filename: str) -> str:
        """Generate unique filename for S3."""
        timestamp = datetime.utcnow().strftime('%Y%m%d_%H%M%S_%f')
        ext = os.path.splitext(original_filename)[1].lower()
        return f"users/{user_id}/profile_{timestamp}{ext}"

    def _extract_key_from_url(self, url: str) -> str:
        """Extract S3 key from full URL."""
        # Remove bucket URL prefix
        prefix = f"https://{self.bucket_name}.s3.{self.region}.amazonaws.com/"
        if url.startswith(prefix):
            return url[len(prefix):]
        # Try alternate format
        prefix = f"https://s3.{self.region}.amazonaws.com/{self.bucket_name}/"
        if url.startswith(prefix):
            return url[len(prefix):]
        return url

    def _is_valid_extension(self, filename: str) -> bool:
        """Check if file extension is allowed."""
        allowed_extensions = {'.jpg', '.jpeg', '.png', '.gif', '.webp'}
        ext = os.path.splitext(filename)[1].lower()
        return ext in allowed_extensions
