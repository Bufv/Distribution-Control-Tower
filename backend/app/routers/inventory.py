from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession
from datetime import date
import uuid

from app.database import get_db
from app.models.distributor import Distributor
from app.models.sku import SkuCatalog
from app.services.doi import calculate_doi

router = APIRouter(prefix="/api/inventory", tags=["Inventory"])


@router.get("/detail")
async def get_inventory_detail(
    distributor_id: str,
    db: AsyncSession = Depends(get_db),
):
    """Per-SKU stock breakdown for a given distributor."""
    try:
        dist_uid = uuid.UUID(distributor_id)
    except ValueError:
        raise HTTPException(400, detail="Invalid distributor_id format")

    distributor = await db.get(Distributor, dist_uid)
    if not distributor:
        raise HTTPException(404, detail="Distributor not found")

    skus = (await db.execute(select(SkuCatalog))).scalars().all()

    results = []
    for sku in skus:
        doi_data = await calculate_doi(db, distributor_id=dist_uid, sku_id=sku.id)
        results.append({
            "sku_id": str(sku.id),
            "sku_code": sku.code,
            "sku_name": sku.name,
            "category": sku.category,
            "current_stock": doi_data["current_stock"],
            "doi": doi_data["doi"],
            "daily_demand": doi_data["daily_demand"],
            "status": doi_data["status"],
        })

    return {
        "distributor_id": distributor_id,
        "distributor_name": distributor.name,
        "region": distributor.region,
        "city": distributor.city,
        "items": results,
    }


@router.get("")
async def get_inventory_health(db: AsyncSession = Depends(get_db)):
    """Stock health per distributor, dengan DOI + indikator warna."""
    distributors = (await db.execute(select(Distributor).where(Distributor.status == "active"))).scalars().all()
    skus = (await db.execute(select(SkuCatalog))).scalars().all()

    results = []
    for dist in distributors:
        dist_health = {"overstock": 0, "healthy": 0, "understock": 0}
        total_stock = 0
        for sku in skus:
            doi_data = await calculate_doi(db, distributor_id=dist.id, sku_id=sku.id)
            if doi_data["status"] == "overstock":
                dist_health["overstock"] += 1
            elif doi_data["status"] == "understock":
                dist_health["understock"] += 1
            elif doi_data["status"] == "healthy":
                dist_health["healthy"] += 1
            total_stock += doi_data["current_stock"]

        overall = "healthy"
        if dist_health["overstock"] > dist_health["healthy"]:
            overall = "overstock"
        elif dist_health["understock"] > dist_health["healthy"]:
            overall = "understock"

        results.append({
            "distributor_id": str(dist.id),
            "distributor_name": dist.name,
            "region": dist.region,
            "city": dist.city,
            "total_stock": total_stock,
            "health": overall,
            "details": dist_health,
        })

    return results
