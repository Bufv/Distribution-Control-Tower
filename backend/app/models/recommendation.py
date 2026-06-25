from app.database import Base
from sqlalchemy import String, Integer, BigInteger, Boolean, Float, DateTime, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime


class RecommendationCard(Base):
    __tablename__ = "recommendation_cards"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title: Mapped[str | None] = mapped_column(String(200))
    description: Mapped[str | None] = mapped_column(Text)
    recommendation_type: Mapped[str | None] = mapped_column(String(50))
    severity: Mapped[str] = mapped_column(String(20), default="medium")
    status: Mapped[str] = mapped_column(String(20), default="pending")
    distributor_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("distributors.id"))
    sku_id: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("sku_catalog.id"))
    region: Mapped[str | None] = mapped_column(String(100))
    financial_impact: Mapped[int | None] = mapped_column(BigInteger)
    suggest_escalate: Mapped[bool] = mapped_column(Boolean, default=False)
    expected_metric: Mapped[str | None] = mapped_column(String(50))
    expected_direction: Mapped[str | None] = mapped_column(String(20))
    expected_change_pct: Mapped[float | None] = mapped_column(Float)
    action_taken: Mapped[str | None] = mapped_column(Text)
    reason_code: Mapped[str | None] = mapped_column(String(50))
    notes: Mapped[str | None] = mapped_column(Text)
    created_by: Mapped[str | None] = mapped_column(String(100))
    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(default=datetime.utcnow, onupdate=datetime.utcnow)
