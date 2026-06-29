"""Data generator — menyisipkan data dummy ke PostgreSQL sesuai skenario aktif."""

import random
import logging
from datetime import date, timedelta, datetime
from typing import List, Type

from sqlalchemy import select, func, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import async_session
from app.models.distributor import Distributor
from app.models.sku import SkuCatalog
from app.models.daily_sales import DailySales
from app.models.inventory import InventorySnapshot
from app.models.promo import PromoCalendar
from app.models.recommendation import RecommendationCard
from app.models.escalation import EscalationTicket
from app.models.audit_trail import AuditTrail
from app.models.comment import Comment
from app.models.notification import Notification
from app.models.tactic import Tactic

from data_generator.scenarios import pick_scenario

logger = logging.getLogger(__name__)

SEED_DATA_DISTRIBUTORS: List[dict] = [
    {"code": "DTR-JKT-01", "name": "Distributor Jakarta Pusat", "region": "Jawa Barat", "city": "Jakarta"},
    {"code": "DTR-SBY-02", "name": "Distributor Surabaya Raya", "region": "Jawa Timur", "city": "Surabaya"},
    {"code": "DTR-MDN-03", "name": "Distributor Medan Utama", "region": "Sumatera Utara", "city": "Medan"},
    {"code": "DTR-MKS-04", "name": "Distributor Makassar Gemilang", "region": "Sulawesi Selatan", "city": "Makassar"},
    {"code": "DTR-BPK-05", "name": "Distributor Balikpapan Jaya", "region": "Kalimantan Timur", "city": "Balikpapan"},
]

SEED_DATA_SKU: List[dict] = [
    {"code": "SKU-001", "name": "Mie Instan Rasa Original", "category": "Mie Instan", "unit": "karton", "unit_price": 35000},
    {"code": "SKU-002", "name": "Mie Instan Rasa Ayam", "category": "Mie Instan", "unit": "karton", "unit_price": 35000},
    {"code": "SKU-003", "name": "Minuman Teh Botol 500ml", "category": "Minuman", "unit": "karton", "unit_price": 55000},
    {"code": "SKU-004", "name": "Minuman Kopi Sachet", "category": "Minuman", "unit": "karton", "unit_price": 45000},
    {"code": "SKU-005", "name": "Biskuit Coklat 200g", "category": "Biskuit", "unit": "karton", "unit_price": 70000},
]

DAYS_TO_GENERATE = 7
ORIGIN_DATE = date(2026, 1, 1)
BASE_SELL_IN_RANGE = (80, 120)
BASE_SELL_OUT_RANGE = (80, 120)
BASE_STOCK_RANGE = (500, 1500)


async def seed_master_data(db: AsyncSession) -> tuple[List[Distributor], List[SkuCatalog]]:
    """Isi tabel distributors & sku_catalog jika masih kosong."""

    result = await db.execute(select(Distributor).limit(1))
    if result.scalar_one_or_none() is None:
        for item in SEED_DATA_DISTRIBUTORS:
            db.add(Distributor(**item))
        await db.commit()

    result = await db.execute(select(SkuCatalog).limit(1))
    if result.scalar_one_or_none() is None:
        for item in SEED_DATA_SKU:
            db.add(SkuCatalog(**item))
        await db.commit()

    distributors = (await db.execute(select(Distributor))).scalars().all()
    skus = (await db.execute(select(SkuCatalog))).scalars().all()
    return list(distributors), list(skus)


