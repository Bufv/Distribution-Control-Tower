# STATE — Executive Distribution Control Tower

## Project Reference

- **Core Value:** Pusat komando taktis FMCG untuk deteksi ketimpangan distribusi secara instan dengan rekomendasi kolaboratif-finansial
- **Tech Stack:** React + Vite + Tailwind CSS | Python FastAPI async | PostgreSQL
- **Deployment:** Docker Compose (VPS tunggal)
- **Current Focus:** Phase 10 — Commercial Action Plan & Tactic Workflow 🚧

## Current Position

- **Phase:** 10 (Commercial Action Plan & Tactic Workflow) — 🚧 In Progress
- **Branch:** `story-10-action-plan`
- **Status:** MVP (13/13) complete ✅ — Phase 10 (5/5) in progress 🚧
- **Progress:** ██████████░░ 85%

## Performance Metrics

| Metrik | Target | Current |
|--------|--------|---------|
| Time-to-Decision Reduction | ≤30 menit | Belum diukur |
| Action Implementation Rate | ≥60% | Belum diukur |
| Data Visibility Coverage | 100% (3 skenario) | ✅ 100% |
| MITL Gate Compliance | 100% | Belum diukur |

## Accumulated Context

### Completed Work

- **Phase 1 (main):** Full infrastructure — Docker Compose, 8 tabel DB, FastAPI app, React+Vite+Tailwind frontend, data generator (3 skenario), Nginx reverse proxy, run.sh
- **Phase 2 (main):** Executive Dashboard — 6 API endpoints (distributors, sales, sales/skus, inventory + DOI, regions/ranking, health), 3 React komponen (SellInSellOutChart, StockHealthCards, RegionalTable), DOI calculation service
- **Phase 3 (story-2.1):** MITL Cards + Promo Calendar — API recommendations dengan promo check, MITLCards component (promo-aware tag + disabled button), PromoForm component (CRUD promo), GET/POST/DELETE /api/promos
- **Phase 4 (story-auth):** Auth & RBAC — User model, migration + seed data, JWT login, auth middleware, login page + AuthContext
- **Phase 5 (story-2.2):** Escalate to Commercial/Legal — EscalationTicket + Notification models (migration 003), escalation API (POST escalate, GET list, POST approve/reject), notification API (GET list, POST read/read-all)
- **Phase 6 (story-4.1):** Justification Gateway — POST action endpoint dengan reason_code + notes validation, GET audit-trail endpoint, audit trail history
- **Phase 7 (story-4.2):** Discussion Thread — GET/POST /api/recommendations/{id}/comments endpoint dengan @mention → notification
- **Phase 8 (story-3.1):** Graceful Degradation — GET /api/staleness endpoint, useStaleness hook + StaleTooltip
- **Phase 9 (story-5):** UI Enhancement — stock angka aktual, Inventory Health page, MITL Detail Modal consolidated, sidebar active

### Phase 10 In Progress

- **Plan 01: Data Generator Upgrade** — ✅ Selesai. Scenarios realistis dengan financial_impact (SKU prices 35rb-70rb/karton), threshold escalation >= Rp 200jt, context-aware adjustment dari tactics.
- **Plan 02: Backend Tactic API** — ✅ Selesai. Model Tactic dengan 20+ kolom, 11 endpoints (CRUD + workflow), verification service (bandingkan baseline vs outcome), auto-create tactic dari approve rekomendasi dan escalation.
- **Plan 03: System Recommendations Panel** — ✅ Selesai. SystemRecommendations.jsx + RecommendationCardSimple.jsx. Card hilang setelah di-action. 3 tombol langsung: Approve/Modify/Reject.
- **Plan 04: Commercial Action Plan Tab** — ✅ Selesai. CommercialActionPlan.jsx (5 swimlane: Draft/Submitted/Approved/Rejected/Executed). TacticCard.jsx. TacticDetailModal.jsx (3 mode + 4 tabs: detail/diskusi/riwayat/verifikasi).
- **Plan 05: Archive + Layout Integration** — ✅ Selesai. Archive.jsx (table + filter). App.jsx (4 tab aktif). Main.js panggil verifier.

### Bugs Fixed (Phase 10)

| Bug | Fix |
|-----|-----|
| Migration ID mismatch (004→005 chain putus) | down_revision `004_add_scenario_counter` → `004` |
| `expected_change_pct * 100` nampil 2000% | Hapus `* 100` |
| Modal muncul otomatis pas mount | `useState(null)` → `useState()` |
| `isOwner` blokir Execute button | Relax ke `isManager` (any manager) |
| `user.id` undefined di AuthContext | Panggil `/api/me` instead of JWT decode |
| Login response missing `id` | Tambah `id` ke LoginResponse + JWT payload |

### Key Decisions

- Story 1.3 (Regional Penetration Map) **OUT OF SCOPE MVP** — diganti tabel ranking region (sekarang dihapus, tidak berguna)
- Story 3.2 (Manual Override untuk Ws) **OUT OF SCOPE MVP** — ditunda
- Auth menggunakan JWT sederhana, 2 role (manager, director) — tanpa SSO/RBAC kompleks
- Notifikasi in-app only — tanpa integrasi email/SMS/WhatsApp
- Rule-based engine (IF-THEN) — tanpa ML/AI
- **Phase 10:** MITL Card → System Recommendations (read-only panel). Tactic sebagai item kerja utama di tab Commercial Action Plan
- **Lifecycle baru:** draft → submitted → approved/rejected → executed → verified (system-verified execution)
- **Threshold escalation natural:** financial_impact >= Rp 200jt → suggest_escalate=true
- **Data generator context-aware:** menyesuaikan data dengan tactic yang sedang di-execute
- Regional Table dihapus dari dashboard (tidak memberikan value actionable)
- Archive menggantikan tab Regional Reports

## Session Continuity

### Latest Update

- **Action:** Implementasi Phase 10 — Commercial Action Plan & Tactic Workflow
- **Scope:** 5 plan — Data generator upgrade → Tactic API → SystemRecommendations panel → Action Plan tab → Archive + Layout
- **Branch:** `story-10-action-plan` (base `main`)
- **Bugfixes:** 6 bugs fixed — migration ID, AuthContext `/api/me`, modal mount, execute relaksasi, expected_pct display, login id
- **Pending operational:** Docker rebuild + E2E flow test

### Related Files

- `.planning/ROADMAP.md` — Full roadmap with phase details
- `.planning/phases/10-action-plan/` — PLAN.md files untuk 5 plans
- `backend/app/models/tactic.py` — Tactic ORM model
- `backend/app/routers/tactics.py` — Tactic API (11 endpoints)
- `backend/app/services/verifier.py` — System-verified execution
- `frontend/src/components/SystemRecommendations.jsx` — Panel rekomendasi
- `frontend/src/components/CommercialActionPlan.jsx` — Kanban swimlane
- `frontend/src/components/TacticDetailModal.jsx` — Full detail + form
- `frontend/src/components/Archive.jsx` — Riwayat table
