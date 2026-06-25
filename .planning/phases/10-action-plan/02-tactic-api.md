---
phase: 10-action-plan
plan: 02
type: execute
wave: 1
depends_on: []
files_modified:
  - backend/app/models/tactic.py
  - backend/app/routers/tactics.py
  - backend/app/models/__init__.py
  - backend/app/main.py
  - backend/alembic/versions/007_add_tactics.py
  - backend/app/routers/recommendations.py
  - backend/app/routers/escalations.py
autonomous: true
must_haves:
  truths:
    - Tactic punya lifecycle lengkap: draft → submitted → approved/rejected → executed
    - Approve rekomendasi auto-create tactic di draft
    - Escalation approve auto-create tactic di approved (skip pipeline)
    - System record baseline data saat execute
    - Notifikasi dikirim di setiap status change
  artifacts:
    - Tactic model
    - tactics.py router (11 endpoints)
  key_links:
    - recommendations.py → tactics.py (auto-create dari approve/modify)
    - escalations.py → tactics.py (auto-create dari approve escalation)
---

<objective>
Tabel + API lengkap untuk lifecycle tactic dengan verification system.
</objective>

<context>
@backend/app/models/recommendation.py
@backend/app/models/escalation.py
@backend/app/models/notification.py
@backend/app/models/__init__.py
@backend/app/routers/recommendations.py
@backend/app/routers/escalations.py
@backend/app/dependencies.py
@backend/app/main.py
</context>

<tasks>

<task type="auto">
<name>Task 1: Create Tactic model + migration</name>
<files>backend/app/models/tactic.py, backend/alembic/versions/007_add_tactics.py, backend/app/models/__init__.py</files>
<action>
Buat `backend/app/models/tactic.py` dengan kolom:
- id (UUID PK), title (String 200), description (Text, nullable)
- tactic_type (String 50): overstock/stockout/redistribution/investigation
- severity (String 20, default medium): high/medium/low
- status (String 20, default draft): draft/submitted/approved/rejected/executed
- source_recommendation_id (UUID FK→recommendation_cards, nullable)
- source_type (String 20, default 'system'): system/manual
- region (String 100, nullable)
- distributor_id (UUID FK→distributors, nullable)
- sku_id (UUID FK→sku_catalog, nullable)
- financial_impact_est (BigInteger, nullable)
- created_by (UUID FK→users)
- submitted_by, submitted_at (nullable)
- approved_by, approved_at (nullable)
- rejected_by, rejected_at, rejected_reason (nullable)
- executed_by, executed_at (nullable)
- proposal_notes (Text, nullable)
- reason_code (String 50, nullable)
- expected_metric (String 50, nullable)
- expected_direction (String 20, nullable)
- expected_change_pct (Float, nullable)
- verification_window_days (Integer, default 7)
- verification_status (String 20, nullable): verified/deviation_detected/overdue/null
- baseline_value (Float, nullable)
- baseline_recorded_at (DateTime, nullable)
- outcome_value (Float, nullable)
- outcome_recorded_at (DateTime, nullable)
- deviation_notes (Text, nullable)
- created_at, updated_at (DateTime)

Migration 007_add_tactics.py — create_table('tactics') with all columns.

Update __init__.py: tambah import Tactic.
</action>
<verify>python -c "from app.models.tactic import Tactic; print(Tactic.__tablename__)" → tactics</verify>
<done>Tactic model + migration siap.</done>
</task>

<task type="auto">
<name>Task 2: Create tactics router with 11 endpoints</name>
<files>backend/app/routers/tactics.py, backend/app/main.py</files>
<action>
Buat backend/app/routers/tactics.py dengan endpoint:

1. GET /api/tactics — list, filter by ?status=&region=&type=&tactic_type=
   - Manager: hanya lihat created_by=self (kecuali submitted/approved: lihat semua)
   - Director: lihat semua

2. GET /api/tactics/{id} — detail single tactic

3. POST /api/tactics — create manual tactic (status=draft)
   - Body: title, description, tactic_type, severity, region, distributor_id, sku_id, financial_impact_est, proposal_notes, reason_code, expected_metric, expected_direction, expected_change_pct, verification_window_days
   - Set created_by = current_user

