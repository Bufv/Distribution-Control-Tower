# STATE — Executive Distribution Control Tower

## Project Reference

- **Core Value:** Pusat komando taktis FMCG untuk deteksi ketimpangan distribusi secara instan dengan rekomendasi kolaboratif-finansial
- **Tech Stack:** React + Vite + Tailwind CSS | Python FastAPI async | PostgreSQL
- **Deployment:** Docker Compose (VPS tunggal)
- **Current Focus:** Menyelesaikan sisa stories MVP: Story 2.2, 4.1, 4.2, 3.1

## Current Position

- **Phase:** 5 (MITL Engine — Story 2.2) — ✅ Complete
- **Plan:** ROADMAP.md (3 stories remaining, each in separate branch)
- **Status:** Escalate button + approval workflow done on `story-2.2`
- **Progress:** ██████████░░ 82%

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
| Phase 6 — Story 4.1 (Justification) | `story-4.1` | `story-2.2` |
| Phase 7 — Story 4.2 (Discussion) | `story-4.2` | `story-2.2` |
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

- **Action:** Implementasi Phase 5 (Story 2.2 — Escalate to Commercial/Legal) di branch `story-2.2`
- **Result:** EscalationTicket + Notification models, migration 003, escalation API (escalate/list/approve/reject), notification API (list/read/read-all), EscalateModal, NotificationsDropdown, director EscalationPanel
- **Branch:** `story-2.2` (berbasis dari `story-auth` — belum di-merge ke `main`)
- **Files:** 7 files baru + 3 modified

### Quick Start for Next Session

```bash
git checkout story-2.2  # Phase 5 — Escalate active branch
# Next: Story 4.1 (Justification Gateway) or Story 4.2 (Discussion Thread)
```

### Related Files

- `.planning/ROADMAP.md` — Full roadmap with phase details
- `docs/PRD_Executive_Distribution_Control_Tower.md` — Product requirements
- `docs/AUDIT_IMPLEMENTASI.md` — Implementation audit (v2.1)
