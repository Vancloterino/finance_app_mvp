"""add_feature_flags_table

Revision ID: 7d124f0d43a4
Revises: a95dc6da518b
Create Date: 2025-10-13 07:41:29.063861

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '7d124f0d43a4'
down_revision = 'a95dc6da518b'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create feature_flags table
    op.create_table(
        'feature_flags',
        sa.Column('id', sa.Integer(), nullable=False),
        sa.Column('name', sa.String(length=100), nullable=False),
        sa.Column('enabled', sa.Boolean(), nullable=False, server_default='false'),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('rollout_percentage', sa.Integer(), nullable=False, server_default='0'),
        sa.Column('user_overrides', sa.JSON(), nullable=False, server_default='{}'),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('name')
    )
    op.create_index(op.f('ix_feature_flags_id'), 'feature_flags', ['id'], unique=False)
    op.create_index(op.f('ix_feature_flags_name'), 'feature_flags', ['name'], unique=False)


def downgrade() -> None:
    op.drop_index(op.f('ix_feature_flags_name'), table_name='feature_flags')
    op.drop_index(op.f('ix_feature_flags_id'), table_name='feature_flags')
    op.drop_table('feature_flags')
