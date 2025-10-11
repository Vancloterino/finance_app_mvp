"""add_transfer_to_ref_type_enum

Revision ID: 0c8a1f90661c
Revises: fddf93a598ed
Create Date: 2025-10-05 15:31:19.604537

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '0c8a1f90661c'
down_revision = 'fddf93a598ed'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add 'TRANSFER' to the reftypeenum enum (uppercase to match existing values)
    op.execute("ALTER TYPE reftypeenum ADD VALUE IF NOT EXISTS 'TRANSFER'")


def downgrade() -> None:
    # Note: PostgreSQL doesn't support removing enum values easily
    # This would require recreating the enum and updating all references
    pass