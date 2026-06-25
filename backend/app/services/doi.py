"""DOI (Days of Inventory) calculation service.

Rumus PRD:
  DOI = Current Inventory / Seasonally Adjusted Forecasted Daily Demand

  Daily Demand = rata-rata sell_out 7 hari terakhir
  Seasonally Adjusted = daily_demand * Ws (weighting factor, default 1.0)
"""

from datetime import timedelta

from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.daily_sales import DailySales
from app.models.inventory import InventorySnapshot


async def calculate_doi(
    db: AsyncSession,
    distributor_id,
    sku_id,
    ws: float = 1.0,
) -> dict:
    """Hitung DOI untuk satu distributor x SKU."""

    # Cari current stock & snapshot_date dari inventory_snapshots terbaru
    inv_result = await db.execute(
        select(
            InventorySnapshot.current_stock,
            InventorySnapshot.snapshot_date,
        )
        .where(
            InventorySnapshot.distributor_id == distributor_id,
            InventorySnapshot.sku_id == sku_id,
        )
        .order_by(InventorySnapshot.snapshot_date.desc())
        .limit(1)
    )
    row = inv_result.one_or_none()
    if row is None or row.current_stock is None or row.current_stock == 0:
        return {"doi": None, "current_stock": 0, "daily_demand": 0, "status": "out_of_stock"}

    current_stock = row.current_stock
    snapshot_date = row.snapshot_date

    # Hitung daily demand = rata-rata sell_out 7 hari sebelum snapshot_date
    seven_days_ago = snapshot_date - timedelta(days=7)
    demand_result = await db.execute(
        select(func.coalesce(func.avg(DailySales.sell_out_qty), 0))
        .where(
            DailySales.distributor_id == distributor_id,
            DailySales.sku_id == sku_id,
            DailySales.date >= seven_days_ago,
            DailySales.date < snapshot_date,
        )
    )
    avg_daily_demand = float(demand_result.scalar_one())
    seasonally_adjusted_demand = avg_daily_demand * ws

    if seasonally_adjusted_demand <= 0:
        return {"doi": None, "current_stock": current_stock, "daily_demand": 0, "status": "no_demand"}

    doi = current_stock / seasonally_adjusted_demand

    if doi > 30:
        status = "overstock"
    elif doi < 14:
        status = "understock"
    else:
        status = "healthy"

    return {
        "doi": round(doi, 1),
        "current_stock": current_stock,
        "daily_demand": round(seasonally_adjusted_demand, 1),
        "status": status,
    }
