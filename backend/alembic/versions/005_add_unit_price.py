"""Add unit_price to sku_catalog

Revision ID: 005
Revises: 004
Create Date: 2026-06-25
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa


revision: str = "005"
down_revision: Union[str, None] = "004"


def upgrade():
    op.add_column('sku_catalog', sa.Column('unit_price', sa.Integer(), server_default='0', nullable=False))


def downgrade():
    op.drop_column('sku_catalog', 'unit_price')
