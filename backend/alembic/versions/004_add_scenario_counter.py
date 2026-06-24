"""add scenario_counter table for round-robin data generator

Revision ID: 004
Revises: 003
Create Date: 2026-06-24
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "004"
down_revision: Union[str, None] = "003"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "scenario_counter",
        sa.Column("id", sa.Integer, primary_key=True),
        sa.Column("counter", sa.Integer, nullable=False, server_default=sa.text("0")),
    )
    op.execute("INSERT INTO scenario_counter (id, counter) VALUES (1, 0) ON CONFLICT DO NOTHING")


def downgrade() -> None:
    op.drop_table("scenario_counter")