4. PUT /api/tactics/{id} — update tactic (hanya status=draft, only by creator)

5. POST /api/tactics/{id}/submit — draft→submitted
   - Validasi: status=draft, current_user=creator
   - Set submitted_by, submitted_at
   - Notif ke semua director aktif

6. POST /api/tactics/{id}/approve — submitted→approved (director only)
   - Validasi: role=director, status=submitted
   - Set approved_by, approved_at
   - Notif ke creator

7. POST /api/tactics/{id}/reject — submitted→rejected (director only)
   - Body: {reason: string}
   - Set rejected_by, rejected_at, rejected_reason
   - Notif ke creator

8. POST /api/tactics/{id}/execute — approved→executed (manager only, creator)
   - Record baseline: hitung rata-rata sell_in/sell_out/inventory 3 hari terakhir untuk distributor+sku
   - Simpan di baseline_value, baseline_recorded_at
   - Set executed_by, executed_at

9. POST /api/tactics/{id}/revise — rejected→draft (manager only, creator)

10. DELETE /api/tactics/{id} — hapus hanya status=draft (manager only, creator)

Semua endpoint pakai `current_user: dict = Depends(get_current_user)`.
Gunakan `get_db` untuk DB session.

Register di main.py: `from app.routers import tactics` + `app.include_router(tactics.router)`
</action>
<verify>python3 -c "from app.routers import tactics; print(hasattr(tactics, 'router'))" → True</verify>
<done>Tactics router dengan 11 endpoints berfungsi.</done>
</task>

<task type="auto">
<name>Task 3: Link recommendations → tactics + escalations → tactics</name>
<files>backend/app/routers/recommendations.py, backend/app/routers/escalations.py</files>
<action>
**Modifikasi recommendations.py:**

1. Tambah endpoint POST /api/recommendations/{card_id}/approve:
   - Validasi card ada, status='pending'
   - Auto-create Tactic (source_type='system') dengan data dari card
   - Tactic status='draft'
   - Update card.status='approved'

2. Modifikasi POST {card_id}/action (modify):
   - Setelah audit trail, auto-create Tactic dari card yang dimodifikasi
   - Tactic.proposal_notes = body.notes, Tactic.reason_code = body.reason_code

3. Modifikasi GET /api/recommendations:
   - Default: hanya return cards WHERE status='pending'
   - Tambah query param `?include_actioned=true` untuk return semua
   - Sertakan semua field baru (financial_impact, suggest_escalate, etc.)

**Modifikasi escalations.py:**

4. Modifikasi POST {ticket_id}/approve:
   - Setelah ticket di-approve: cari recommendation card terkait
   - Auto-create Tactic dengan status='approved' (skip pipeline — escalation = darurat)
   - Tactic.executed_by = ticket.escalated_by

5. Modifikasi POST {ticket_id}/reject:
   - Update card.status = 'rejected' (jika card masih ada)
   - Notif ke manager

Semua notifikasi menggunakan model Notification yang sudah ada.
</action>
<verify>POST /api/recommendations/{id}/approve → GET /api/tactics → lihat tactic baru di draft</verify>
<done>Recommendation dan escalation terhubung penuh ke tactic lifecycle.</done>
</task>

</tasks>

<verification>
1. POST /api/tactics → 201
2. POST /api/tactics/{id}/submit → status submitted
3. POST /api/tactics/{id}/approve (as director) → status approved
4. POST /api/recommendations/{id}/approve → tactic terbuat di draft
5. POST /api/escalations/{id}/approve → tactic terbuat di approved
</verification>

<success_criteria>
- Semua 11 endpoint tactic berfungsi dengan RBAC
- Approve/modify rekomendasi auto-create tactic
- Escalation approve auto-create tactic (skip pipeline)
- Notifikasi terkirim di setiap status change
</success_criteria>

<output>
`.planning/phases/10-action-plan/02-tactic-api-SUMMARY.md`
</output>
