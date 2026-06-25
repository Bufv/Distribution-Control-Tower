"""Add financial and escalation fields to recommendation_cards

Revision ID: 006
Revises: 005
Create Date: 2026-06-25
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "006"
down_revision: Union[str, None] = "005"


def upgrade():
    op.add_column('recommendation_cards', sa.Column('financial_impact', sa.BigInteger(), nullable=True))
    op.add_column('recommendation_cards', sa.Column('suggest_escalate', sa.Boolean(), server_default='f', nullable=False))
    op.add_column('recommendation_cards', sa.Column('expected_metric', sa.String(50), nullable=True))
    op.add_column('recommendation_cards', sa.Column('expected_direction', sa.String(20), nullable=True))
    op.add_column('recommendation_cards', sa.Column('expected_change_pct', sa.Float(), nullable=True))


def downgrade():
    op.drop_column('recommendation_cards', 'expected_change_pct')
    op.drop_column('recommendation_cards', 'expected_direction')
    op.drop_column('recommendation_cards', 'expected_metric')
    op.drop_column('recommendation_cards', 'suggest_escalate')
    op.drop_column('recommendation_cards', 'financial_impact')
