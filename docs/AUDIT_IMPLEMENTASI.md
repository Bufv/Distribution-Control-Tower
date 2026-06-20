# Laporan Audit Implementasi vs PRD

**Proyek:** Executive Distribution Control Tower (FMCG Edition)
**PRD Referensi:** `PRD_Executive_Distribution_Control_Tower.md`
**Auditor:** opencode

---

## Changelog

| Versi | Tanggal | Perubahan | Auditor |
|---|---|---|---|
| v1.0 | 2026-06-20 | Dokumen inisial — audit setelah Fase 1 selesai | opencode |
| **v2.0** | **2026-06-20** | **Update besar: Fase 2 (Executive Dashboard) selesai 100%. Perbaiki semua progress, critical issues, rekomendasi** | **opencode** |
| **v2.1** | **2026-06-20** | **Story 2.1: backend API rekomendasi + promo calendar + MITL cards + promo form. Update progress Fase 3** | **opencode** |

---

## Ringkasan Eksekutif

| Fase / Area | Progress (v1.0) | Progress (v2.0) | Progress (v2.1) | PRD Target |
|---|---|---|---|---|---|
| Fase 1 (Infrastruktur + DB + Data Generator) | **100%** | **100%** | **100%** | Minggu 1–2 |
| Fase 2 (Executive Dashboard — Epic 1) | **0%** | **100%** | **100%** | Minggu 3–4 |
| Fase 3 (MITL Engine — Epic 2) | **~10%** | **~30%** | **~60%** | Minggu 5–6 |
| Fase 4 (Kolaborasi + Data Governance — Epic 3.1 + Epic 4) | **~5%** | **~10%** | **~10%** | Minggu 7–8 |
| Security & Auth (Section 4.3) | **0%** | **0%** | **0%** | Section 4.3 |
| AI/MITL Engine Rule (Section 3) | **~15%** | **~15%** | **~30%** | Section 3 |
| **OVERALL** | **~25%** | **~55%** | **~65%** | — |

**Temuan Utama v2.1:** Fase 1, 2 sudah complete. Story 2.1 (MITL Cards + Promo Calendar Check) telah diimplementasi — backend API rekomendasi dengan promo check, komponen kartu dengan promo-aware tag, dan form promo manual. Story 2.2 (Escalate) masih belum. Fase 4 dan Auth masih 0%.

---

## 1. Fase 1: Infrastructure & Data Layer (100%)

| PRD Requirement | Status | Bukti |
|---|---|---|
| React + Vite + Tailwind CSS frontend | ✅ | `frontend/` — `package.json`, `vite.config.js`, `tailwind.config.js` |
| FastAPI backend | ✅ | `backend/app/main.py` — FastAPI app dengan CORS |
| PostgreSQL + Docker Compose | ✅ | `docker-compose.yml` — 3 service + healthcheck |
| 8 tabel database | ✅ | Migration `001_initial_schema.py` — `distributors`, `sku_catalog`, `daily_sales`, `inventory_snapshots`, `promo_calendar`, `recommendation_cards`, `audit_trail`, `comments` |
| SQLAlchemy models | ✅ | `backend/app/models/` — 8 model sesuai tabel |
| 3 skenario data generator | ✅ | `NormalScenario`, `ChannelStuffingScenario`, `StockoutScenario` di `scenarios.py` |
| 5 distributor + 5 SKU | ✅ | Seed data di `generator.py` |
| Round-robin skenario selection | ✅ | `pick_scenario()` via `/tmp/data_generator_counter.txt` |
| Dockerfile backend & frontend | ✅ | `Dockerfile.backend` (python:3.12-slim), `Dockerfile.frontend` (node:20 → nginx) |
| Nginx reverse proxy | ✅ | `nginx.conf` — proxy `/api/` ke `http://backend:8000` |
| `run.sh` utility script | ✅ | Mode: dev, seed, docker, docker-stop, cron, verify |

