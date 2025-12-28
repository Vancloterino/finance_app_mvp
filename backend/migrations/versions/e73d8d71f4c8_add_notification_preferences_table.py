"""add notification preferences table

Revision ID: e73d8d71f4c8
Revises: 0c8a1f90661c
Create Date: 2025-10-12 15:50:02.134344

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'e73d8d71f4c8'
down_revision = '0c8a1f90661c'
branch_labels = None
depends_on = None


def upgrade() -> None:
    op.create_table(
        'notification_preferences',
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('email_notifications', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('payment_notifications', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('space_updates', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('payout_notifications', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('pledge_reminders', sa.Boolean(), nullable=False, server_default='true'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('user_id')
    )


def downgrade() -> None:
    op.drop_table('notification_preferences')