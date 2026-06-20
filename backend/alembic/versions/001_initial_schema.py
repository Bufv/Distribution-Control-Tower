"""initial schema — 8 tables

Revision ID: 001
Revises:
Create Date: 2026-06-19
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID

revision: str = "001"
down_revision: Union[str, None] = None
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None


def upgrade() -> None:
    op.create_table(
        "distributors",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("code", sa.String(20), unique=True, nullable=False),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("region", sa.String(100)),
        sa.Column("city", sa.String(100)),
        sa.Column("status", sa.String(20), server_default="active"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
    )

    op.create_table(
        "sku_catalog",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("code", sa.String(20), unique=True, nullable=False),
        sa.Column("name", sa.String(200), nullable=False),
        sa.Column("category", sa.String(100)),
        sa.Column("unit", sa.String(20), server_default="pcs"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
    )

    op.create_table(
        "daily_sales",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("distributor_id", UUID(as_uuid=True), sa.ForeignKey("distributors.id"), nullable=False),
        sa.Column("sku_id", UUID(as_uuid=True), sa.ForeignKey("sku_catalog.id"), nullable=False),
        sa.Column("date", sa.Date(), nullable=False),
        sa.Column("sell_in_qty", sa.Integer(), server_default="0"),
        sa.Column("sell_out_qty", sa.Integer(), server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
        sa.UniqueConstraint("distributor_id", "sku_id", "date", name="uq_daily_sales"),
    )

    op.create_table(
        "inventory_snapshots",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("distributor_id", UUID(as_uuid=True), sa.ForeignKey("distributors.id"), nullable=False),
        sa.Column("sku_id", UUID(as_uuid=True), sa.ForeignKey("sku_catalog.id"), nullable=False),
        sa.Column("snapshot_date", sa.Date(), nullable=False),
        sa.Column("current_stock", sa.Integer(), server_default="0"),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
        sa.UniqueConstraint("distributor_id", "sku_id", "snapshot_date", name="uq_inventory_snapshot"),
    )

    op.create_table(
        "promo_calendar",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("distributor_id", UUID(as_uuid=True), sa.ForeignKey("distributors.id"), nullable=False),
        sa.Column("sku_id", UUID(as_uuid=True), sa.ForeignKey("sku_catalog.id"), nullable=False),
        sa.Column("promo_name", sa.String(200)),
        sa.Column("start_date", sa.Date(), nullable=False),
        sa.Column("end_date", sa.Date(), nullable=False),
        sa.Column("discount_rate", sa.Numeric(5, 2)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
    )

    op.create_table(
        "recommendation_cards",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("title", sa.String(200)),
        sa.Column("description", sa.Text()),
        sa.Column("recommendation_type", sa.String(50)),
        sa.Column("severity", sa.String(20), server_default="medium"),
        sa.Column("status", sa.String(20), server_default="pending"),
        sa.Column("distributor_id", UUID(as_uuid=True), sa.ForeignKey("distributors.id")),
        sa.Column("sku_id", UUID(as_uuid=True), sa.ForeignKey("sku_catalog.id")),
        sa.Column("region", sa.String(100)),
        sa.Column("action_taken", sa.Text()),
        sa.Column("reason_code", sa.String(50)),
        sa.Column("notes", sa.Text()),
        sa.Column("created_by", sa.String(100)),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
    )

    op.create_table(
        "audit_trail",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("recommendation_card_id", UUID(as_uuid=True), sa.ForeignKey("recommendation_cards.id"), nullable=False),
        sa.Column("action", sa.String(20), nullable=False),
        sa.Column("reason_code", sa.String(50)),
        sa.Column("notes", sa.Text()),
        sa.Column("acted_by", sa.String(100)),
        sa.Column("acted_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
    )

    op.create_table(
        "comments",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("recommendation_card_id", UUID(as_uuid=True), sa.ForeignKey("recommendation_cards.id"), nullable=False),
        sa.Column("user_id", sa.String(100)),
        sa.Column("content", sa.Text(), nullable=False),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
    )


def downgrade() -> None:
    op.drop_table("comments")
    op.drop_table("audit_trail")
    op.drop_table("recommendation_cards")
    op.drop_table("promo_calendar")
    op.drop_table("inventory_snapshots")
    op.drop_table("daily_sales")
    op.drop_table("sku_catalog")
    op.drop_table("distributors")
