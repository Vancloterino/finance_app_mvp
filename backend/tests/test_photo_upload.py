"""
Tests for profile photo upload service.

This module tests the S3-based photo upload functionality for user profiles.
"""

import pytest
from unittest.mock import Mock, patch, MagicMock
from io import BytesIO

try:
    from PIL import Image
    PIL_AVAILABLE = True
except ImportError:
    PIL_AVAILABLE = False
    Image = None

from app.services.photo_upload import PhotoUploadService, ImageProcessor

# Skip all tests if PIL is not available
pytestmark = pytest.mark.skipif(not PIL_AVAILABLE, reason="PIL/Pillow not installed")


class TestImageProcessor:
    """Test image processing functionality."""

    # Test 1: Validate image format
    def test_validate_image_format_valid(self):
        """Test that valid image formats are accepted."""
        processor = ImageProcessor()

        # Create a valid JPEG image
        img = Image.new('RGB', (100, 100), color='red')
        img_bytes = BytesIO()
        img.save(img_bytes, format='JPEG')
        img_bytes.seek(0)

        result = processor.validate_image(img_bytes, 'test.jpg')
        assert result is True

    # Test 2: Reject invalid format
    def test_validate_image_format_invalid(self):
        """Test that invalid formats are rejected."""
        processor = ImageProcessor()

        # Create invalid file (text file)
        invalid_bytes = BytesIO(b"This is not an image")

        with pytest.raises(ValueError, match="Invalid image format"):
            processor.validate_image(invalid_bytes, 'test.txt')

    # Test 3: Validate file size
    def test_validate_image_size(self):
        """Test that file size validation works."""
        processor = ImageProcessor(max_size_mb=1)

        # Create image larger than 1MB
        large_img = Image.new('RGB', (5000, 5000), color='blue')
        img_bytes = BytesIO()
        large_img.save(img_bytes, format='JPEG', quality=100)
        img_bytes.seek(0)

        with pytest.raises(ValueError, match="File size exceeds"):
            processor.validate_image(img_bytes, 'large.jpg')

    # Test 4: Resize large image
    def test_resize_image(self):
        """Test that large images are resized."""
        processor = ImageProcessor(max_dimension=500)

        # Create large image
        img = Image.new('RGB', (2000, 1500), color='green')
        img_bytes = BytesIO()
        img.save(img_bytes, format='JPEG')
        img_bytes.seek(0)

        resized_bytes = processor.resize_image(img_bytes)
        resized_img = Image.open(resized_bytes)

        # Check that largest dimension is 500
        assert max(resized_img.size) == 500
        assert min(resized_img.size) == 375  # Maintains aspect ratio

    # Test 5: Don't resize small image
    def test_no_resize_small_image(self):
        """Test that small images are not resized."""
        processor = ImageProcessor(max_dimension=500)

        img = Image.new('RGB', (300, 200), color='yellow')
        img_bytes = BytesIO()
        img.save(img_bytes, format='JPEG')
        img_bytes.seek(0)
        original_size = len(img_bytes.getvalue())
        img_bytes.seek(0)

        resized_bytes = processor.resize_image(img_bytes)
        resized_img = Image.open(resized_bytes)

        # Should maintain original dimensions
        assert resized_img.size == (300, 200)

    # Test 6: Generate thumbnail
    def test_generate_thumbnail(self):
        """Test thumbnail generation."""
        processor = ImageProcessor()

        img = Image.new('RGB', (1000, 800), color='purple')
        img_bytes = BytesIO()
        img.save(img_bytes, format='JPEG')
        img_bytes.seek(0)

        thumb_bytes = processor.generate_thumbnail(img_bytes, size=(150, 150))
        thumb_img = Image.open(thumb_bytes)

        # Thumbnail should fit within 150x150
        assert thumb_img.size[0] <= 150
        assert thumb_img.size[1] <= 150


