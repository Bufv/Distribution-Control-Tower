from fastapi import APIRouter, Depends
from sqlalchemy import select
from sqlalchemy.ext.asyncio import AsyncSession

from app.database import get_db
from app.models.audit_trail import AuditTrail

router = APIRouter(prefix="/api/audit-trail", tags=["Audit Trail"])


@router.get("")
async def list_audit_trail(
    recommendation_card_id: str = None,
    db: AsyncSession = Depends(get_db),
):
    query = select(AuditTrail).order_by(AuditTrail.acted_at.desc())

    if recommendation_card_id:
        from sqlalchemy.dialects.postgresql import UUID
        import uuid
        try:
            uid = uuid.UUID(recommendation_card_id)
        except ValueError:
            return []
        query = query.where(AuditTrail.recommendation_card_id == uid)

    result = await db.execute(query)
    entries = result.scalars().all()

    return [
        {
            "id": str(e.id),
            "recommendation_card_id": str(e.recommendation_card_id),
            "action": e.action,
            "reason_code": e.reason_code,
            "notes": e.notes,
            "acted_by": e.acted_by,
            "acted_at": e.acted_at.isoformat() if e.acted_at else None,
        }
        for e in entries
    ]
