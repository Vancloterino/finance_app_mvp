"""
Field-level encryption for sensitive data.
Uses Fernet (symmetric encryption) from cryptography library.
"""

from cryptography.fernet import Fernet
from typing import Optional
from app.core.config import settings


class EncryptionService:
    """Service for encrypting and decrypting sensitive data"""

    _cipher: Optional[Fernet] = None

    @classmethod
    def _get_cipher(cls) -> Fernet:
        """Get or create Fernet cipher"""
        if cls._cipher is None:
            # Use SECRET_KEY as base for encryption key
            # In production, use a separate ENCRYPTION_KEY
            key = settings.SECRET_KEY.encode()[:32]  # Fernet needs 32 bytes
            # Pad or truncate to exactly 32 bytes
            key = key.ljust(32, b'0')[:32]
            # Fernet requires base64-encoded 32-byte key
            import base64
            base64_key = base64.urlsafe_b64encode(key)
            cls._cipher = Fernet(base64_key)
        return cls._cipher

    @classmethod
    def encrypt(cls, plaintext: str) -> str:
        """
        Encrypt plaintext string.

        Args:
            plaintext: String to encrypt

        Returns:
            Encrypted string (base64 encoded)
        """
        if not plaintext:
            return plaintext

        cipher = cls._get_cipher()
        encrypted_bytes = cipher.encrypt(plaintext.encode())
        return encrypted_bytes.decode()

    @classmethod
    def decrypt(cls, ciphertext: str) -> str:
        """
        Decrypt ciphertext string.

        Args:
            ciphertext: Encrypted string (base64 encoded)

        Returns:
            Decrypted plaintext string
        """
        if not ciphertext:
            return ciphertext

        cipher = cls._get_cipher()
        try:
            decrypted_bytes = cipher.decrypt(ciphertext.encode())
            return decrypted_bytes.decode()
        except Exception as e:
            # If decryption fails, data might be corrupted or using wrong key
            raise ValueError(f"Failed to decrypt data: {str(e)}")

    @classmethod
    def encrypt_if_needed(cls, value: Optional[str]) -> Optional[str]:
        """Encrypt value only if it's not None and not empty"""
        if value:
            return cls.encrypt(value)
        return value

    @classmethod
    def decrypt_if_needed(cls, value: Optional[str]) -> Optional[str]:
        """Decrypt value only if it's not None and not empty"""
        if value:
            try:
                return cls.decrypt(value)
            except ValueError:
                # If decryption fails, return as-is (might be unencrypted legacy data)
                return value
        return value
