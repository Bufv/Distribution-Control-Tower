from app.database import Base
from sqlalchemy import String, Integer, DateTime, Date, ForeignKey, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime


class DailySales(Base):
    __tablename__ = "daily_sales"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    distributor_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("distributors.id"), nullable=False)
    sku_id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), ForeignKey("sku_catalog.id"), nullable=False)
    date: Mapped[datetime] = mapped_column(Date, nullable=False)
    sell_in_qty: Mapped[int] = mapped_column(Integer, default=0)
    sell_out_qty: Mapped[int] = mapped_column(Integer, default=0)
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)

    __table_args__ = (
        UniqueConstraint("distributor_id", "sku_id", "date", name="uq_daily_sales"),
    )
