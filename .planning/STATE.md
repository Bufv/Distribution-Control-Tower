# STATE — Executive Distribution Control Tower

## Project Reference

- **Core Value:** Pusat komando taktis FMCG untuk deteksi ketimpangan distribusi secara instan dengan rekomendasi kolaboratif-finansial
- **Tech Stack:** React + Vite + Tailwind CSS | Python FastAPI async | PostgreSQL
- **Deployment:** Docker Compose (VPS tunggal)
- **Current Focus:** Menyelesaikan sisa stories MVP: Story 4.2, 3.1

## Current Position

- **Phase:** 7 (Discussion Thread — Story 4.2) — ✅ Complete
- **Plan:** ROADMAP.md (1 story remaining in separate branch)
- **Status:** Comment thread per card with @mention notifications done on `story-4.2`
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
- **Phase 5 (story-2.2):** Escalate to Commercial/Legal — EscalationTicket + Notification models (migration 003), escalation API (POST escalate, GET list, POST approve/reject), notification API (GET list, POST read/read-all), EscalateModal, NotificationsDropdown, director EscalationPanel with Approve/Reject buttons
- **Phase 6 (story-4.1):** Justification Gateway — POST action endpoint dengan reason_code + notes validation, GET audit-trail endpoint, ActionModal (4 reason codes dropdown + min 10 char notes), AuditTrailModal (riwayat audit per card), Modify/Reject buttons on MITL cards, card status indicator, auto-refresh after action
- **Phase 7 (story-4.2):** Discussion Thread — GET/POST /api/recommendations/{id}/comments endpoint dengan @mention → notification, CommentModal (flat thread, auto-refresh), Comment button di MITLCards

### Codebase Changes

- **`story-2.1` merged to `main`** ✅ — Semua kode MITL Cards + Promo Calendar sekarang di `main`
- **Planning files added** — `.planning/ROADMAP.md`, `.planning/STATE.md`, traceability di PRD
- **Branch `main` sekarang sudah contains:** Phase 1 (infra) + Phase 2 (dashboard) + Phase 3 (MITL cards)

### Key Decisions

- Story 1.3 (Regional Penetration Map) **OUT OF SCOPE MVP** — diganti tabel ranking region
- Story 3.2 (Manual Override untuk Ws) **OUT OF SCOPE MVP** — ditunda
- Auth menggunakan JWT sederhana, 2 role (manager, director) — tanpa SSO/RBAC kompleks
- Notifikasi in-app only — tanpa integrasi email/SMS/WhatsApp
- Rule-based engine (IF-THEN) — tanpa ML/AI
- Seasonality Weighting (Ws) dari tabel lookup manual via CSV

### Remaining Work

| Phase | Branch | Dependencies |
|-------|--------|-------------|
| Phase 8 — Story 3.1 (Degradation) | `story-3.1` | `main` |

### Open Questions / Blocker

- Tidak ada blocker saat ini

## Session Continuity

### Last Session

- **Action:** Membuat ROADMAP.md dan STATE.md
- **Result:** Roadmap per-story dengan branch strategy sudah terdokumentasi
- **Next:** Eksekusi Phase 4 (Auth & RBAC) di branch `story-auth`

### Previous Update

- **Action:** Merge `story-2.1` → `main`, update ROADMAP dependency graph
- **Result:** `story-2.1` code (MITL Cards + Promo) now in `main`. Clean base for all future branches.
- **Commit:** `442a945` — planning docs committed to `main`

### Latest Update

- **Action:** Implementasi Phase 7 (Story 4.2 — Discussion Thread) di branch `story-4.2`
- **Result:** GET/POST /api/recommendations/{id}/comments endpoint dengan @mention → notification, CommentModal (flat thread, auto-refresh), Comment button di MITLCards
- **Branch:** `story-4.2` (berbasis dari `main`)
- **Commits:**
  - `d1b8260` — feat(7): add GET/POST comment endpoints with @mention notifications
  - `5606b9e` — feat(7): CommentModal component with flat thread and @mention support
  - `9ec6eb5` — feat(7): integrate Comment button in MITLCards + wire CommentModal in App

### Quick Start for Next Session

```bash
git checkout story-3.1  # Phase 8 — Graceful Degradation (last pending phase)
```

### Related Files

- `.planning/ROADMAP.md` — Full roadmap with phase details
- `docs/PRD_Executive_Distribution_Control_Tower.md` — Product requirements
- `docs/AUDIT_IMPLEMENTASI.md` — Implementation audit (v2.1)
