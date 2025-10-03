"""Input validation and sanitization utilities"""
import re
import bleach
from typing import Optional


def sanitize_string(value: str, max_length: Optional[int] = None) -> str:
    """
    Sanitize string input by removing HTML tags and trimming whitespace

    Args:
        value: Input string to sanitize
        max_length: Maximum allowed length

    Returns:
        Sanitized string
    """
    if not value:
        return value

    # Remove HTML tags
    cleaned = bleach.clean(value, tags=[], strip=True)

    # Trim whitespace
    cleaned = cleaned.strip()

    # Truncate if needed
    if max_length and len(cleaned) > max_length:
        cleaned = cleaned[:max_length]

    return cleaned


def validate_currency_code(code: str) -> bool:
    """
    Validate ISO 4217 currency code format

    Args:
        code: Currency code to validate

    Returns:
        True if valid, False otherwise
    """
    # Must be exactly 3 uppercase letters
    return bool(re.match(r'^[A-Z]{3}$', code))


def validate_amount(amount: float) -> bool:
    """
    Validate monetary amount

    Args:
        amount: Amount to validate

    Returns:
        True if valid, False otherwise
    """
    # Must be positive and have at most 2 decimal places
    if amount <= 0:
        return False

    # Check decimal places
    amount_str = str(amount)
    if '.' in amount_str:
        decimal_places = len(amount_str.split('.')[1])
        if decimal_places > 2:
            return False

    return True


def sanitize_email(email: str) -> str:
    """
    Sanitize email address

    Args:
        email: Email address to sanitize

    Returns:
        Sanitized email (lowercased and trimmed)
    """
    return email.strip().lower()


def validate_description(description: str, min_length: int = 1, max_length: int = 1000) -> bool:
    """
    Validate description field

    Args:
        description: Description to validate
        min_length: Minimum allowed length
        max_length: Maximum allowed length

    Returns:
        True if valid, False otherwise
    """
    if not description:
        return False

    cleaned = sanitize_string(description)
    length = len(cleaned)

    return min_length <= length <= max_length


def validate_name(name: str, min_length: int = 1, max_length: int = 255) -> bool:
    """
    Validate name field

    Args:
        name: Name to validate
        min_length: Minimum allowed length
        max_length: Maximum allowed length

    Returns:
        True if valid, False otherwise
    """
    if not name:
        return False

    cleaned = sanitize_string(name)
    length = len(cleaned)

    return min_length <= length <= max_length


def sanitize_html_content(content: str, allowed_tags: Optional[list] = None) -> str:
    """
    Sanitize HTML content allowing only specified tags

    Args:
        content: HTML content to sanitize
        allowed_tags: List of allowed HTML tags (default: none)

    Returns:
        Sanitized HTML content
    """
    if allowed_tags is None:
        allowed_tags = []

    return bleach.clean(
        content,
        tags=allowed_tags,
        strip=True,
        strip_comments=True
    )
