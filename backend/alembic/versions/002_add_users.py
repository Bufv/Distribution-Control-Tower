"""add users table + seed data

Revision ID: 002
Revises: 001
Create Date: 2026-06-21
"""
from typing import Sequence, Union

from alembic import op
import sqlalchemy as sa
from sqlalchemy.dialects.postgresql import UUID
from passlib.context import CryptContext

revision: str = "002"
down_revision: Union[str, None] = "001"
branch_labels: Union[str, Sequence[str], None] = None
depends_on: Union[str, Sequence[str], None] = None

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def upgrade() -> None:
    op.create_table(
        "users",
        sa.Column("id", UUID(as_uuid=True), primary_key=True, server_default=sa.text("gen_random_uuid()")),
        sa.Column("username", sa.String(50), unique=True, nullable=False),
        sa.Column("hashed_password", sa.String(200), nullable=False),
        sa.Column("role", sa.String(20), nullable=False),
        sa.Column("full_name", sa.String(200)),
        sa.Column("is_active", sa.Boolean(), server_default=sa.text("TRUE")),
        sa.Column("created_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
        sa.Column("updated_at", sa.DateTime(timezone=True), server_default=sa.text("NOW()")),
    )

    users_table = sa.table(
        "users",
        sa.column("username", sa.String),
        sa.column("hashed_password", sa.String),
        sa.column("role", sa.String),
        sa.column("full_name", sa.String),
        sa.column("is_active", sa.Boolean),
    )

    op.bulk_insert(users_table, [
        {
            "username": "admin",
            "hashed_password": pwd_context.hash("admin123"),
            "role": "director",
            "full_name": "System Administrator",
            "is_active": True,
        },
        {
            "username": "manager1",
            "hashed_password": pwd_context.hash("manager123"),
            "role": "manager",
            "full_name": "Budi Santoso",
            "is_active": True,
        },
        {
            "username": "dir1",
            "hashed_password": pwd_context.hash("director123"),
            "role": "director",
            "full_name": "Siti Rahayu",
            "is_active": True,
        },
    ])


def downgrade() -> None:
    op.drop_table("users")
