"""add_user_timezone_field

Revision ID: a95dc6da518b
Revises: e73d8d71f4c8
Create Date: 2025-10-12 22:00:32.132152

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'a95dc6da518b'
down_revision = 'e73d8d71f4c8'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add timezone column to users table
    op.add_column('users', sa.Column('timezone', sa.String(length=100), nullable=True))


def downgrade() -> None:
    # Remove timezone column from users table
    op.drop_column('users', 'timezone')