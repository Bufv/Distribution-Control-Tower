import uuid
from datetime import datetime, timedelta, date

from fastapi import APIRouter, Depends, HTTPException
from pydantic import BaseModel
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.tactic import Tactic
from app.models.daily_sales import DailySales
from app.models.inventory import InventorySnapshot
from app.models.notification import Notification
from app.models.user import User
from app.models.distributor import Distributor
from app.models.sku import SkuCatalog

router = APIRouter(prefix="/api/tactics", tags=["Tactics"])

REASON_CODES = [
    "Logistics / Force Majeure",
    "Commercial Strategy",
    "Market Shock",
    "Data Accuracy Doubt",
]


class CreateTacticRequest(BaseModel):
    title: str
    description: str | None = None
    tactic_type: str
    severity: str = "medium"
    region: str | None = None
    distributor_id: str | None = None
    sku_id: str | None = None
    financial_impact_est: int | None = None
    proposal_notes: str | None = None
    reason_code: str | None = None
    expected_metric: str | None = None
    expected_direction: str | None = None
    expected_change_pct: float | None = None
    verification_window_days: int = 7


class UpdateTacticRequest(BaseModel):
    title: str | None = None
    description: str | None = None
    tactic_type: str | None = None
    severity: str | None = None
    region: str | None = None
    distributor_id: str | None = None
    sku_id: str | None = None
    financial_impact_est: int | None = None
    proposal_notes: str | None = None
    reason_code: str | None = None
    expected_metric: str | None = None
    expected_direction: str | None = None
    expected_change_pct: float | None = None
    verification_window_days: int | None = None


class RejectRequest(BaseModel):
    reason: str


def _serialize(tactic: Tactic) -> dict:
    return {
        "id": str(tactic.id),
        "title": tactic.title,
        "description": tactic.description,
        "tactic_type": tactic.tactic_type,
        "severity": tactic.severity,
        "status": tactic.status,
        "source_recommendation_id": str(tactic.source_recommendation_id) if tactic.source_recommendation_id else None,
        "source_type": tactic.source_type,
        "region": tactic.region,
        "distributor_id": str(tactic.distributor_id) if tactic.distributor_id else None,
        "sku_id": str(tactic.sku_id) if tactic.sku_id else None,
        "financial_impact_est": tactic.financial_impact_est,
        "created_by": str(tactic.created_by),
        "submitted_by": str(tactic.submitted_by) if tactic.submitted_by else None,
        "submitted_at": tactic.submitted_at.isoformat() if tactic.submitted_at else None,
        "approved_by": str(tactic.approved_by) if tactic.approved_by else None,
        "approved_at": tactic.approved_at.isoformat() if tactic.approved_at else None,
        "rejected_by": str(tactic.rejected_by) if tactic.rejected_by else None,
        "rejected_at": tactic.rejected_at.isoformat() if tactic.rejected_at else None,
        "rejected_reason": tactic.rejected_reason,
        "executed_by": str(tactic.executed_by) if tactic.executed_by else None,
        "executed_at": tactic.executed_at.isoformat() if tactic.executed_at else None,
        "proposal_notes": tactic.proposal_notes,
        "reason_code": tactic.reason_code,
        "expected_metric": tactic.expected_metric,
        "expected_direction": tactic.expected_direction,
        "expected_change_pct": tactic.expected_change_pct,
        "verification_window_days": tactic.verification_window_days,
        "verification_status": tactic.verification_status,
        "baseline_value": tactic.baseline_value,
        "baseline_recorded_at": tactic.baseline_recorded_at.isoformat() if tactic.baseline_recorded_at else None,
        "outcome_value": tactic.outcome_value,
        "outcome_recorded_at": tactic.outcome_recorded_at.isoformat() if tactic.outcome_recorded_at else None,
        "deviation_notes": tactic.deviation_notes,
        "created_at": tactic.created_at.isoformat() if tactic.created_at else None,
        "updated_at": tactic.updated_at.isoformat() if tactic.updated_at else None,
    }


async def _parse_uid(uid_str: str) -> uuid.UUID:
    try:
        return uuid.UUID(uid_str)
    except ValueError:
        raise HTTPException(400, detail="Invalid UUID format")


async def _notify_directors(db: AsyncSession, message: str, related_id: uuid.UUID, exclude_user_id: uuid.UUID | None = None):
    director_result = await db.execute(
        select(User).where(User.role == "director", User.is_active == True)
    )
    directors = director_result.scalars().all()
    for d in directors:
        if exclude_user_id and d.id == exclude_user_id:
            continue
        db.add(Notification(
            user_id=d.id,
            message=message,
            related_entity_type="tactic",
            related_entity_id=related_id,
        ))
    await db.flush()


async def _notify_user(db: AsyncSession, user_id: uuid.UUID, message: str, related_id: uuid.UUID):
    db.add(Notification(
        user_id=user_id,
        message=message,
        related_entity_type="tactic",
        related_entity_id=related_id,
    ))
    await db.flush()