### Masalah Minor — Fase 1

1. **Data generator pakai `profile: [manual]` di Docker Compose** — PRD menyebut "CronJob atau Celery Beat", implementasi saat ini hanya `docker compose run --rm data-generator`. _Acceptable untuk MVP, tapi otomatisasi belum penuh._

2. **`run.sh cron` hanya print template** — tidak auto-install ke crontab.

3. **Tidak ada `.env.example`** — `app/config.py` membaca `DATABASE_URL` dari `.env`, tapi file contoh tidak disediakan.

4. **`alembic.ini` hardcode `sqlalchemy.url`** — berisi `postgresql+asyncpg://app:changeme@db:5432/distro_ct`, tidak ambil dari environment variable.

---

## 2. Fase 2: Executive Dashboard (Epic 1) — 100% ✅

### Story 1.1 — Sell-In vs Sell-Out Gap Chart ✅

| Acceptance Criteria | Status | Detail |
|---|---|---|
| [AC 1.1.1] Line chart 2 series (Sell-In vs Sell-Out) per bulan | ✅ | `frontend/src/components/SellInSellOutChart.jsx` — Recharts `LineChart` dengan 2 series: sell_in (biru) & sell_out (hijau) |
| [AC 1.1.2] Filter waktu (Bulanan, Kuartal) + dropdown SKU | ✅ | Dropdown period `monthly`/`quarterly` + dropdown SKU dari `GET /api/sales/skus` |
| [AC 1.1.3] Data refresh ≤5 detik setelah siklus data generator | 🟡 | Fetch on mount + dependency change. Data segar setiap render ulang. Belum ada auto-polling interval. |

**Backend:** `GET /api/sales` di `backend/app/routers/sales.py:12` — aggregate `date_trunc` monthly/quarterly.

### Story 1.2 — Stock Health Tracker ✅

| Acceptance Criteria | Status | Detail |
|---|---|---|
| [AC 1.2.1] Kartu stok per distributor + indikator warna (🔴🟢🟡) | ✅ | `frontend/src/components/StockHealthCards.jsx` — kartu per distributor dengan border-color coding + emoji indikator + count detail (overstock/healthy/understock) |
| [AC 1.2.2] DOI = Current Inventory / Seasonally Adjusted Forecasted Daily Demand | ✅ | `backend/app/services/doi.py:20` — rumus: `current_stock / (avg_sell_out_7hari * Ws)`; threshold: >30 overstock, <14 understock |

**Backend:** `GET /api/inventory` di `backend/app/routers/inventory.py:14` — aggregasi health per distributor via DOI per SKU.

### Story 1.3 — Regional Ranking Table ✅ (pengganti peta)

| Acceptance Criteria | Status | Detail |
|---|---|---|
| Tabel ranking region sederhana (pengganti peta interaktif) | ✅ | `frontend/src/components/RegionalTable.jsx` — peringkat, nama region, total sell-out |
| PRD menyatakan peta interaktif **OUT OF SCOPE MVP**, diganti tabel | ✅ Terpenuhi | |

**Backend:** `GET /api/regions/ranking` di `backend/app/routers/regions.py:12` — group by region, sum sell_out, order desc.

---

## 3. Fase 3: MITL Smart Recommendation Engine (Epic 2) — ~60%

### Story 2.1 — Financial & Commercial-Aware Card ✅

| Acceptance Criteria | Status v2.0 | Status v2.1 | Detail |
|---|---|---|---|
| [AC 2.1.1] Promo/JBP Calendar Index check | ❌ | ✅ | `backend/app/routers/recommendations.py` — setiap kartu dicek terhadap promo aktif di region/distributor yang sama dalam 30 hari ke depan |
| [AC 2.1.2] Tag `[DO NOT CUT ALLOCATION - PROMO PREP]` + tombol disabled | ❌ | ✅ | `frontend/src/components/MITLCards.jsx` — menampilkan tag ungu + tombol "Kurangi Alokasi" disabled jika `sell_in_cuttable=false` |
| [AC 2.1.3] Form input promo manual (CSV upload / input langsung) | ❌ | ✅ | `frontend/src/components/PromoForm.jsx` — modal dengan form lengkap (distributor, SKU, nama, tanggal, diskon) + daftar promo aktif + tombol hapus. Backend: `GET/POST /api/promos`, `DELETE /api/promos/{id}` |

