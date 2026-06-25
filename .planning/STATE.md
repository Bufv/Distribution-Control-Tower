# STATE — Executive Distribution Control Tower

## Project Reference

- **Core Value:** Pusat komando taktis FMCG untuk deteksi ketimpangan distribusi secara instan dengan rekomendasi kolaboratif-finansial
- **Tech Stack:** React + Vite + Tailwind CSS | Python FastAPI async | PostgreSQL
- **Deployment:** Docker Compose (VPS tunggal)
- **Current Focus:** MVP complete — semua 11 requirement ✅

## Current Position

- **Phase:** 8 (Graceful Degradation — Story 3.1) — ✅ Complete
- **Plan:** ROADMAP.md — semua phase selesai
- **Status:** Semua MVP stories (11/11) complete
- **Progress:** ████████████ 100%

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
- **Phase 8 (story-3.1):** Graceful Degradation — GET /api/staleness endpoint, useStaleness hook + StaleTooltip, integrasi aksen kuning + tooltip ke StockHealthCards, RegionalTable, MITLCards

### Active Branches (belum di-merge)

| Branch | Phase | Status |
|--------|-------|--------|
| `story-4.2` | Phase 7 — Discussion Thread | ✅ Complete, perlu PR ke `main` |
| `story-3.1` | Phase 8 — Graceful Degradation | ✅ Complete, perlu PR ke `main` |

### Key Decisions

- Story 1.3 (Regional Penetration Map) **OUT OF SCOPE MVP** — diganti tabel ranking region
- Story 3.2 (Manual Override untuk Ws) **OUT OF SCOPE MVP** — ditunda
- Auth menggunakan JWT sederhana, 2 role (manager, director) — tanpa SSO/RBAC kompleks
- Notifikasi in-app only — tanpa integrasi email/SMS/WhatsApp
- Rule-based engine (IF-THEN) — tanpa ML/AI
- Seasonality Weighting (Ws) dari tabel lookup manual via CSV

### Open Questions / Blocker

- Perlu merge story-4.2 → main dan story-3.1 → main untuk menyelesaikan MVP

## Session Continuity

### Latest Update

- **Action:** Implementasi Phase 8 (Story 3.1 — Graceful Degradation) di branch `story-3.1`
- **Result:** GET /api/staleness endpoint, useStaleness hook + StaleTooltip, integrasi aksen kuning + tooltip ke StockHealthCards, RegionalTable, MITLCards
- **Branch:** `story-3.1` (berbasis dari `main`)
- **Commits:**
  - `596bc37` — feat(8): add GET /api/staleness endpoint
  - `d6dfd7b` — feat(8): useStaleness hook + StaleTooltip component
  - `252d717` — feat(8): integrate stale indicators in all components

### Quick Start for Next Session

```bash
# Merge semua branch ke main
git checkout main && git merge story-4.2 && git merge story-3.1
```

### Related Files

- `.planning/ROADMAP.md` — Full roadmap with phase details
- `docs/PRD_Executive_Distribution_Control_Tower.md` — Product requirements
