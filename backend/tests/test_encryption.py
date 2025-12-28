"""
Tests for field-level encryption service.
"""
import pytest
from app.core.encryption import EncryptionService

class TestEncryptionService:
    """Test cases for encryption service"""

    def test_encrypt_decrypt_basic(self):
        """Test basic encryption and decryption"""
        plaintext = "sensitive data 123"

        # Encrypt
        ciphertext = EncryptionService.encrypt(plaintext)
        assert ciphertext != plaintext
        assert len(ciphertext) > len(plaintext)

        # Decrypt
        decrypted = EncryptionService.decrypt(ciphertext)
        assert decrypted == plaintext

    def test_encrypt_empty_string(self):
        """Test encryption of empty string"""
        plaintext = ""
        encrypted = EncryptionService.encrypt(plaintext)
        assert encrypted == ""

    def test_encrypt_none(self):
        """Test encryption of None"""
        result = EncryptionService.encrypt_if_needed(None)
        assert result is None

    def test_decrypt_none(self):
        """Test decryption of None"""
        result = EncryptionService.decrypt_if_needed(None)
        assert result is None

    def test_encrypt_decrypt_special_characters(self):
        """Test encryption with special characters"""
        plaintext = "Account: 1234-5678-9012 !@#$%^&*()"
        ciphertext = EncryptionService.encrypt(plaintext)
        decrypted = EncryptionService.decrypt(ciphertext)
        assert decrypted == plaintext

    def test_encrypt_decrypt_unicode(self):
        """Test encryption with unicode characters"""
        plaintext = "账户信息: 测试 データ"
        ciphertext = EncryptionService.encrypt(plaintext)
        decrypted = EncryptionService.decrypt(ciphertext)
        assert decrypted == plaintext

    def test_decrypt_invalid_ciphertext(self):
        """Test decryption with invalid ciphertext"""
        with pytest.raises(ValueError):
            EncryptionService.decrypt("invalid_cipher_text")

    def test_different_plaintexts_different_ciphertexts(self):
        """Test that different inputs produce different outputs"""
        plaintext1 = "data1"
        plaintext2 = "data2"

        ciphertext1 = EncryptionService.encrypt(plaintext1)
        ciphertext2 = EncryptionService.encrypt(plaintext2)

        assert ciphertext1 != ciphertext2

    def test_payout_encryption_integration(self, client, test_user_token, test_db):
        """Test that payout payee_account is encrypted in database"""
        from app.schemas.payout import PayoutCreate
        from app.services.payout import PayoutService
        from app.models.space import Space
        from app.core.encryption import EncryptionService
        from uuid import uuid4

        # Create a test space first
        space = Space(
            id=uuid4(),
            name="Test Space",
            description="Test",
            currency="USD",
            creator_id=test_user_token["user_id"]
        )
        test_db.add(space)
        test_db.commit()

        # Create payout with sensitive data
        bank_account = "1234-5678-9012-3456"
        payout_data = PayoutCreate(
            space_id=space.id,
            amount_minor=10000,
            currency="USD",
            payee_name="John Doe",
            payee_account=bank_account,
            description="Test payout"
        )

        payout = PayoutService.create_payout(
            test_db,
            payout_data,
            test_user_token["user_id"]
        )

        # Check that data is encrypted in database
        test_db.refresh(payout)
        stored_account = test_db.query(Payout).filter_by(id=payout.id).first().payee_account

        # The stored value should be encrypted (different from plaintext)
        assert stored_account != bank_account

        # But when retrieved through service, it should be decrypted
        retrieved_payout = PayoutService.get_payout(test_db, payout.id)
        assert retrieved_payout.payee_account == bank_account
