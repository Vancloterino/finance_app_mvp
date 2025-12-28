"""Input validation and sanitization utilities"""
import re
import bleach
from typing import Optional
import phonenumbers
from phonenumbers import NumberParseException


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


def parse_phone_number(phone: Optional[str], default_region: Optional[str] = None) -> Optional[phonenumbers.PhoneNumber]:
    """
    Parse a phone number string into a PhoneNumber object

    Args:
        phone: Phone number string to parse
        default_region: Default region code (e.g., "US", "GB", "FR") for numbers without country code

    Returns:
        PhoneNumber object if valid, None otherwise
    """
    if not phone:
        return None

    try:
        parsed = phonenumbers.parse(phone, default_region)
        return parsed
    except NumberParseException:
        return None


def validate_phone_number(phone: Optional[str], default_region: Optional[str] = None) -> bool:
    """
    Validate international phone number

    Uses Google's libphonenumber library for comprehensive validation.
    Supports E.164 format (+14155552671) and local formats with default region.

    Args:
        phone: Phone number string to validate
        default_region: Default region code (e.g., "US", "GB", "FR") for numbers without country code

    Returns:
        True if valid phone number, False otherwise

    Examples:
        >>> validate_phone_number("+14155552671")  # E.164 format
        True
        >>> validate_phone_number("4155552671", default_region="US")  # Local format with region
        True
        >>> validate_phone_number("invalid")
        False
    """
    if not phone:
        return False

    parsed = parse_phone_number(phone, default_region)
    if parsed is None:
        return False

    # Validate that the number is possible and valid for its region
    return phonenumbers.is_valid_number(parsed)


def format_phone_number(phone: Optional[str], default_region: Optional[str] = None) -> Optional[str]:
    """
    Format phone number to E.164 standard (+14155552671)

    E.164 is the international standard for phone numbers.
    All formatting characters (spaces, dashes, parentheses) are removed.

    Args:
        phone: Phone number string to format
        default_region: Default region code (e.g., "US", "GB", "FR") for numbers without country code

    Returns:
        Phone number in E.164 format (+country_code + national_number), or None if invalid

    Examples:
        >>> format_phone_number("(415) 555-2671", default_region="US")
        "+14155552671"
        >>> format_phone_number("+1 415-555-2671")
        "+14155552671"
    """
    if not phone:
        return None

    parsed = parse_phone_number(phone, default_region)
    if parsed is None:
        return None

    if not phonenumbers.is_valid_number(parsed):
        return None

    # Format to E.164 standard
    return phonenumbers.format_number(parsed, phonenumbers.PhoneNumberFormat.E164)


def validate_timezone(timezone: Optional[str]) -> bool:
    """
    Validate IANA timezone string

    Uses pytz library to validate against official IANA timezone database.

    Args:
        timezone: IANA timezone string (e.g., "America/New_York", "UTC", "Europe/London")

    Returns:
        True if valid IANA timezone or None, False otherwise

    Examples:
        >>> validate_timezone("America/New_York")
        True
        >>> validate_timezone("UTC")
        True
        >>> validate_timezone("Invalid/Timezone")
        False
        >>> validate_timezone(None)
        True
    """
    if timezone is None:
        return True  # Allow clearing timezone

    try:
        import pytz
        # Check if timezone exists in pytz database
        pytz.timezone(timezone)
        return True
    except pytz.exceptions.UnknownTimeZoneError:
        return False
    except Exception:
        return False