class TestPhotoUploadService:
    """Test photo upload service."""

    @pytest.fixture
    def mock_s3_client(self):
        """Create a mock S3 client."""
        return Mock()

    @pytest.fixture
    def service(self, mock_s3_client):
        """Create photo upload service with mock S3."""
        with patch('app.services.photo_upload.boto3.client', return_value=mock_s3_client):
            service = PhotoUploadService(
                bucket_name='test-bucket',
                aws_access_key='test-key',
                aws_secret_key='test-secret',
                region='us-east-1'
            )
            service.s3_client = mock_s3_client
            return service

    # Test 7: Service initialization
    def test_service_initialization(self, service):
        """Test that service initializes correctly."""
        assert service.bucket_name == 'test-bucket'
        assert service.region == 'us-east-1'

    # Test 8: Service disabled without credentials
    def test_service_disabled_without_credentials(self):
        """Test that service is disabled without S3 credentials."""
        service = PhotoUploadService(bucket_name=None)
        assert not service.is_enabled()

    # Test 9: Upload photo
    def test_upload_photo(self, service, mock_s3_client):
        """Test uploading a photo to S3."""
        # Create test image
        img = Image.new('RGB', (500, 500), color='red')
        img_bytes = BytesIO()
        img.save(img_bytes, format='JPEG')
        img_bytes.seek(0)

        user_id = 'user-123'
        filename = 'profile.jpg'

        result = service.upload_photo(img_bytes, user_id, filename)

        # Should return S3 URL
        assert result.startswith('https://test-bucket.s3')
        assert user_id in result

        # Should have called S3 upload
        mock_s3_client.upload_fileobj.assert_called_once()

    # Test 10: Upload with invalid image
    def test_upload_invalid_image(self, service):
        """Test that invalid images are rejected."""
        invalid_bytes = BytesIO(b"Not an image")

        with pytest.raises(ValueError):
            service.upload_photo(invalid_bytes, 'user-123', 'test.txt')

    # Test 11: Generate unique filename
    def test_generate_unique_filename(self, service):
        """Test that filenames are unique."""
        filename1 = service._generate_filename('user-123', 'photo.jpg')
        filename2 = service._generate_filename('user-123', 'photo.jpg')

        # Should be different (contains timestamp)
        assert filename1 != filename2
        assert filename1.startswith('users/user-123/')
        assert filename1.endswith('.jpg')

    # Test 12: Delete old photo
    def test_delete_photo(self, service, mock_s3_client):
        """Test deleting a photo from S3."""
        photo_url = 'https://test-bucket.s3.amazonaws.com/users/user-123/photo.jpg'

        service.delete_photo(photo_url)

        # Should have called S3 delete
        mock_s3_client.delete_object.assert_called_once_with(
            Bucket='test-bucket',
            Key='users/user-123/photo.jpg'
        )

    # Test 13: Handle S3 upload error
    def test_upload_error_handling(self, service, mock_s3_client):
        """Test handling S3 upload errors."""
        mock_s3_client.upload_fileobj.side_effect = Exception("S3 error")

        img = Image.new('RGB', (100, 100), color='blue')
        img_bytes = BytesIO()
        img.save(img_bytes, format='JPEG')
        img_bytes.seek(0)

        with pytest.raises(Exception):
            service.upload_photo(img_bytes, 'user-123', 'test.jpg')

    # Test 14: Upload with thumbnail generation
    def test_upload_with_thumbnail(self, service, mock_s3_client):
        """Test uploading photo with thumbnail."""
        img = Image.new('RGB', (1000, 1000), color='green')
        img_bytes = BytesIO()
        img.save(img_bytes, format='JPEG')
        img_bytes.seek(0)

        result = service.upload_photo(
            img_bytes,
            'user-123',
            'photo.jpg',
            generate_thumbnail=True
        )

        # Should upload both original and thumbnail
        assert mock_s3_client.upload_fileobj.call_count == 2
        assert 'original_url' in result
        assert 'thumbnail_url' in result

    # Test 15: Get photo URL
    def test_get_photo_url(self, service):
        """Test constructing photo URL."""
        key = 'users/user-123/photo.jpg'
        url = service.get_photo_url(key)

        assert url.startswith('https://test-bucket.s3')
        assert key in url

    # Test 16: Extract key from URL
    def test_extract_key_from_url(self, service):
        """Test extracting S3 key from URL."""
        url = 'https://test-bucket.s3.amazonaws.com/users/user-123/photo.jpg'
        key = service._extract_key_from_url(url)

        assert key == 'users/user-123/photo.jpg'

    # Test 17: Validate file extension
    def test_validate_file_extension(self, service):
        """Test file extension validation."""
        assert service._is_valid_extension('photo.jpg') is True
        assert service._is_valid_extension('photo.jpeg') is True
        assert service._is_valid_extension('photo.png') is True
        assert service._is_valid_extension('photo.gif') is True
        assert service._is_valid_extension('photo.txt') is False
        assert service._is_valid_extension('photo.exe') is False

    # Test 18: Set content type
    def test_set_content_type(self, service, mock_s3_client):
        """Test that correct content type is set."""
        img = Image.new('RGB', (100, 100), color='red')
        img_bytes = BytesIO()
        img.save(img_bytes, format='PNG')
        img_bytes.seek(0)

        service.upload_photo(img_bytes, 'user-123', 'photo.png')

        # Check upload call arguments
        call_kwargs = mock_s3_client.upload_fileobj.call_args[1]
        assert call_kwargs['ExtraArgs']['ContentType'] == 'image/png'

    # Test 19: Make photo public-read
    def test_photo_public_access(self, service, mock_s3_client):
        """Test that uploaded photos are publicly accessible."""
        img = Image.new('RGB', (100, 100), color='blue')
        img_bytes = BytesIO()
        img.save(img_bytes, format='JPEG')
        img_bytes.seek(0)

        service.upload_photo(img_bytes, 'user-123', 'photo.jpg')

        # Check ACL is set to public-read
        call_kwargs = mock_s3_client.upload_fileobj.call_args[1]
        assert call_kwargs['ExtraArgs']['ACL'] == 'public-read'

    # Test 20: Large file handling
    def test_large_file_rejected(self, service):
        """Test that very large files are rejected."""
        # Create a 6MB image (exceeds 5MB limit)
        large_img = Image.new('RGB', (8000, 8000), color='red')
        img_bytes = BytesIO()
        large_img.save(img_bytes, format='JPEG', quality=100)
        img_bytes.seek(0)

        with pytest.raises(ValueError, match="File size exceeds"):
            service.upload_photo(img_bytes, 'user-123', 'large.jpg')

    # Test 21: Automatic image resizing
    def test_automatic_resize(self, service, mock_s3_client):
        """Test that large images are automatically resized."""
        # Create 3000x3000 image
        large_img = Image.new('RGB', (3000, 3000), color='yellow')
        img_bytes = BytesIO()
        large_img.save(img_bytes, format='JPEG')
        img_bytes.seek(0)

        service.upload_photo(img_bytes, 'user-123', 'large.jpg')

        # Check that uploaded image is resized
        upload_call = mock_s3_client.upload_fileobj.call_args
        uploaded_bytes = upload_call[0][0]
        uploaded_img = Image.open(uploaded_bytes)

        # Should be resized to max dimension (1024 default)
        assert max(uploaded_img.size) <= 1024
