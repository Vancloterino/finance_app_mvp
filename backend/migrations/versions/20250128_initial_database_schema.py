"""Initial database schema

Revision ID: 001
Revises:
Create Date: 2025-01-28 16:00:00.000000

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = '001'
down_revision = None
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create users table
    op.create_table('users',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('email', sa.String(length=255), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('auth_id', sa.String(length=255), nullable=False),
        sa.Column('stripe_customer_id', sa.String(length=255), nullable=True),
        sa.Column('payment_method_id', sa.String(length=255), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('email_verified', sa.Boolean(), nullable=True),
        sa.Column('phone', sa.String(length=50), nullable=True),
        sa.Column('profile_image_url', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )
    op.create_index(op.f('ix_users_auth_id'), 'users', ['auth_id'], unique=True)
    op.create_index(op.f('ix_users_email'), 'users', ['email'], unique=True)
    op.create_unique_constraint('uq_users_stripe_customer_id', 'users', ['stripe_customer_id'])

    # Create spaces table
    op.create_table('spaces',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('name', sa.String(length=255), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('currency', sa.String(length=3), nullable=False),
        sa.Column('cadence', sa.Enum('WEEKLY', 'MONTHLY', 'QUARTERLY', 'ANNUAL', 'ADHOC', name='cadenceenum'), nullable=False),
        sa.Column('due_date', sa.Integer(), nullable=True),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.PrimaryKeyConstraint('id')
    )

    # Create member_allocations table
    op.create_table('member_allocations',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('space_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('allocation_pct', sa.DECIMAL(precision=5, scale=4), nullable=False),
        sa.Column('role', sa.Enum('ADMIN', 'MEMBER', 'VIEWER', name='roleenum'), nullable=False),
        sa.Column('is_active', sa.Boolean(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['space_id'], ['spaces.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Create pledges table
    op.create_table('pledges',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('space_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('amount_minor', sa.BigInteger(), nullable=False),
        sa.Column('currency', sa.String(length=3), nullable=False),
        sa.Column('memo', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.ForeignKeyConstraint(['space_id'], ['spaces.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Create payouts table
    op.create_table('payouts',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('space_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('amount_minor', sa.BigInteger(), nullable=False),
        sa.Column('currency', sa.String(length=3), nullable=False),
        sa.Column('payee_name', sa.String(length=255), nullable=False),
        sa.Column('payee_account', sa.Text(), nullable=True),
        sa.Column('status', sa.Enum('PROPOSED', 'CONSENT_PENDING', 'READY', 'EXECUTING', 'SETTLED', 'FAILED', 'CANCELLED', name='payoutstatusenum'), nullable=False),
        sa.Column('scheduled_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('consent_deadline', sa.DateTime(timezone=True), nullable=True),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('memo', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('executed_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['space_id'], ['spaces.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Create consents table
    op.create_table('consents',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('payout_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('decision', sa.Enum('APPROVE', 'DENY', 'PENDING', 'AUTO_APPROVE', name='consentdecisionenum'), nullable=False),
        sa.Column('reason', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('decided_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['payout_id'], ['payouts.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Create ledger_entries table
    op.create_table('ledger_entries',
        sa.Column('id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('space_id', postgresql.UUID(as_uuid=True), nullable=False),
        sa.Column('user_id', postgresql.UUID(as_uuid=True), nullable=True),
        sa.Column('type', sa.Enum('PLEDGE', 'DEBIT', 'CREDIT', 'ADJUST', 'FEE', name='entrytypeenum'), nullable=False),
        sa.Column('currency', sa.String(length=3), nullable=False),
        sa.Column('amount_minor', sa.BigInteger(), nullable=False),
        sa.Column('ref_type', sa.Enum('PLEDGE', 'PAYOUT', 'PAYMENT', 'REFUND', 'ADJUSTMENT', name='reftypeenum'), nullable=False),
        sa.Column('ref_id', sa.String(length=255), nullable=False),
        sa.Column('event_time', sa.DateTime(timezone=True), nullable=False),
        sa.Column('recorded_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('idempotency_key', sa.String(length=255), nullable=True),
        sa.Column('memo', sa.Text(), nullable=True),
        sa.ForeignKeyConstraint(['space_id'], ['spaces.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id'),
        sa.UniqueConstraint('idempotency_key')
    )

    # Create indexes for ledger_entries as per spec
    op.create_index('ix_ledger_space_event_time_id', 'ledger_entries', ['space_id', 'event_time', 'id'])
    op.create_index('ix_ledger_space_user_event_time', 'ledger_entries', ['space_id', 'user_id', 'event_time'])
    op.create_index('ix_ledger_ref_type_id', 'ledger_entries', ['ref_type', 'ref_id'])


def downgrade() -> None:
    op.drop_index('ix_ledger_ref_type_id', table_name='ledger_entries')
    op.drop_index('ix_ledger_space_user_event_time', table_name='ledger_entries')
    op.drop_index('ix_ledger_space_event_time_id', table_name='ledger_entries')
    op.drop_table('ledger_entries')
    op.drop_table('consents')
    op.drop_table('payouts')
    op.drop_table('pledges')
    op.drop_table('member_allocations')
    op.drop_table('spaces')
    op.drop_constraint('uq_users_stripe_customer_id', 'users', type_='unique')
    op.drop_index(op.f('ix_users_email'), table_name='users')
    op.drop_index(op.f('ix_users_auth_id'), table_name='users')
    op.drop_table('users')

    # Drop enums
    sa.Enum(name='cadenceenum').drop(op.get_bind())
    sa.Enum(name='roleenum').drop(op.get_bind())
    sa.Enum(name='payoutstatusenum').drop(op.get_bind())
    sa.Enum(name='consentdecisionenum').drop(op.get_bind())
    sa.Enum(name='entrytypeenum').drop(op.get_bind())
    sa.Enum(name='reftypeenum').drop(op.get_bind())