import uuid

from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy import select, update
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.dependencies import get_current_user
from app.models.notification import Notification

router = APIRouter(prefix="/api/notifications", tags=["Notifications"])


@router.get("")
async def list_notifications(
    unread_only: bool = False,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    query = (
        select(Notification)
        .where(Notification.user_id == uuid.UUID(current_user["id"]))
        .order_by(Notification.created_at.desc())
    )

    if unread_only:
        query = query.where(Notification.is_read == False)

    result = await db.execute(query)
    notifs = result.scalars().all()

    return [
        {
            "id": str(n.id),
            "message": n.message,
            "related_entity_type": n.related_entity_type,
            "related_entity_id": str(n.related_entity_id) if n.related_entity_id else None,
            "is_read": n.is_read,
            "created_at": n.created_at.isoformat() if n.created_at else None,
        }
        for n in notifs
    ]


@router.post("/{notif_id}/read")
async def mark_read(
    notif_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    try:
        uid = uuid.UUID(notif_id)
    except ValueError:
        raise HTTPException(400, detail="Invalid notification ID format")

    notif = await db.get(Notification, uid)
    if not notif:
        raise HTTPException(404, detail="Notification not found")

    if notif.user_id != uuid.UUID(current_user["id"]):
        raise HTTPException(403, detail="Not your notification")

    notif.is_read = True
    await db.commit()

    return {"status": "ok"}


@router.post("/read-all")
async def mark_all_read(
    db: AsyncSession = Depends(get_db),
    current_user: dict = Depends(get_current_user),
):
    await db.execute(
        update(Notification)
        .where(
            Notification.user_id == uuid.UUID(current_user["id"]),
            Notification.is_read == False,
        )
        .values(is_read=True)
    )
    await db.commit()

    return {"status": "ok"}
