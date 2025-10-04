"""add_missing_foreign_key_indexes

Revision ID: 8fc1041d86d9
Revises: 7a30487a0c58
Create Date: 2025-10-04 11:57:09.944924

"""
from alembic import op
import sqlalchemy as sa


# revision identifiers, used by Alembic.
revision = '8fc1041d86d9'
down_revision = '001'  # Point to initial migration
branch_labels = None
depends_on = None


def upgrade() -> None:
    # Add indexes for member_allocations
    op.create_index('idx_member_allocations_space_id', 'member_allocations', ['space_id'])
    op.create_index('idx_member_allocations_user_id', 'member_allocations', ['user_id'])
    op.create_index('idx_member_allocations_space_user', 'member_allocations', ['space_id', 'user_id'])
    op.create_index('idx_member_allocations_active', 'member_allocations', ['is_active'])

    # Add indexes for pledges
    op.create_index('idx_pledges_space_id', 'pledges', ['space_id'])
    op.create_index('idx_pledges_user_id', 'pledges', ['user_id'])
    op.create_index('idx_pledges_space_user', 'pledges', ['space_id', 'user_id'])
    op.create_index('idx_pledges_created_at', 'pledges', ['created_at'])

    # Add indexes for payouts
    op.create_index('idx_payouts_space_id', 'payouts', ['space_id'])
    op.create_index('idx_payouts_status', 'payouts', ['status'])
    op.create_index('idx_payouts_space_status', 'payouts', ['space_id', 'status'])
    op.create_index('idx_payouts_created_at', 'payouts', ['created_at'])

    # Add indexes for consents
    op.create_index('idx_consents_payout_id', 'consents', ['payout_id'])
    op.create_index('idx_consents_user_id', 'consents', ['user_id'])
    op.create_index('idx_consents_payout_user', 'consents', ['payout_id', 'user_id'])
    op.create_index('idx_consents_decision', 'consents', ['decision'])

    # Add composite index for ledger_entries (most critical for balance queries)
    op.create_index('idx_ledger_balance_query', 'ledger_entries', ['space_id', 'user_id', 'currency'])
    op.create_index('idx_ledger_user_id', 'ledger_entries', ['user_id'])


def downgrade() -> None:
    # Drop ledger_entries indexes
    op.drop_index('idx_ledger_user_id')
    op.drop_index('idx_ledger_balance_query')

    # Drop consents indexes
    op.drop_index('idx_consents_decision')
    op.drop_index('idx_consents_payout_user')
    op.drop_index('idx_consents_user_id')
    op.drop_index('idx_consents_payout_id')

    # Drop payouts indexes
    op.drop_index('idx_payouts_created_at')
    op.drop_index('idx_payouts_space_status')
    op.drop_index('idx_payouts_status')
    op.drop_index('idx_payouts_space_id')

    # Drop pledges indexes
    op.drop_index('idx_pledges_created_at')
    op.drop_index('idx_pledges_space_user')
    op.drop_index('idx_pledges_user_id')
    op.drop_index('idx_pledges_space_id')

    # Drop member_allocations indexes
    op.drop_index('idx_member_allocations_active')
    op.drop_index('idx_member_allocations_space_user')
    op.drop_index('idx_member_allocations_user_id')
    op.drop_index('idx_member_allocations_space_id')