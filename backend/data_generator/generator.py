"""Data generator — menyisipkan data dummy ke PostgreSQL sesuai skenario aktif."""

import random
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

from data_generator.scenarios import pick_scenario


SEED_DATA_DISTRIBUTORS: List[dict] = [
    {"code": "DTR-JKT-01", "name": "Distributor Jakarta Pusat", "region": "Jawa Barat", "city": "Jakarta"},
    {"code": "DTR-SBY-02", "name": "Distributor Surabaya Raya", "region": "Jawa Timur", "city": "Surabaya"},
    {"code": "DTR-MDN-03", "name": "Distributor Medan Utama", "region": "Sumatera Utara", "city": "Medan"},
    {"code": "DTR-MKS-04", "name": "Distributor Makassar Gemilang", "region": "Sulawesi Selatan", "city": "Makassar"},
    {"code": "DTR-BPK-05", "name": "Distributor Balikpapan Jaya", "region": "Kalimantan Timur", "city": "Balikpapan"},
]

SEED_DATA_SKU: List[dict] = [
    {"code": "SKU-001", "name": "Mie Instan Rasa Original", "category": "Mie Instan", "unit": "karton"},
    {"code": "SKU-002", "name": "Mie Instan Rasa Ayam", "category": "Mie Instan", "unit": "karton"},
    {"code": "SKU-003", "name": "Minuman Teh Botol 500ml", "category": "Minuman", "unit": "karton"},
    {"code": "SKU-004", "name": "Minuman Kopi Sachet", "category": "Minuman", "unit": "karton"},
    {"code": "SKU-005", "name": "Biskuit Coklat 200g", "category": "Biskuit", "unit": "karton"},
]

DAYS_TO_GENERATE = 7
ORIGIN_DATE = date(2026, 1, 1)
BASE_SELL_IN_RANGE = (80, 120)
BASE_SELL_OUT_RANGE = (70, 110)
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
    """Generate data harian — cari tanggal terakhir, lanjut dari sana agar akumulasi."""

    async with async_session() as db:
        await db.execute(delete(Notification))
        await db.execute(delete(EscalationTicket))
        await db.execute(delete(AuditTrail))
        await db.execute(delete(Comment))
        await db.execute(delete(PromoCalendar))
        await db.execute(delete(RecommendationCard))
        await db.commit()

        distributors, skus = await seed_master_data(db)

        result = await db.execute(select(func.max(DailySales.date)))
        max_date = result.scalar()
        start_date = (max_date + timedelta(days=1)) if max_date else ORIGIN_DATE

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

                for day_offset in range(DAYS_TO_GENERATE):
                    current_date = start_date + timedelta(days=day_offset)

                    sell_in = scenario_class.generate_sell_in(base_sell_in, day_offset)
                    sell_out = scenario_class.generate_sell_out(base_sell_out, day_offset, running_inventory)
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

        if scenario_label == "channel_stuffing":
            for distributor in distributors:
                inv = (await db.execute(
                    select(InventorySnapshot).where(
                        InventorySnapshot.distributor_id == distributor.id
                    ).order_by(InventorySnapshot.snapshot_date.desc()).limit(1)
                )).scalar_one_or_none()

                if inv and inv.current_stock > 500:
                    db.add(RecommendationCard(
                        title=f"Overstock Terdeteksi — {distributor.name}",
                        description=(
                            f"Stok di {distributor.name} mencapai {inv.current_stock} unit, "
                            "melebihi batas amat 30 hari. Risiko barang kedaluwarsa tinggi."
                        ),
                        recommendation_type="overstock",
                        severity="high",
                        distributor_id=distributor.id,
                        region=distributor.region,
                    ))

        if scenario_label == "stockout":
            for distributor in distributors:
                inv = (await db.execute(
                    select(InventorySnapshot).where(
                        InventorySnapshot.distributor_id == distributor.id
                    ).order_by(InventorySnapshot.snapshot_date.desc()).limit(1)
                )).scalar_one_or_none()

                if inv and inv.current_stock == 0:
                    db.add(RecommendationCard(
                        title=f"Stockout — {distributor.name}",
                        description=(
                            f"Stok {distributor.name} habis (0 unit). Potensi kehilangan penjualan. "
                            "Segera alokasikan pengiriman darurat."
                        ),
                        recommendation_type="stockout",
                        severity="high",
                        distributor_id=distributor.id,
                        region=distributor.region,
                    ))

        if scenario_label == "normal":
            for distributor in distributors:
                for sku in skus:
                    sales = (await db.execute(
                        select(DailySales).where(
                            DailySales.distributor_id == distributor.id,
                            DailySales.sku_id == sku.id,
                        ).order_by(DailySales.date.desc()).limit(1)
                    )).scalar_one_or_none()

                    if sales and (sales.sell_in_qty - sales.sell_out_qty) > 30:
                        db.add(RecommendationCard(
                            title=f"Channel Stuffing Terindikasi — {distributor.name}",
                            description=(
                                f"Selisih sell-in vs sell-out di {distributor.name} mencapai "
                                f"{sales.sell_in_qty - sales.sell_out_qty} unit. "
                                "Periksa aktivitas distributor."
                            ),
                            recommendation_type="channel_stuffing",
                            severity="medium",
                            distributor_id=distributor.id,
                            region=distributor.region,
                        ))

        await db.commit()
        return record_count
