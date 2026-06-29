from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy import select, func, exc
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.daily_sales import DailySales
from app.models.sku import SkuCatalog

router = APIRouter(prefix="/api/sales", tags=["Sales"])


@router.get("")
async def get_sales(
    period: str = Query("monthly", pattern="^(monthly|quarterly)$"),
    sku_id: str = Query(None),
    distributor_id: str = Query(None),
    db: AsyncSession = Depends(get_db),
):
    """Sell-In vs Sell-Out data, aggregated by month or quarter."""

    if period == "quarterly":
        date_trunc = func.date_trunc("quarter", DailySales.date)
    else:
        date_trunc = func.date_trunc("month", DailySales.date)

    query = (
        select(
            date_trunc.label("period"),
            func.sum(DailySales.sell_in_qty).label("sell_in"),
            func.sum(DailySales.sell_out_qty).label("sell_out"),
        )
        .select_from(DailySales)
        .group_by(date_trunc)
        .order_by(date_trunc)
    )

    if sku_id:
        query = query.where(DailySales.sku_id == sku_id)
    if distributor_id:
        query = query.where(DailySales.distributor_id == distributor_id)

    try:
        result = await db.execute(query)
        rows = result.fetchall()
    except exc.OperationalError:
        raise HTTPException(
            status_code=400,
            detail="date_trunc requires PostgreSQL (not available on this database dialect)",
        )

    return [
        {
            "period": str(row.period.date()) if hasattr(row.period, "date") else str(row.period),
            "sell_in": int(row.sell_in),
            "sell_out": int(row.sell_out),
            "gap": int(row.sell_in) - int(row.sell_out),
        }
        for row in rows
    ]


@router.get("/skus")
async def list_skus(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(SkuCatalog).order_by(SkuCatalog.name))
    skus = result.scalars().all()
    return [
        {"id": str(s.id), "code": s.code, "name": s.name, "category": s.category}
        for s in skus
    ]
