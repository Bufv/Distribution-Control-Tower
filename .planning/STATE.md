# STATE — Executive Distribution Control Tower

## Project Reference

- **Core Value:** Pusat komando taktis FMCG untuk deteksi ketimpangan distribusi secara instan dengan rekomendasi kolaboratif-finansial
- **Tech Stack:** React + Vite + Tailwind CSS | Python FastAPI async | PostgreSQL
- **Deployment:** Docker Compose (VPS tunggal)
- **Current Focus:** Phase 9 enhancement — stock visibility, MITL Detail Modal, Inventory Health tab 🚧

## Current Position

- **Phase:** 9 (UI Enhancement & Stock Visibility) — 🚧 In Progress
- **Plan:** ROADMAP.md — Phase 9 enhancement sedang dikerjakan
- **Status:** MVP (11/11) complete ✅ — Enhancement (2/13) in progress 🚧
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
- **Phase 5 (story-2.2):** Escalate to Commercial/Legal — EscalationTicket + Notification models (migration 003), escalation API (POST escalate, GET list, POST approve/reject), notification API (GET list, POST read/read-all), EscalateModal, NotificationsDropdown, director EscalationPanel with Approve/Reject buttons
- **Phase 6 (story-4.1):** Justification Gateway — POST action endpoint dengan reason_code + notes validation, GET audit-trail endpoint, ActionModal (4 reason codes dropdown + min 10 char notes), AuditTrailModal (riwayat audit per card), Modify/Reject buttons on MITL cards, card status indicator, auto-refresh after action
- **Phase 7 (story-4.2):** Discussion Thread — GET/POST /api/recommendations/{id}/comments endpoint dengan @mention → notification, CommentModal (flat thread, auto-refresh), Comment button di MITLCards
- **Phase 8 (story-3.1):** Graceful Degradation — GET /api/staleness endpoint, useStaleness hook + StaleTooltip, integrasi aksen kuning + tooltip ke StockHealthCards, RegionalTable, MITLCards

Semua branch sudah di-merge ke `main` — MVP 100% terintegrasi.

- **Phase 9 (enhancement, in progress):** UI Enhancement — angka stok aktual di StockHealthCards, endpoint `GET /api/inventory/detail` untuk breakdown per-SKU, halaman Inventory Health terpisah dengan filter distributor, MITL Detail Modal (konsolidasi ActionModal/EscalateModal/AuditTrailModal/CommentModal jadi 1), sidebar navigasi aktif (Dashboard + Inventory Health).

### Key Decisions

- Story 1.3 (Regional Penetration Map) **OUT OF SCOPE MVP** — diganti tabel ranking region
- Story 3.2 (Manual Override untuk Ws) **OUT OF SCOPE MVP** — ditunda
- Auth menggunakan JWT sederhana, 2 role (manager, director) — tanpa SSO/RBAC kompleks
- Notifikasi in-app only — tanpa integrasi email/SMS/WhatsApp
- Rule-based engine (IF-THEN) — tanpa ML/AI
- Seasonality Weighting (Ws) dari tabel lookup manual via CSV
- Enhancement Phase 9 dikerjakan di branch `story-5` (terpisah dari `main`)
- MITL Detail Modal menggantikan 4 modal terpisah — ActionModal, EscalateModal, AuditTrailModal, CommentModal dihapus
- Inventory Health tab menggunakan conditional rendering (tanpa react-router), konsisten dengan pola yang ada

## Session Continuity

### Latest Update

- **Action:** Memulai Phase 9 — UI Enhancement & Stock Visibility
- **Planning:** 3 plan — Backend inventory detail endpoint → Stock visibility + Inventory tab → MITL Detail Modal
- **Documentasi:** PRD, ROADMAP, STATE sudah diupdate sebagai sandaran sebelum eksekusi kode

### Related Files

- `.planning/ROADMAP.md` — Full roadmap with phase details
- `docs/PRD_Executive_Distribution_Control_Tower.md` — Product requirements
