"""add_payment_intents_table

Revision ID: fddf93a598ed
Revises: 7a30487a0c59
Create Date: 2025-10-05 10:51:18.776088

"""
from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects import postgresql

# revision identifiers, used by Alembic.
revision = 'fddf93a598ed'
down_revision = '7a30487a0c59'
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Create payment_intents table for tracking individual Stripe PaymentIntents
    op.create_table('payment_intents',
        sa.Column('id', sa.UUID(), nullable=False),
        sa.Column('payout_id', sa.UUID(), nullable=False),
        sa.Column('user_id', sa.UUID(), nullable=False),
        sa.Column('stripe_payment_intent_id', sa.String(length=255), nullable=False),
        sa.Column('amount_minor', sa.BigInteger(), nullable=False),
        sa.Column('currency', sa.String(length=3), nullable=False),
        sa.Column('status', postgresql.ENUM('CREATED', 'PROCESSING', 'REQUIRES_ACTION', 'SUCCEEDED', 'FAILED', 'CANCELED', name='paymentintentstatusenum'), nullable=False),
        sa.Column('stripe_customer_id', sa.String(length=255), nullable=True),
        sa.Column('stripe_payment_method_id', sa.String(length=255), nullable=True),
        sa.Column('client_secret', sa.Text(), nullable=True),
        sa.Column('error_code', sa.String(length=100), nullable=True),
        sa.Column('error_message', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(timezone=True), server_default=sa.text('now()'), nullable=True),
        sa.Column('updated_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('succeeded_at', sa.DateTime(timezone=True), nullable=True),
        sa.Column('failed_at', sa.DateTime(timezone=True), nullable=True),
        sa.ForeignKeyConstraint(['payout_id'], ['payouts.id'], ),
        sa.ForeignKeyConstraint(['user_id'], ['users.id'], ),
        sa.PrimaryKeyConstraint('id')
    )

    # Add indexes for payment_intents
    op.create_index(op.f('ix_payment_intents_stripe_payment_intent_id'), 'payment_intents', ['stripe_payment_intent_id'], unique=True)
    op.create_index('idx_payment_intents_payout_id', 'payment_intents', ['payout_id'])
    op.create_index('idx_payment_intents_user_id', 'payment_intents', ['user_id'])
    op.create_index('idx_payment_intents_status', 'payment_intents', ['status'])
    op.create_index('idx_payment_intents_payout_status', 'payment_intents', ['payout_id', 'status'])


def downgrade() -> None:
    # Drop indexes
    op.drop_index('idx_payment_intents_payout_status', table_name='payment_intents')
    op.drop_index('idx_payment_intents_status', table_name='payment_intents')
    op.drop_index('idx_payment_intents_user_id', table_name='payment_intents')
    op.drop_index('idx_payment_intents_payout_id', table_name='payment_intents')
    op.drop_index(op.f('ix_payment_intents_stripe_payment_intent_id'), table_name='payment_intents')

    # Drop table
    op.drop_table('payment_intents')

    # Drop enum type
    op.execute('DROP TYPE paymentintentstatusenum')