# Plan 02 — Backend Tactic API SUMMARY

## Status: ✅ Complete

## Deliverables
- `backend/app/models/tactic.py` — Tactic ORM dengan 20+ kolom
- `backend/alembic/versions/007_add_tactics.py` — migration
- `backend/app/routers/tactics.py` — 11 endpoints
- `backend/app/routers/recommendations.py` — approve + modify auto-create tactic
- `backend/app/routers/escalations.py` — approve auto-create tactic (skip pipeline)
- `backend/app/services/verifier.py` — system-verified execution

## 11 Endpoints
1. GET /api/tactics — list with RBAC filtering
2. GET /api/tactics/{id} — detail
3. POST /api/tactics — create (status=draft)
4. PUT /api/tactics/{id} — update draft
5. POST /api/tactics/{id}/submit — draft→submitted
6. POST /api/tactics/{id}/approve — submitted→approved (director)
7. POST /api/tactics/{id}/reject — submitted→rejected (director)
8. POST /api/tactics/{id}/execute — approved→executed
9. POST /api/tactics/{id}/revise — rejected→draft
10. DELETE /api/tactics/{id} — hapus draft

## Bug Fixes
- Migration revision IDs: 007 down_revision = `006` (bukan `006_add_recommendation_fields`)
- Auth: JWT payload + login response include `id` field

## Verification
- ✅ Tactic model + migration works
- ✅ Auto-create dari approve/modify recommendation
- ✅ Auto-create dari approve escalation (skip pipeline → langsung approved)
- ✅ Notifikasi ke director saat submit