async def generate_data(scenario_class: Type, scenario_label: str) -> int:
    """Generate data harian dengan context-aware adjustment dari tactics."""

    async with async_session() as db:
        await db.execute(delete(Notification))
        await db.execute(delete(EscalationTicket))
        await db.execute(delete(AuditTrail))
        await db.execute(delete(Comment))
        await db.execute(delete(PromoCalendar))
        await db.execute(delete(RecommendationCard).where(RecommendationCard.status == 'pending'))
        await db.commit()

        distributors, skus = await seed_master_data(db)

        result = await db.execute(select(func.max(DailySales.date)))
        max_date = result.scalar()
        start_date = (max_date + timedelta(days=1)) if max_date else ORIGIN_DATE

        # Load context-aware adjustments from executed tactics
        try:
            tactic_result = await db.execute(
                select(Tactic).where(
                    Tactic.status == 'executed',
                    Tactic.verification_status.is_(None),
                    Tactic.expected_metric.isnot(None),
                )
            )
            active_tactics = tactic_result.scalars().all()
        except Exception:
            active_tactics = []
            logger.warning("Could not load tactics for context-aware adjustment")

        record_count = 0

        for distributor in distributors:
            for sku in skus:
                last_inv = (await db.execute(
                    select(InventorySnapshot.current_stock).where(
                        InventorySnapshot.distributor_id == distributor.id,
                        InventorySnapshot.sku_id == sku.id,
                    ).order_by(InventorySnapshot.snapshot_date.desc()).limit(1)
                )).scalar()

                running_inventory = last_inv if last_inv is not None else random.randint(*BASE_STOCK_RANGE)
                base_sell_in = random.randint(*BASE_SELL_IN_RANGE)
                base_sell_out = random.randint(*BASE_SELL_OUT_RANGE)

                params = scenario_class.generate_params(0)

                for day_offset in range(DAYS_TO_GENERATE):
                    current_date = start_date + timedelta(days=day_offset)

                    # Get scenario params for this distributor
                    dist_code = distributor.code
                    if dist_code in params:
                        p = params[dist_code]
                        sell_in = int(p["sell_in"] * (1 + random.uniform(-0.05, 0.05)))
                        sell_out = int(p["sell_out"] * (1 + random.uniform(-0.05, 0.05)))
                    else:
                        sell_in = scenario_class.generate_sell_in(base_sell_in, day_offset)
                        sell_out = scenario_class.generate_sell_out(base_sell_out, day_offset, running_inventory)

                    # Apply context-aware adjustment from active tactics
                    for tactic in active_tactics:
                        if (tactic.distributor_id == distributor.id
                                and tactic.sku_id == sku.id):
                            pct = tactic.expected_change_pct or 0
                            if tactic.expected_metric == "sell_in":
                                if tactic.expected_direction == "decrease":
                                    sell_in = int(sell_in * (1 - pct * 0.7))
                                elif tactic.expected_direction == "increase":
                                    sell_in = int(sell_in * (1 + pct))
                            elif tactic.expected_metric == "sell_out":
                                if tactic.expected_direction == "decrease":
                                    sell_out = int(sell_out * (1 - pct))
                                elif tactic.expected_direction == "increase":
                                    sell_out = int(sell_out * (1 + pct))
                            elif tactic.expected_metric == "inventory":
                                if tactic.expected_direction == "decrease":
                                    sell_in = int(sell_in * (1 - pct * 0.7))
                                elif tactic.expected_direction == "increase":
                                    sell_in = int(sell_in * (1 + pct * 0.7))
                            elif tactic.expected_metric == "gap":
                                if tactic.expected_direction == "decrease":
                                    sell_in = int(sell_in * (1 - pct * 0.5))

                    running_inventory = running_inventory + sell_in - sell_out
                    running_inventory = max(running_inventory, 0)

                    db.add(DailySales(
                        distributor_id=distributor.id,
                        sku_id=sku.id,
                        date=current_date,
                        sell_in_qty=sell_in,
                        sell_out_qty=sell_out,
                    ))

                    inventory = scenario_class.generate_inventory(running_inventory, day_offset)
                    db.add(InventorySnapshot(
                        distributor_id=distributor.id,
                        sku_id=sku.id,
                        snapshot_date=current_date,
                        current_stock=inventory,
                    ))

                    record_count += 2

        db.add(PromoCalendar(
            distributor_id=distributors[0].id,
            sku_id=skus[0].id,
            promo_name="Promo MT Diskon 15%",
            start_date=start_date + timedelta(days=10),
            end_date=start_date + timedelta(days=40),
            discount_rate=15.00,
        ))

        # Generate recommendation cards from scenario
        try:
            recs = scenario_class.generate_recommendations(distributors, skus, start_date)
            for rec in recs:
                db.add(RecommendationCard(
                    title=rec["title"],
                    description=rec["description"],
                    recommendation_type=rec["recommendation_type"],
                    severity=rec["severity"],
                    distributor_id=rec["distributor_id"],
                    sku_id=rec.get("sku_id"),
                    region=rec["region"],
                    status="pending",
                    financial_impact=rec.get("financial_impact"),
                    suggest_escalate=rec.get("suggest_escalate", False),
                    expected_metric=rec.get("expected_metric"),
                    expected_direction=rec.get("expected_direction"),
                    expected_change_pct=rec.get("expected_change_pct"),
                ))
        except Exception as e:
            logger.warning(f"Could not generate recommendations: {e}")

        await db.commit()

        # Run verification cycle
        try:
            from app.services.verifier import run_verification_cycle
            verified = await run_verification_cycle(db)
            if verified:
                logger.info(f"Verification: {verified} tactics checked")
        except Exception as e:
            logger.warning(f"Verification cycle skipped: {e}")

        return record_count
