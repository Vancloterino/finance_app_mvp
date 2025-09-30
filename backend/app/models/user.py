from sqlalchemy import Column, String, DateTime, Boolean, Text
from sqlalchemy.dialects.postgresql import UUID
from sqlalchemy.sql import func
import uuid

from app.core.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    email = Column(String(255), unique=True, index=True, nullable=False)
    name = Column(String(255), nullable=False)
    auth_id = Column(String(255), unique=True, index=True, nullable=True)  # Allow null for email/password users
    password_hash = Column(String(255), nullable=True)  # For email/password authentication

    # Payment info
    stripe_customer_id = Column(String(255), unique=True, nullable=True)
    payment_method_id = Column(String(255), nullable=True)

    # Status
    is_active = Column(Boolean, default=True)
    email_verified = Column(Boolean, default=False)

    # Metadata
    phone = Column(String(50), nullable=True)
    profile_image_url = Column(Text, nullable=True)

    # Timestamps
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())