@router.get("")
async def list_tactics(
    status: str = None,
    region: str = None,
    tactic_type: str = None,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    query = select(Tactic).order_by(Tactic.created_at.desc())

    if status:
        query = query.where(Tactic.status == status)
    if region:
        query = query.where(Tactic.region == region)
    if tactic_type:
        query = query.where(Tactic.tactic_type == tactic_type)

    if current_user["role"] == "manager":
        query = query.where(Tactic.status.in_(["draft", "submitted", "approved", "rejected", "executed"]))
        if status != "submitted" and status != "approved":
            if status != "executed":
                query = query.where(Tactic.created_by == uuid.UUID(current_user["id"]))

    result = await db.execute(query)
    tactics = result.scalars().all()
    return [_serialize(t) for t in tactics]


@router.get("/{tactic_id}")
async def get_tactic(
    tactic_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    uid = await _parse_uid(tactic_id)
    tactic = await db.get(Tactic, uid)
    if not tactic:
        raise HTTPException(404, detail="Tactic not found")
    return _serialize(tactic)


@router.post("", status_code=201)
async def create_tactic(
    body: CreateTacticRequest,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    if current_user["role"] not in ("manager", "director"):
        raise HTTPException(403, detail="Only managers and directors can create tactics")

    tactic = Tactic(
        title=body.title,
        description=body.description,
        tactic_type=body.tactic_type,
        severity=body.severity or "medium",
        region=body.region,
        distributor_id=uuid.UUID(body.distributor_id) if body.distributor_id else None,
        sku_id=uuid.UUID(body.sku_id) if body.sku_id else None,
        financial_impact_est=body.financial_impact_est,
        created_by=uuid.UUID(current_user["id"]),
        proposal_notes=body.proposal_notes,
        reason_code=body.reason_code,
        expected_metric=body.expected_metric,
        expected_direction=body.expected_direction,
        expected_change_pct=body.expected_change_pct,
        verification_window_days=body.verification_window_days or 7,
        source_type="manual",
        status="draft",
    )
    db.add(tactic)
    await db.commit()
    await db.refresh(tactic)
    return _serialize(tactic)


@router.put("/{tactic_id}")
async def update_tactic(
    tactic_id: str,
    body: UpdateTacticRequest,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    uid = await _parse_uid(tactic_id)
    tactic = await db.get(Tactic, uid)
    if not tactic:
        raise HTTPException(404, detail="Tactic not found")
    if tactic.status != "draft":
        raise HTTPException(400, detail="Can only edit draft tactics")
    if str(tactic.created_by) != str(current_user["id"]):
        raise HTTPException(403, detail="You can only edit your own tactics")

    update_data = body.model_dump(exclude_unset=True)
    for key, val in update_data.items():
        if key in ("distributor_id", "sku_id") and val:
            setattr(tactic, key, uuid.UUID(val))
        elif val is not None:
            setattr(tactic, key, val)

    tactic.updated_at = datetime.utcnow()
    await db.commit()
    await db.refresh(tactic)
    return _serialize(tactic)


@router.post("/{tactic_id}/submit")
async def submit_tactic(
    tactic_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    uid = await _parse_uid(tactic_id)
    tactic = await db.get(Tactic, uid)
    if not tactic:
        raise HTTPException(404, detail="Tactic not found")
    if tactic.status != "draft":
        raise HTTPException(400, detail=f"Cannot submit tactic with status '{tactic.status}'")
    if str(tactic.created_by) != str(current_user["id"]):
        raise HTTPException(403, detail="You can only submit your own tactics")

    tactic.status = "submitted"
    tactic.submitted_by = uuid.UUID(current_user["id"])
    tactic.submitted_at = datetime.utcnow()
    tactic.updated_at = datetime.utcnow()

    await _notify_directors(
        db,
        f"Tactic '{tactic.title}' submitted by {current_user['full_name'] or current_user['username']} for approval",
        tactic.id,
    )
    await db.commit()
    return _serialize(tactic)


@router.post("/{tactic_id}/approve")
async def approve_tactic(
    tactic_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    if current_user["role"] != "director":
        raise HTTPException(403, detail="Only directors can approve tactics")

    uid = await _parse_uid(tactic_id)
    tactic = await db.get(Tactic, uid)
    if not tactic:
        raise HTTPException(404, detail="Tactic not found")
    if tactic.status != "submitted":
        raise HTTPException(400, detail=f"Cannot approve tactic with status '{tactic.status}'")

    tactic.status = "approved"
    tactic.approved_by = uuid.UUID(current_user["id"])
    tactic.approved_at = datetime.utcnow()
    tactic.updated_at = datetime.utcnow()

    await _notify_user(
        db,
        tactic.created_by,
        f"Your tactic '{tactic.title}' was approved by {current_user['full_name'] or current_user['username']}",
        tactic.id,
    )
    await db.commit()
    return _serialize(tactic)


@router.post("/{tactic_id}/reject")
async def reject_tactic(
    tactic_id: str,
    body: RejectRequest,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    if current_user["role"] != "director":
        raise HTTPException(403, detail="Only directors can reject tactics")

    uid = await _parse_uid(tactic_id)
    tactic = await db.get(Tactic, uid)
    if not tactic:
        raise HTTPException(404, detail="Tactic not found")
    if tactic.status != "submitted":
        raise HTTPException(400, detail=f"Cannot reject tactic with status '{tactic.status}'")

    tactic.status = "rejected"
    tactic.rejected_by = uuid.UUID(current_user["id"])
    tactic.rejected_at = datetime.utcnow()
    tactic.rejected_reason = body.reason
    tactic.updated_at = datetime.utcnow()

    await _notify_user(
        db,
        tactic.created_by,
        f"Your tactic '{tactic.title}' was rejected by {current_user['full_name'] or current_user['username']}: {body.reason}",
        tactic.id,
    )
    await db.commit()
    return _serialize(tactic)


@router.post("/{tactic_id}/execute")
async def execute_tactic(
    tactic_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    if current_user["role"] not in ("manager", "director"):
        raise HTTPException(403, detail="Only managers and directors can execute tactics")

    uid = await _parse_uid(tactic_id)
    tactic = await db.get(Tactic, uid)
    if not tactic:
        raise HTTPException(404, detail="Tactic not found")
    if tactic.status != "approved":
        raise HTTPException(400, detail=f"Cannot execute tactic with status '{tactic.status}'")

    # Record baseline data
    if tactic.distributor_id and tactic.sku_id and tactic.expected_metric:
        three_days_ago = date.today() - timedelta(days=3)
        if tactic.expected_metric == "sell_in":
            r = await db.execute(
                select(func.avg(DailySales.sell_in_qty))
                .where(
                    DailySales.distributor_id == tactic.distributor_id,
                    DailySales.sku_id == tactic.sku_id,
                    DailySales.date >= three_days_ago,
                )
            )
            val = r.scalar_one()
            tactic.baseline_value = float(val) if val else 0
        elif tactic.expected_metric == "sell_out":
            r = await db.execute(
                select(func.avg(DailySales.sell_out_qty))
                .where(
                    DailySales.distributor_id == tactic.distributor_id,
                    DailySales.sku_id == tactic.sku_id,
                    DailySales.date >= three_days_ago,
                )
            )
            val = r.scalar_one()
            tactic.baseline_value = float(val) if val else 0
        elif tactic.expected_metric == "inventory":
            r = await db.execute(
                select(InventorySnapshot.current_stock)
                .where(
                    InventorySnapshot.distributor_id == tactic.distributor_id,
                    InventorySnapshot.sku_id == tactic.sku_id,
                )
                .order_by(InventorySnapshot.snapshot_date.desc())
                .limit(1)
            )
            val = r.scalar_one_or_none()
            tactic.baseline_value = float(val) if val is not None else 0
        elif tactic.expected_metric == "gap":
            r = await db.execute(
                select(func.avg(DailySales.sell_in_qty - DailySales.sell_out_qty))
                .where(
                    DailySales.distributor_id == tactic.distributor_id,
                    DailySales.sku_id == tactic.sku_id,
                    DailySales.date >= three_days_ago,
                )
            )
            val = r.scalar_one()
            tactic.baseline_value = float(val) if val else 0
        tactic.baseline_recorded_at = datetime.utcnow()

    tactic.status = "executed"
    tactic.executed_by = uuid.UUID(current_user["id"])
    tactic.executed_at = datetime.utcnow()
    tactic.updated_at = datetime.utcnow()

    await _notify_user(
        db,
        tactic.created_by,
        f"Tactic '{tactic.title}' was executed by {current_user['full_name'] or current_user['username']}",
        tactic.id,
    )
    await db.commit()
    return _serialize(tactic)


@router.post("/{tactic_id}/revise")
async def revise_tactic(
    tactic_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    uid = await _parse_uid(tactic_id)
    tactic = await db.get(Tactic, uid)
    if not tactic:
        raise HTTPException(404, detail="Tactic not found")
    if tactic.status != "rejected":
        raise HTTPException(400, detail=f"Cannot revise tactic with status '{tactic.status}'")
    if str(tactic.created_by) != str(current_user["id"]):
        raise HTTPException(403, detail="You can only revise your own tactics")

    tactic.status = "draft"
    tactic.rejected_by = None
    tactic.rejected_at = None
    tactic.rejected_reason = None
    tactic.updated_at = datetime.utcnow()
    await db.commit()
    return _serialize(tactic)


@router.delete("/{tactic_id}")
async def delete_tactic(
    tactic_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    uid = await _parse_uid(tactic_id)
    tactic = await db.get(Tactic, uid)
    if not tactic:
        raise HTTPException(404, detail="Tactic not found")
    if tactic.status != "draft":
        raise HTTPException(400, detail="Can only delete draft tactics")
    if str(tactic.created_by) != str(current_user["id"]):
        raise HTTPException(403, detail="You can only delete your own tactics")

    await db.delete(tactic)
    await db.commit()
    return {"status": "deleted"}
