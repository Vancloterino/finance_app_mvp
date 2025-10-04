"""add_audit_log_table_proper

Revision ID: 7a30487a0c59
Revises: 8fc1041d86d9
Create Date: 2025-10-04 12:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '7a30487a0c59'
down_revision = '8fc1041d86d9'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create audit_logs table
    op.create_table(
        'audit_logs',
        sa.Column('id', postgresql.UUID(as_uuid=True), primary_key=True),
        sa.Column('action', sa.String(50), nullable=False, index=True),
        sa.Column('entity_type', sa.String(50), nullable=False, index=True),
        sa.Column('entity_id', postgresql.UUID(as_uuid=True), index=True),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), index=True),
        sa.Column('user_email', sa.String(255)),
        sa.Column('ip_address', sa.String(45)),
        sa.Column('user_agent', sa.Text()),
        sa.Column('description', sa.Text()),
        sa.Column('old_values', postgresql.JSON()),
        sa.Column('new_values', postgresql.JSON()),
        sa.Column('metadata', postgresql.JSON()),
        sa.Column('amount', sa.String(50)),
        sa.Column('currency', sa.String(3)),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=False, index=True),
    )


def downgrade() -> None:
    op.drop_table('audit_logs')
