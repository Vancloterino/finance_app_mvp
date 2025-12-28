"""add_push_tokens_table

Revision ID: d5fc1bc0d4fc
Revises: 7d124f0d43a4
Create Date: 2025-10-13 22:48:47.863727

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = 'd5fc1bc0d4fc'
down_revision = '7d124f0d43a4'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create push_tokens table
    op.create_table(
        'push_tokens',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('user_id', sa.String(length=36), nullable=False),
        sa.Column('token', sa.String(length=255), nullable=False),
        sa.Column('device_type', sa.String(length=20), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=False, server_default=sa.text('true')),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ondelete='CASCADE'),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('token')
    )

    # Create indexes
    op.create_index(op.f('ix_push_tokens_id'), 'push_tokens', ['id'], unique=False)
    op.create_index(op.f('ix_push_tokens_user_id'), 'push_tokens', ['user_id'], unique=False)
    op.create_index(op.f('ix_push_tokens_token'), 'push_tokens', ['token'], unique=True)
    op.create_index(op.f('ix_push_tokens_is_active'), 'push_tokens', ['is_active'], unique=False)


def downgrade() -> None:
    # Drop indexes
    op.drop_index(op.f('ix_push_tokens_is_active'), table_name='push_tokens')
    op.drop_index(op.f('ix_push_tokens_token'), table_name='push_tokens')
    op.drop_index(op.f('ix_push_tokens_user_id'), table_name='push_tokens')
    op.drop_index(op.f('ix_push_tokens_id'), table_name='push_tokens')

    # Drop table
    op.drop_table('push_tokens')