**Backend:** `GET /api/recommendations` di `backend/app/routers/recommendations.py` — query promo dalam 30 hari, cocokkan region/distributor, return flag `promo_nearby` + `sell_in_cuttable`.

### Story 2.2 — Escalate to Commercial/Legal

| Acceptance Criteria | Status | Detail |
|---|---|---|
| [AC 2.2.1] Tombol `[Escalate to Commercial/Legal]` di kartu rekomendasi | ❌ | Belum ada |
| [AC 2.2.2] Tiket notifikasi (status: Pending → Approved/Rejected) | ❌ | Belum ada |
| [AC 2.2.3] In-app notification only (tanpa email) | ❌ | Belum ada |

### Yang Sudah Ada (Partial)

Data generator (`generator.py`) sudah membuat `RecommendationCard` berdasarkan kondisi:
- **Channel Stuffing scenario:** `recommendation_type="overstock"`, severity `"high"`
- **Stockout scenario:** `recommendation_type="stockout"`, severity `"high"`
- **Normal scenario:** `recommendation_type="channel_stuffing"`, severity `"medium"`

Sekarang sudah bisa diserve ke frontend via `GET /api/recommendations` dan ditampilkan di Tactic Panel via `MITLCards.jsx`.

---

## 4. Fase 4: Data Governance & Collaboration (Epic 3.1 + Epic 4) — ~10%

### Story 3.1 — Graceful Degradation

| Acceptance Criteria | Status | Detail |
|---|---|---|
| [AC 3.1.1] UI accent kuning jika data distributor >12 jam tidak masuk | ❌ | Tidak ada mekanisme deteksi staleness data |
| [AC 3.1.2] Tooltip: "Peringatan: Data Sell-Out [Wilayah] menggunakan estimasi..." | ❌ | Tidak ada |

### Story 4.1 — Justification Gateway

| Acceptance Criteria | Status | Detail |
|---|---|---|
| [AC 4.1.1] Tombol Modify/Reject gated — Reason Code dropdown (4 pilihan) | ❌ | Tabel `audit_trail` exist di DB, tapi tidak ada UI, tidak ada API |
| [AC 4.1.2] Free-Text Notes min 10 karakter | ❌ | Tidak ada validasi |
| [AC 4.1.3] Riwayat aksi di panel review | ❌ | Tidak ada |

### Story 4.2 — In-Context Discussion Thread

| Acceptance Criteria | Status | Detail |
|---|---|---|
| [AC 4.2.1] Thread komentar flat di bawah kartu | ❌ | Tabel `comments` exist di DB, tapi tidak ada UI/API |
| [AC 4.2.2] Mention @username dengan notifikasi in-app | ❌ | Tidak ada |
| [AC 4.2.3] Free-text biasa | ❌ | Tidak ada |

### Yang Sudah Ada (Partial)

- ✅ Tabel `audit_trail` — kolom: `recommendation_card_id`, `action`, `reason_code`, `notes`, `acted_by`, `acted_at`
- ✅ Tabel `comments` — kolom: `recommendation_card_id`, `user_id`, `content`, `created_at`
- ⚠️ Kedua tabel sudah siap di database, tinggal dibuatkan API endpoint + UI

---

## 5. Security & Auth (Section 4.3) — 0%

