from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.distributor import Distributor

router = APIRouter(prefix="/api/distributors", tags=["Distributors"])


@router.get("")
async def list_distributors(db: AsyncSession = Depends(get_db)):
    result = await db.execute(select(Distributor).order_by(Distributor.name))
    distributors = result.scalars().all()
    return [
        {
            "id": str(d.id),
            "code": d.code,
            "name": d.name,
            "region": d.region,
            "city": d.city,
            "status": d.status,
        }
        for d in distributors
    ]
