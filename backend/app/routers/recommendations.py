import uuid
from datetime import date, timedelta, datetime
from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select, and_
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.recommendation import RecommendationCard
from app.models.daily_sales import DailySales
from app.models.distributor import Distributor
from app.models.promo import PromoCalendar
from app.models.audit_trail import AuditTrail

router = APIRouter(prefix="/api/recommendations", tags=["Recommendations"])

REASON_CODES = [
    "Logistics / Force Majeure",
    "Commercial Strategy",
    "Market Shock",
    "Data Accuracy Doubt",
]


class ActionRequest(BaseModel):
    action: str
    reason_code: str
    notes: str


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
            "action_taken": card.action_taken,
            "reason_code": card.reason_code,
            "notes": card.notes,
        })

    return result_data


@router.post("/{card_id}/action")
async def take_action(
    card_id: str,
    body: ActionRequest,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    try:
        uid = uuid.UUID(card_id)
    except ValueError:
        raise HTTPException(400, detail="Invalid card ID format")

    card = await db.get(RecommendationCard, uid)
    if not card:
        raise HTTPException(404, detail="Recommendation card not found")

    if body.action not in ("modify", "reject"):
        raise HTTPException(400, detail="Action must be 'modify' or 'reject'")

    if body.reason_code not in REASON_CODES:
        raise HTTPException(400, detail=f"Invalid reason_code. Must be one of: {', '.join(REASON_CODES)}")

    if not body.notes or len(body.notes.strip()) < 10:
        raise HTTPException(400, detail="Notes must be at least 10 characters")

    card.status = body.action + "ed"
    card.action_taken = body.action
    card.reason_code = body.reason_code
    card.notes = body.notes.strip()
    card.updated_at = datetime.utcnow()

    audit = AuditTrail(
        recommendation_card_id=uid,
        action=body.action,
        reason_code=body.reason_code,
        notes=body.notes.strip(),
        acted_by=current_user.get("full_name") or current_user.get("username"),
    )
    db.add(audit)
    await db.commit()

    return {
        "status": "ok",
        "card_id": card_id,
        "action": body.action,
        "message": f"Card {body.action}ed with reason: {body.reason_code}",
    }