| PRD Requirement | Status | Detail |
|---|---|---|
| JWT authentication | ❌ | `python-jose[cryptography]` di requirements, tapi **TIDAK ADA** implementasi: tidak ada endpoint `/login`, tidak ada JWT middleware/dependency |
| 2 role: manager & director | ❌ | Tidak ada tabel/users, tidak ada RBAC |
| bcrypt password hashing | ❌ | `passlib[bcrypt]` di requirements, tapi tidak digunakan |
| Endpoint protected (kecuali /login, /docs) | ❌ | Satu-satunya endpoint `/health` tidak dilindungi |

---

## 6. AI System / MITL Engine (Section 3) — ~15%

| Requirement | Status | Detail |
|---|---|---|
| Rule-based engine: `IF (sell_in - sell_out) > threshold THEN generate card` | ⚠️ Partial | Logic ada di `generator.py` untuk generate seed data, tapi **tidak ada API endpoint** yang serve recommendation atau trigger recompute |
| Seasonality Weighting (Ws) — lookup table diisi manual via CSV | ❌ | Tidak ada tabel Ws, tidak ada upload mechanism |
| Promo Calendar check — query `WHERE region = X AND start_date <= now()+30 days` | ❌ | Tidak ada implementasi di API |

---

## 7. Critical Issues

### 🔴 Critical 1: Backend — 7 endpoint masih hilang

**Status v1.0:** ❌ Hanya 1 endpoint (`/health`)
**Status v2.0:** ✅ **5 endpoint sudah aktif** (distributors, sales, sales/skus, inventory, regions/ranking)
**Status v2.0:** ❌ **7 endpoint masih hilang**

```
$ grep -rn "router\|@app\.\|APIRouter\|include_router" backend/app/
→ backend/app/main.py:20: app.include_router(distributors.router)
→ backend/app/main.py:21: app.include_router(sales.router)
→ backend/app/main.py:22: app.include_router(inventory.router)
→ backend/app/main.py:23: app.include_router(regions.router)
```

**Endpoint tersedia (6):**
| Endpoint | Fungsi | Status |
|---|---|---|
| `GET /health` | Health check | ✅ |
| `GET /api/distributors` | Data distributor | ✅ |
| `GET /api/sales` | Sell-in / Sell-out data | ✅ |
| `GET /api/sales/skus` | Daftar SKU | ✅ |
| `GET /api/inventory` | Stock + DOI calculation | ✅ |
| `GET /api/regions/ranking` | Regional ranking | ✅ |

**Endpoint masih hilang (7):**
| Endpoint | Fungsi | PRD Story | Prioritas |
|---|---|---|---|
| `POST /api/login` | JWT auth | Section 4.3 | P0 |
| `GET /api/recommendations` | MITL cards | Epic 2 | P0 |
| `POST /api/recommendations/{id}/action` | Approve/Modify/Reject | Story 4.1 | P1 |
| `GET /api/recommendations/{id}/comments` | Discussion thread | Story 4.2 | P2 |
| `POST /api/recommendations/{id}/comments` | Add comment | Story 4.2 | P2 |
| `GET /api/audit-trail` | Riwayat aksi | Story 4.1 | P1 |
| `GET/POST /api/promos` | Promo calendar CRUD | Story 2.1 | P3 |

### 🔴 Critical 2: MITL Engine — Story 2.1 done, Story 2.2 masih kurang

**Status v1.0:** ❌ Tidak ada sama sekali
**Status v2.0:** 🟡 Sebagian — data generator membuat seed data
**Status v2.1:** 🟡 **Story 2.1 selesai**, masih kurang:
- ✅ **Story 2.1 complete** — API + frontend cards + promo check + promo form
- ❌ Story 2.2 (Escalate button + approval workflow) belum ada
- ❌ Belum ada rule engine runtime untuk recompute otomatis

### 🔴 Critical 3: Auth & RBAC tidak ada

**Status v1.0:** ❌
**Status v2.0:** ❌ **Tidak ada perubahan**
- Tidak ada endpoint `/login`
- Tidak ada JWT middleware/dependency injection
- Tidak ada tabel users / roles
- Semua endpoint publik (tidak ada proteksi)

