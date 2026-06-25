from app.database import Base
from sqlalchemy import String, Integer, BigInteger, Boolean, Float, DateTime, Text, ForeignKey
from sqlalchemy.orm import Mapped, mapped_column
from sqlalchemy.dialects.postgresql import UUID
import uuid
from datetime import datetime


class Tactic(Base):
    __tablename__ = "tactics"

    id: Mapped[uuid.UUID] = mapped_column(UUID(as_uuid=True), primary_key=True, default=uuid.uuid4)
    title: Mapped[str] = mapped_column(String(200), nullable=False)
    description: Mapped[str | None] = mapped_column(Text)
    tactic_type: Mapped[str] = mapped_column(String(50), nullable=False)
    severity: Mapped[str] = mapped_column(String(20), default="medium")
    status: Mapped[str] = mapped_column(String(20), default="draft")

    source_recommendation_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("recommendation_cards.id")
    )
    source_type: Mapped[str] = mapped_column(String(20), default="system")

    region: Mapped[str | None] = mapped_column(String(100))
    distributor_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("distributors.id")
    )
    sku_id: Mapped[uuid.UUID | None] = mapped_column(
        UUID(as_uuid=True), ForeignKey("sku_catalog.id")
    )

    financial_impact_est: Mapped[int | None] = mapped_column(BigInteger)

    created_by: Mapped[uuid.UUID] = mapped_column(
        UUID(as_uuid=True), ForeignKey("users.id"), nullable=False
    )
    submitted_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    submitted_at: Mapped[datetime | None] = mapped_column(DateTime)
    approved_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    approved_at: Mapped[datetime | None] = mapped_column(DateTime)
    rejected_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    rejected_at: Mapped[datetime | None] = mapped_column(DateTime)
    rejected_reason: Mapped[str | None] = mapped_column(Text)
    executed_by: Mapped[uuid.UUID | None] = mapped_column(UUID(as_uuid=True), ForeignKey("users.id"))
    executed_at: Mapped[datetime | None] = mapped_column(DateTime)

    proposal_notes: Mapped[str | None] = mapped_column(Text)
    reason_code: Mapped[str | None] = mapped_column(String(50))

    expected_metric: Mapped[str | None] = mapped_column(String(50))
    expected_direction: Mapped[str | None] = mapped_column(String(20))
    expected_change_pct: Mapped[float | None] = mapped_column(Float)
    verification_window_days: Mapped[int] = mapped_column(Integer, default=7)
    verification_status: Mapped[str | None] = mapped_column(String(20))
    baseline_value: Mapped[float | None] = mapped_column(Float)
    baseline_recorded_at: Mapped[datetime | None] = mapped_column(DateTime)
    outcome_value: Mapped[float | None] = mapped_column(Float)
    outcome_recorded_at: Mapped[datetime | None] = mapped_column(DateTime)
    deviation_notes: Mapped[str | None] = mapped_column(Text)

    created_at: Mapped[datetime] = mapped_column(default=datetime.utcnow)
    updated_at: Mapped[datetime] = mapped_column(default=datetime.utcnow, onupdate=datetime.utcnow)
