# STATE — Executive Distribution Control Tower

## Project Reference

- **Core Value:** Pusat komando taktis FMCG untuk deteksi ketimpangan distribusi secara instan dengan rekomendasi kolaboratif-finansial
- **Tech Stack:** React + Vite + Tailwind CSS | Python FastAPI async | PostgreSQL
- **Deployment:** Docker Compose (VPS tunggal)
- **Current Focus:** Menyelesaikan sisa stories MVP: Auth, Story 2.2, 4.1, 4.2, 3.1

## Current Position

- **Phase:** 4 (Auth & RBAC) — next to execute
- **Plan:** ROADMAP.md (5 stories remaining, each in separate branch)
- **Status:** Infrastructure ready, pending implementation
- **Progress:** ███████░░░░░ 65%

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
| Phase 4 — Auth & RBAC | `story-auth` | `main` |
| Phase 5 — Story 2.2 (Escalate) | `story-2.2` | `story-auth` |
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

### Quick Start for Next Session

```bash
git checkout main
git checkout -b story-auth
# Implement JWT auth backend + login form frontend
```

### Related Files

- `.planning/ROADMAP.md` — Full roadmap with phase details
- `docs/PRD_Executive_Distribution_Control_Tower.md` — Product requirements
- `docs/AUDIT_IMPLEMENTASI.md` — Implementation audit (v2.1)
