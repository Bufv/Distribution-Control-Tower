"""Create tactics table

Revision ID: 007
Revises: 006
Create Date: 2026-06-25
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID


revision: str = "007"
down_revision: Union[str, None] = "006"


def upgrade():
    op.create_table(
        'tactics',
        sa.Column('id', UUID(as_uuid=True), primary_key=True),
        sa.Column('title', sa.String(200), nullable=False),
        sa.Column('description', sa.Text(), nullable=True),
        sa.Column('tactic_type', sa.String(50), nullable=False),
        sa.Column('severity', sa.String(20), server_default='medium', nullable=False),
        sa.Column('status', sa.String(20), server_default='draft', nullable=False),
        sa.Column('source_recommendation_id', UUID(as_uuid=True), sa.ForeignKey('recommendation_cards.id'), nullable=True),
        sa.Column('source_type', sa.String(20), server_default='system', nullable=False),
        sa.Column('region', sa.String(100), nullable=True),
        sa.Column('distributor_id', UUID(as_uuid=True), sa.ForeignKey('distributors.id'), nullable=True),
        sa.Column('sku_id', UUID(as_uuid=True), sa.ForeignKey('sku_catalog.id'), nullable=True),
        sa.Column('financial_impact_est', sa.BigInteger(), nullable=True),
        sa.Column('created_by', UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=False),
        sa.Column('submitted_by', UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('submitted_at', sa.DateTime(), nullable=True),
        sa.Column('approved_by', UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('approved_at', sa.DateTime(), nullable=True),
        sa.Column('rejected_by', UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('rejected_at', sa.DateTime(), nullable=True),
        sa.Column('rejected_reason', sa.Text(), nullable=True),
        sa.Column('executed_by', UUID(as_uuid=True), sa.ForeignKey('users.id'), nullable=True),
        sa.Column('executed_at', sa.DateTime(), nullable=True),
        sa.Column('proposal_notes', sa.Text(), nullable=True),
        sa.Column('reason_code', sa.String(50), nullable=True),
        sa.Column('expected_metric', sa.String(50), nullable=True),
        sa.Column('expected_direction', sa.String(20), nullable=True),
        sa.Column('expected_change_pct', sa.Float(), nullable=True),
        sa.Column('verification_window_days', sa.Integer(), server_default='7', nullable=False),
        sa.Column('verification_status', sa.String(20), nullable=True),
        sa.Column('baseline_value', sa.Float(), nullable=True),
        sa.Column('baseline_recorded_at', sa.DateTime(), nullable=True),
        sa.Column('outcome_value', sa.Float(), nullable=True),
        sa.Column('outcome_recorded_at', sa.DateTime(), nullable=True),
        sa.Column('deviation_notes', sa.Text(), nullable=True),
        sa.Column('created_at', sa.DateTime(), server_default=sa.func.now(), nullable=False),
        sa.Column('updated_at', sa.DateTime(), server_default=sa.func.now(), nullable=False),
    )


def downgrade():
    op.drop_table('tactics')