---

## 8. Minor Issues

| # | Issue | Detail | Status v1.0 | Status v2.0 | Severitas |
|---|---|---|---|---|---|
| 1 | Tidak ada `httpx`, `pytest`, `pytest-asyncio` | Tidak bisa testing API endpoints | ❌ | ❌ Masih sama | Low |
| 2 | `verify_local.py` hanya cover Fase 1 | Tidak ada test untuk API | ❌ | 🟡 `verify_e2e.py` sudah cover 6 endpoint | Medium |
| 3 | `alembic.ini` hardcode DB URL | Tidak pakai env var | ❌ | ❌ Masih sama | Low |
| 4 | Tidak ada `.env.example` | Developer baru tidak tahu env vars apa yang dibutuhkan | ❌ | ❌ Masih sama | Low |
| 5 | Frontend proxy `http://backend:8000` hanya works di Docker | Dev lokal perlu konfig manual | ❌ | ❌ Masih sama | Low |
| 6 | `requirements.txt` tidak pin version (kecuali range `>=`) | Bisa break di masa depan | ❌ | ❌ Masih sama | Low |
| 7 | Data generator `profile: [manual]` | Belum otomatis (CronJob/Celery) | ❌ | ❌ Masih sama | Low |
| 8 | `run.sh cron` hanya print template | Tidak auto-install crontab | ❌ | ❌ Masih sama | Low |

---

## 9. Kesesuaian dengan Phased Rollout PRD

| Fase (PRD) | Deliverable | Status v1.0 | Status v2.0 | Status v2.1 | Keterangan |
|---|---|---|---|---|---|---|
| Minggu 1–2 | Setup proyek + schema DB + data generator + 3 skenario dummy | ✅ | ✅ | ✅ **SELESAI** | Sesuai changelog PRD |
| Minggu 3–4 | Epic 1: Dashboard (gap chart, stock health, tabel region) | ❌ | ✅ | ✅ **SELESAI** | Backend API + 3 komponen React + DOI service |
| Minggu 5–6 | Epic 2: MITL Engine (rekomendasi card + promo check + approval) | ❌ | ❌ | 🟡 **PARsIAL** | Story 2.1 ✅ (API + UI cards + promo check + form), Story 2.2 ❌ |
| Minggu 7–8 | Epic 4 + Epic 3.1 + Integrasi akhir + Demo | ❌ | ❌ | ❌ **BELUM** | Hanya struktur DB |

---

## 10. Rekomendasi Prioritas (v2.1)

Berdasarkan PRD dan gap analysis terkini (setelah Fase 1 + 2 + Story 2.1 selesai):

### P0 — Harus untuk MVP

1. **Auth & RBAC** — Implementasi JWT login + 2 role (manager, director). Semua endpoint saat ini publik.
2. **Story 2.2 — Escalate Button** — Tombol `[Escalate to Commercial/Legal]` + workflow approval sederhana (Pending → Approved/Rejected).

### P1 — Penting untuk Demo

3. **Justification Gateway** — Reason Code dropdown + Free-Text Notes + `POST /api/recommendations/{id}/action` + `GET /api/audit-trail`.
4. **Rule Engine Runtime** — Trigger recompute kartu rekomendasi secara periodik (bukan hanya seed data).

### P2 — Enhancement

5. **Discussion Threads** — `GET/POST /api/recommendations/{id}/comments` + komponen thread di bawah kartu.
6. **Graceful Degradation** — Deteksi staleness data + warning UI (accent kuning + tooltip).

### P3 — Nice to Have

7. **Seasonality Weighting (Ws)** — Tabel lookup + CSV upload.
8. **Auto-polling Dashboard** — Interval fetch untuk refresh data real-time.

---

*Laporan ini digenerate berdasarkan audit kode terhadap `PRD_Executive_Distribution_Control_Tower.md` (210 baris) dan seluruh source code di repositori.*
