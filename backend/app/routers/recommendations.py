from datetime import date, timedelta, datetime
from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.recommendation import RecommendationCard
from app.models.daily_sales import DailySales
from app.models.distributor import Distributor
from app.models.promo import PromoCalendar

router = APIRouter(prefix="/api/recommendations", tags=["Recommendations"])


@router.get("")
async def list_recommendations(
    region: str = None,
    severity: str = None,
    status: str = None,
    db: AsyncSession = Depends(get_db),
):
    query = select(RecommendationCard).order_by(
        RecommendationCard.severity.desc(),
        RecommendationCard.created_at.desc(),
    )

    if region:
        query = query.where(RecommendationCard.region == region)
    if severity:
        query = query.where(RecommendationCard.severity == severity)
    if status:
        query = query.where(RecommendationCard.status == status)

    result = await db.execute(query)
    cards = result.scalars().all()

    today = date.today()
    thirty_days = today + timedelta(days=30)

    promo_result = await db.execute(
        select(PromoCalendar)
        .where(
            and_(
                PromoCalendar.start_date <= thirty_days,
                PromoCalendar.end_date >= today,
            )
        )
    )
    active_promos = promo_result.scalars().all()

    promo_regions = set()
    promo_distributors = set()
    promo_sku_map = {}

    for p in active_promos:
        dist_result = await db.execute(
            select(Distributor).where(Distributor.id == p.distributor_id)
        )
        dist = dist_result.scalar_one_or_none()
        if dist:
            promo_regions.add(dist.region)
            promo_distributors.add(str(dist.id))
            if str(dist.id) not in promo_sku_map:
                promo_sku_map[str(dist.id)] = []
            promo_sku_map[str(dist.id)].append(str(p.sku_id))

    result_data = []
    for card in cards:
        promo_nearby = (
            card.region in promo_regions
            or str(card.distributor_id) in promo_distributors
        )

        sell_in_cuttable = True
        if promo_nearby:
            sell_in_cuttable = False

        result_data.append({
            "id": str(card.id),
            "title": card.title,
            "description": card.description,
            "recommendation_type": card.recommendation_type,
            "severity": card.severity,
            "status": card.status,
            "region": card.region,
            "distributor_id": str(card.distributor_id) if card.distributor_id else None,
            "created_at": card.created_at.isoformat() if card.created_at else None,
            "promo_nearby": promo_nearby,
            "sell_in_cuttable": sell_in_cuttable,
            "promo_tag": "[DO NOT CUT ALLOCATION - PROMO PREP]" if promo_nearby else None,
        })

    return result_data
