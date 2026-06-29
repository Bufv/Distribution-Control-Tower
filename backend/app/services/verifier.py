"""Verification service — checks if executed tactics produced expected outcomes."""

import logging
from datetime import datetime, timedelta, date

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.tactic import Tactic
from app.models.daily_sales import DailySales
from app.models.inventory import InventorySnapshot
from app.models.notification import Notification
from app.models.user import User

logger = logging.getLogger(__name__)


async def run_verification_cycle(db: AsyncSession) -> int:
    """Check all executed tactics whose verification window has passed."""

    result = await db.execute(
        select(Tactic).where(
            Tactic.status == 'executed',
            Tactic.verification_status.is_(None),
            Tactic.executed_at.isnot(None),
        )
    )
    tactics = result.scalars().all()

    for tactic in tactics:
        window_end = tactic.executed_at + timedelta(days=(tactic.verification_window_days or 7))
        if window_end > datetime.utcnow():
            continue

        if not tactic.expected_metric or tactic.baseline_value is None:
            tactic.verification_status = 'deviation_detected'
            tactic.deviation_notes = 'No baseline data recorded'
            tactic.outcome_recorded_at = datetime.utcnow()
            continue

        current_value = await _get_current_metric(db, tactic)
        if current_value is None:
            tactic.verification_status = 'deviation_detected'
            tactic.deviation_notes = 'Could not calculate outcome metric'
            tactic.outcome_recorded_at = datetime.utcnow()
            continue

        tactic.outcome_value = current_value
        tactic.outcome_recorded_at = datetime.utcnow()

        baseline = tactic.baseline_value
        actual_change = (current_value - baseline) / baseline if baseline > 0 else 0
        expected_change = (tactic.expected_change_pct or 0) * (-1 if tactic.expected_direction == 'decrease' else 1)
        tolerance = max(abs(expected_change) * 0.5, 0.05) if expected_change else 0.1

        if abs(actual_change - expected_change) <= tolerance:
            tactic.verification_status = 'verified'
            logger.info(f"Tactic '{tactic.title}' VERIFIED (expected {expected_change:.1%}, actual {actual_change:.1%})")
        else:
            direction_word = 'increase' if actual_change > 0 else 'decrease'
            tactic.verification_status = 'deviation_detected'
            tactic.deviation_notes = (
                f"Expected: {tactic.expected_direction} by {abs(expected_change) * 100:.0f}%. "
                f"Actual: {direction_word} by {abs(actual_change) * 100:.0f}%."
            )

            directors = (await db.execute(
                select(User).where(User.role == 'director', User.is_active == True)
            )).scalars().all()
            for d in directors:
                db.add(Notification(
                    user_id=d.id,
                    message=f"Deviation: Tactic '{tactic.title}' — {tactic.deviation_notes}",
                    related_entity_type='tactic',
                    related_entity_id=tactic.id,
                ))

    await db.commit()
    return len(tactics)


async def _get_current_metric(db: AsyncSession, tactic: Tactic):
    """Get current metric value for the expected_metric type."""
    if not tactic.distributor_id or not tactic.sku_id:
        return None

    three_days_ago = date.today() - timedelta(days=3)

    if tactic.expected_metric == 'sell_in':
        r = await db.execute(
            select(func.avg(DailySales.sell_in_qty))
            .where(
                DailySales.distributor_id == tactic.distributor_id,
                DailySales.sku_id == tactic.sku_id,
                DailySales.date >= three_days_ago,
            )
        )
        val = r.scalar_one()
        return float(val) if val else 0

    elif tactic.expected_metric == 'sell_out':
        r = await db.execute(
            select(func.avg(DailySales.sell_out_qty))
            .where(
                DailySales.distributor_id == tactic.distributor_id,
                DailySales.sku_id == tactic.sku_id,
                DailySales.date >= three_days_ago,
            )
        )
        val = r.scalar_one()
        return float(val) if val else 0

    elif tactic.expected_metric == 'inventory':
        r = await db.execute(
            select(InventorySnapshot.current_stock)
            .where(
                InventorySnapshot.distributor_id == tactic.distributor_id,
                InventorySnapshot.sku_id == tactic.sku_id,
            )
            .order_by(InventorySnapshot.snapshot_date.desc())
            .limit(1)
        )
        val = r.scalar_one_or_none()
        return float(val) if val is not None else None

    elif tactic.expected_metric == 'gap':
        r = await db.execute(
            select(func.avg(DailySales.sell_in_qty - DailySales.sell_out_qty))
            .where(
                DailySales.distributor_id == tactic.distributor_id,
                DailySales.sku_id == tactic.sku_id,
                DailySales.date >= three_days_ago,
            )
        )
        val = r.scalar_one()
        return float(val) if val else 0

    return None
