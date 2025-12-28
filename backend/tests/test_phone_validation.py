"""Tests for international phone number validation"""
import pytest
from app.core.validators import validate_phone_number, format_phone_number


class TestPhoneValidation:
    """Test phone number validation with international support"""

    def test_valid_us_phone_with_country_code(self):
        """Should validate US phone with +1 country code"""
        result = validate_phone_number("+14155552671")
        assert result is True

    def test_valid_us_phone_without_country_code(self):
        """Should validate US phone without country code (default to US)"""
        result = validate_phone_number("4155552671", default_region="US")
        assert result is True

    def test_valid_us_phone_with_formatting(self):
        """Should validate formatted US phone number"""
        result = validate_phone_number("(415) 555-2671", default_region="US")
        assert result is True

    def test_valid_uk_phone(self):
        """Should validate UK phone number"""
        result = validate_phone_number("+442071838750")
        assert result is True

    def test_valid_french_phone(self):
        """Should validate French phone number"""
        result = validate_phone_number("+33142685300")
        assert result is True

    def test_valid_spanish_phone(self):
        """Should validate Spanish phone number"""
        result = validate_phone_number("+34912345678")
        assert result is True

    def test_valid_german_phone(self):
        """Should validate German phone number"""
        result = validate_phone_number("+493012345678")
        assert result is True

    def test_invalid_phone_too_short(self):
        """Should reject phone number that's too short"""
        result = validate_phone_number("+1234")
        assert result is False

    def test_invalid_phone_too_long(self):
        """Should reject phone number that's too long"""
        result = validate_phone_number("+1" + "5" * 20)
        assert result is False

    def test_invalid_phone_letters(self):
        """Should reject phone number with letters (except vanity numbers)"""
        # Note: phonenumbers library can handle vanity numbers like 1-800-FLOWERS
        # So we test with truly invalid input
        result = validate_phone_number("ABCDEFGHIJK")
        assert result is False

    def test_invalid_phone_no_country_code_no_region(self):
        """Should reject phone without country code and no default region"""
        result = validate_phone_number("4155552671")  # No default_region
        assert result is False

    def test_invalid_phone_empty_string(self):
        """Should reject empty string"""
        result = validate_phone_number("")
        assert result is False

    def test_invalid_phone_none(self):
        """Should reject None value"""
        result = validate_phone_number(None)
        assert result is False

    def test_invalid_phone_special_chars_only(self):
        """Should reject phone with only special characters"""
        result = validate_phone_number("(---) ---")
        assert result is False


class TestPhoneFormatting:
    """Test phone number formatting to E.164 standard"""

    def test_format_us_phone_to_e164(self):
        """Should format US phone to E.164 (+14155552671)"""
        formatted = format_phone_number("(415) 555-2671", default_region="US")
        assert formatted == "+14155552671"

    def test_format_already_e164(self):
        """Should preserve E.164 format"""
        formatted = format_phone_number("+14155552671")
        assert formatted == "+14155552671"

    def test_format_uk_phone_to_e164(self):
        """Should format UK phone to E.164"""
        formatted = format_phone_number("020 7183 8750", default_region="GB")
        assert formatted == "+442071838750"

    def test_format_french_phone_to_e164(self):
        """Should format French phone to E.164"""
        formatted = format_phone_number("01 42 68 53 00", default_region="FR")
        assert formatted == "+33142685300"

    def test_format_invalid_phone_returns_none(self):
        """Should return None for invalid phone"""
        formatted = format_phone_number("invalid")
        assert formatted is None

    def test_format_empty_string_returns_none(self):
        """Should return None for empty string"""
        formatted = format_phone_number("")
        assert formatted is None

    def test_format_none_returns_none(self):
        """Should return None for None value"""
        formatted = format_phone_number(None)
        assert formatted is None


class TestPhoneValidationWithRegions:
    """Test phone validation with different default regions"""

    def test_us_phone_with_us_region(self):
        """Should validate US phone with US region"""
        result = validate_phone_number("4155552671", default_region="US")
        assert result is True

    def test_uk_phone_with_gb_region(self):
        """Should validate UK phone with GB region"""
        result = validate_phone_number("02071838750", default_region="GB")
        assert result is True

    def test_french_phone_with_fr_region(self):
        """Should validate French phone with FR region"""
        result = validate_phone_number("0142685300", default_region="FR")
        assert result is True

    def test_wrong_region_should_fail(self):
        """Should fail when phone doesn't match region"""
        # US phone with GB region should fail
        result = validate_phone_number("4155552671", default_region="GB")
        assert result is False


class TestPhoneParsing:
    """Test phone number parsing and extraction"""

    def test_parse_and_extract_country_code(self):
        """Should parse phone and extract country code"""
        from app.core.validators import parse_phone_number

        parsed = parse_phone_number("+14155552671")
        assert parsed is not None
        assert parsed.country_code == 1
        assert parsed.national_number == 4155552671

    def test_parse_and_extract_region(self):
        """Should parse phone and extract region"""
        from app.core.validators import parse_phone_number

        parsed = parse_phone_number("+14155552671")
        assert parsed is not None
        # Should be able to get region from parsed number
        from phonenumbers import region_code_for_number
        region = region_code_for_number(parsed)
        assert region == "US"

    def test_parse_invalid_returns_none(self):
        """Should return None for invalid phone"""
        from app.core.validators import parse_phone_number

        parsed = parse_phone_number("invalid")
        assert parsed is None


class TestPhoneNormalization:
    """Test phone number normalization for storage"""

    def test_normalize_removes_formatting(self):
        """Should remove formatting characters"""
        normalized = format_phone_number("(415) 555-2671", default_region="US")
        assert "(" not in normalized
        assert ")" not in normalized
        assert " " not in normalized
        assert "-" not in normalized

    def test_normalize_adds_plus(self):
        """Should add + prefix for E.164"""
        normalized = format_phone_number("4155552671", default_region="US")
        assert normalized.startswith("+")

    def test_normalize_consistent_format(self):
        """Should produce consistent format for same number"""
        format1 = format_phone_number("(415) 555-2671", default_region="US")
        format2 = format_phone_number("415-555-2671", default_region="US")
        format3 = format_phone_number("4155552671", default_region="US")

        assert format1 == format2 == format3 == "+14155552671"
