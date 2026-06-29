# STATE — Executive Distribution Control Tower

## Project Reference

- **Core Value:** Pusat komando taktis FMCG untuk deteksi ketimpangan distribusi secara instan dengan rekomendasi kolaboratif-finansial
- **Tech Stack:** React + Vite + Tailwind CSS | Python FastAPI async | PostgreSQL
- **Deployment:** Docker Compose (VPS tunggal)
- **Current Focus:** Phase 11 — Data Integrity & Flow Rate Analysis 🚧

## Current Position

- **Phase:** 11 (Data Integrity & Flow Rate Analysis) — 🚧 In Progress
- **Branch:** `fix/flow-rate-analysis`
- **Status:** Phase 11 (2/3 stories complete) ✅ Story 11.1 done ✅ Story 11.2 done 🚧 Story 11.3 in progress
- **Progress:** ████████████░ 95%

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
- **Phase 10 (story-10-action-plan):** Commercial Action Plan — Data generator upgrade, Tactic API + verifier, SystemRecommendations panel, kanban swimlane, archive tab

### Phase 11 In Progress

- **Story 11.1 — Verifier Bug Fix** ✅ Complete (branch `fix/verifier-cutoff-bug`, merged to `main`)
  - Root cause: `executed_at < datetime.utcnow() - 365days` tidak pernah match karena data mulai 2026-01-01
  - Fix: Hapus cutoff filter; per-tactic `window_end > now` sudah cukup
  - Fix redundant: Hapus panggilan `run_verification_cycle()` kedua di `main.py`

- **Story 11.2 — Inventory Realism** ✅ Complete
  - `generate_inventory` (scenarios.py): hapus factor ×0.8–1.0 → return base_stock langsung (data DB sinkron memory)
  - `BASE_SELL_OUT_RANGE` (generator.py): ubah (70, 110) → (80, 120) seimbang dengan sell_in
  - Tactic adjustment (generator.py): handle semua kombinasi metric×direction (sell_in ↑↓, sell_out ↑↓, inventory ↑↓, gap ↓)

- **Story 11.3 — Flow Rate Analysis UI** 🚧 In Progress
  - Backend: tambah parameter `distributor_id` di `GET /api/sales`, filter query, field `gap` di response
  - Frontend: tambah distributor dropdown di `SellInSellOutChart`, area chart merah untuk gap, total gap summary

### Key Decisions

- Story 1.3 (Regional Penetration Map) **OUT OF SCOPE MVP** — diganti tabel ranking region (sekarang dihapus)
- Story 3.2 (Manual Override untuk Ws) **OUT OF SCOPE MVP** — ditunda
- Auth menggunakan JWT sederhana, 2 role (manager, director) — tanpa SSO/RBAC kompleks
- Notifikasi in-app only — tanpa integrasi email/SMS/WhatsApp
- Rule-based engine (IF-THEN) — tanpa ML/AI
- **Phase 10:** MITL Card → System Recommendations (read-only panel). Tactic sebagai item kerja utama
- **Phase 11:** Verifier cutoff dihapus, bukan flip ke `>=`. Filter per-tactic `window_end > now` lebih tepat
- **Phase 11:** Inventory realism — `generate_inventory` return base_stock, bukan rasio random
- **Phase 11:** Flow rate analysis cukup ditambahkan ke chart yang sudah ada (tidak perlu komponen baru)

## Session Continuity

### Latest Update

- **Action:** Implementasi Phase 11 — Data Integrity & Flow Rate Analysis
- **Scope:** 3 stories — Verifier bug fix → Inventory realism → Flow rate analysis UI
- **Branch:** `fix/flow-rate-analysis` (base `main`)
- **Status:** Story 11.1 ✅ (merged), Story 11.2 ✅, Story 11.3 🚧 (backend + frontend changes applied, pending verification)
- **Pending:** E2E flow test, verify chart shows distributor filter + gap area

### Related Files

- `.planning/ROADMAP.md` — Full roadmap with Phase 11
- `.planning/phases/11-flow-rate-analysis/` — Plan docs
- `backend/app/services/verifier.py` — Verifier fix
- `backend/data_generator/main.py` — Redundant verifier call removed
- `backend/data_generator/generator.py` — BASE_SELL_OUT range, tactic adjustment completeness
- `backend/data_generator/scenarios.py` — generate_inventory fix
- `backend/app/routers/sales.py` — distributor_id filter + gap field
- `frontend/src/components/SellInSellOutChart.jsx` — Distributor dropdown + area chart gap
