from app.database import Base
from sqlalchemy import String, Integer, DateTime, Date, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime


class InventorySnapshot(Base):
    __tablename__ = "inventory_snapshots"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    distributor_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("distributors.id"), nullable=False)
    sku_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("sku_catalog.id"), nullable=False)
    snapshot_date: Mapped[datetime] = mapped_column(Date, nullable=False)
    current_stock: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("distributor_id", "sku_id", "snapshot_date", name="uq_inventory_snapshot"),
    )
