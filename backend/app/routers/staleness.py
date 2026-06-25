from datetime import date

from fastapi import APIRouter, Depends
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.distributor import Distributor
from app.models.inventory import InventorySnapshot

router = APIRouter(prefix="/api/staleness", tags=["Staleness"])


@router.get("")
async def get_staleness(db: AsyncSession = Depends(get_db)):
    distributors = (await db.execute(select(Distributor))).scalars().all()

    max_dates = (
        await db.execute(
            select(
                InventorySnapshot.distributor_id,
                func.max(InventorySnapshot.snapshot_date).label("max_date"),
            ).group_by(InventorySnapshot.distributor_id)
        )
    ).all()
    max_date_map = {row.distributor_id: row.max_date for row in max_dates}

    today = date.today()
    results = []
    for dist in distributors:
        latest = max_date_map.get(dist.id)
        is_stale = False
        stale_hours = 0
        if latest is not None:
            delta = today - latest
            stale_hours = delta.days * 24
            is_stale = delta.days >= 1

        results.append({
            "distributor_id": str(dist.id),
            "distributor_name": dist.name,
            "region": dist.region,
            "city": dist.city,
            "latest_data_date": latest.isoformat() if latest else None,
            "is_stale": is_stale,
            "stale_hours": stale_hours,
        })

    return results
