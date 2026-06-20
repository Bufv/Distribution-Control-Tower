import uuid
from datetime import date
from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy import select, delete
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.promo import PromoCalendar
from app.models.distributor import Distributor
from app.models.sku import SkuCatalog

router = APIRouter(prefix="/api/promos", tags=["Promos"])


@router.get("")
async def list_promos(db: AsyncSession = Depends(get_db)):
    result = await db.execute(
        select(PromoCalendar).order_by(PromoCalendar.start_date)
    )
    promos = result.scalars().all()

    result_data = []
    for p in promos:
        dist = await db.get(Distributor, p.distributor_id) if p.distributor_id else None
        sku = await db.get(SkuCatalog, p.sku_id) if p.sku_id else None
        result_data.append({
            "id": str(p.id),
            "distributor_id": str(p.distributor_id),
            "distributor_name": dist.name if dist else None,
            "sku_id": str(p.sku_id),
            "sku_name": sku.name if sku else None,
            "promo_name": p.promo_name,
            "start_date": str(p.start_date),
            "end_date": str(p.end_date),
            "discount_rate": float(p.discount_rate) if p.discount_rate else None,
        })

    return result_data


@router.post("")
async def create_promo(
    distributor_id: str = Query(...),
    sku_id: str = Query(...),
    promo_name: str = Query(...),
    start_date: str = Query(...),
    end_date: str = Query(...),
    discount_rate: float = Query(None),
    db: AsyncSession = Depends(get_db),
):
    try:
        start = date.fromisoformat(start_date)
        end = date.fromisoformat(end_date)
    except ValueError:
        raise HTTPException(400, detail="Invalid date format. Use YYYY-MM-DD.")

    if end < start:
        raise HTTPException(400, detail="end_date must be after start_date")

    promo = PromoCalendar(
        distributor_id=uuid.UUID(distributor_id) if distributor_id else None,
        sku_id=uuid.UUID(sku_id) if sku_id else None,
        promo_name=promo_name,
        start_date=start,
        end_date=end,
        discount_rate=discount_rate,
    )
    db.add(promo)
    await db.commit()
    await db.refresh(promo)

    return {
        "id": str(promo.id),
        "promo_name": promo.promo_name,
        "start_date": str(promo.start_date),
        "end_date": str(promo.end_date),
        "message": "Promo created",
    }


@router.delete("/{promo_id}")
async def delete_promo(promo_id: str, db: AsyncSession = Depends(get_db)):
    try:
        uid = uuid.UUID(promo_id)
    except ValueError:
        raise HTTPException(400, detail="Invalid promo ID format")

    promo = await db.get(PromoCalendar, uid)
    if not promo:
        raise HTTPException(404, detail="Promo not found")

    await db.delete(promo)
    await db.commit()
    return {"message": "Promo deleted"}
