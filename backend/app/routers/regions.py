from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.daily_sales import DailySales
from app.models.distributor import Distributor

router = APIRouter(prefix="/api/regions", tags=["Regions"])


@router.get("/ranking")
async def region_ranking(db: AsyncSession = Depends(get_db)):
    """Ranking region berdasarkan total sell-out volume."""
    result = await db.execute(
        select(
            Distributor.region,
            func.sum(DailySales.sell_out_qty).label("total_sell_out"),
        )
        .join(DailySales, DailySales.distributor_id == Distributor.id)
        .group_by(Distributor.region)
        .order_by(func.sum(DailySales.sell_out_qty).desc())
    )
    rows = result.fetchall()
    return [
        {"region": row.region, "total_sell_out": int(row.total_sell_out)}
        for row in rows
    ]
