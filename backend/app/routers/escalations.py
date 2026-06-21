import uuid
from datetime import datetime

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.escalation import EscalationTicket
from app.models.notification import Notification
from app.models.recommendation import RecommendationCard

router = APIRouter(prefix="/api", tags=["Escalations"])


@router.post("/recommendations/{card_id}/escalate")
async def escalate_recommendation(
    card_id: str,
    reason: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    if current_user["role"] != "manager":
        raise HTTPException(status_code=403, detail="Only managers can escalate")

    try:
        uid = uuid.UUID(card_id)
    except ValueError:
        raise HTTPException(400, detail="Invalid card ID format")

    card = await db.get(RecommendationCard, uid)
    if not card:
        raise HTTPException(404, detail="Recommendation card not found")

    if not reason or len(reason.strip()) < 10:
        raise HTTPException(400, detail="Reason must be at least 10 characters")

    ticket = EscalationTicket(
        recommendation_card_id=uid,
        escalated_by=uuid.UUID(current_user["id"]),
        reason=reason.strip(),
        status="pending",
    )
    db.add(ticket)
    await db.flush()

    from sqlalchemy import select as sel
    from app.models.user import User

    director_result = await db.execute(
        sel(User).where(User.role == "director", User.is_active == True)
    )
    directors = director_result.scalars().all()

    for director in directors:
        notif = Notification(
            user_id=director.id,
            message=f"Escalation from {current_user['full_name'] or current_user['username']}: {reason[:100]}",
            related_entity_type="escalation",
            related_entity_id=ticket.id,
        )
        db.add(notif)

    await db.commit()
    await db.refresh(ticket)

    return {
        "id": str(ticket.id),
        "status": ticket.status,
        "message": "Escalation ticket created",
    }


@router.get("/escalations")
async def list_escalations(
    status: str = None,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    query = select(EscalationTicket).order_by(EscalationTicket.created_at.desc())

    if status:
        query = query.where(EscalationTicket.status == status)

    if current_user["role"] == "manager":
        query = query.where(EscalationTicket.escalated_by == uuid.UUID(current_user["id"]))

    result = await db.execute(query)
    tickets = result.scalars().all()

    result_data = []
    for t in tickets:
        card = await db.get(RecommendationCard, t.recommendation_card_id)
        result_data.append({
            "id": str(t.id),
            "recommendation_card_id": str(t.recommendation_card_id),
            "card_title": card.title if card else None,
            "escalated_by": str(t.escalated_by),
            "reason": t.reason,
            "status": t.status,
            "resolved_by": str(t.resolved_by) if t.resolved_by else None,
            "resolved_at": t.resolved_at.isoformat() if t.resolved_at else None,
            "created_at": t.created_at.isoformat() if t.created_at else None,
        })

    return result_data


@router.post("/escalations/{ticket_id}/approve")
async def approve_escalation(
    ticket_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    if current_user["role"] != "director":
        raise HTTPException(status_code=403, detail="Only directors can approve escalations")

    try:
        uid = uuid.UUID(ticket_id)
    except ValueError:
        raise HTTPException(400, detail="Invalid ticket ID format")

    ticket = await db.get(EscalationTicket, uid)
    if not ticket:
        raise HTTPException(404, detail="Escalation ticket not found")

    if ticket.status != "pending":
        raise HTTPException(400, detail=f"Ticket already {ticket.status}")

    ticket.status = "approved"
    ticket.resolved_by = uuid.UUID(current_user["id"])
    ticket.resolved_at = datetime.utcnow()

    notif = Notification(
        user_id=ticket.escalated_by,
        message=f"Your escalation was approved by {current_user['full_name'] or current_user['username']}",
        related_entity_type="escalation",
        related_entity_id=ticket.id,
    )
    db.add(notif)
    await db.commit()

    return {"status": "approved", "message": "Escalation approved"}


@router.post("/escalations/{ticket_id}/reject")
async def reject_escalation(
    ticket_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    if current_user["role"] != "director":
        raise HTTPException(status_code=403, detail="Only directors can reject escalations")

    try:
        uid = uuid.UUID(ticket_id)
    except ValueError:
        raise HTTPException(400, detail="Invalid ticket ID format")

    ticket = await db.get(EscalationTicket, uid)
    if not ticket:
        raise HTTPException(404, detail="Escalation ticket not found")

    if ticket.status != "pending":
        raise HTTPException(400, detail=f"Ticket already {ticket.status}")

    ticket.status = "rejected"
    ticket.resolved_by = uuid.UUID(current_user["id"])
    ticket.resolved_at = datetime.utcnow()

    notif = Notification(
        user_id=ticket.escalated_by,
        message=f"Your escalation was rejected by {current_user['full_name'] or current_user['username']}",
        related_entity_type="escalation",
        related_entity_id=ticket.id,
    )
    db.add(notif)
    await db.commit()

    return {"status": "rejected", "message": "Escalation rejected"}
