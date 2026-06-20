# Laporan Audit Implementasi vs PRD

**Proyek:** Executive Distribution Control Tower (FMCG Edition)
**PRD Referensi:** `PRD_Executive_Distribution_Control_Tower.md`
**Tanggal Audit:** 2026-06-20
**Auditor:** opencode

---

## Ringkasan Eksekutif

| Fase | Progress | PRD Reference |
|---|---|---|
| Fase 1 (Infrastruktur + DB + Data Generator) | **100%** | Minggu 1–2 |
| Fase 2 (Executive Dashboard — Epic 1) | **0%** | Minggu 3–4 |
| Fase 3 (MITL Engine — Epic 2) | **~10%** | Minggu 5–6 |
| Fase 4 (Kolaborasi + Data Governance — Epic 3.1 + Epic 4) | **~5%** | Minggu 7–8 |
| Security & Auth (Section 4.3) | **0%** | Section 4.3 |
| AI/MITL Engine Rule (Section 3) | **~15%** | Section 3 |
| **OVERALL** | **~25%** | — |

**Temuan Utama:** Proyek hanya menyelesaikan Fase 1 (infrastructure, database schema, data generator). Seluruh fungsionalitas bisnis — dashboard, MITL cards, kolaborasi, auth, graceful degradation — belum diimplementasikan. Backend hanya punya 1 endpoint (`/health`), frontend hanya menampilkan layout statis.

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

## 2. Fase 2: Executive Dashboard (Epic 1) — 0%

### Story 1.1 — Sell-In vs Sell-Out Gap Chart

| Acceptance Criteria | Status | Detail |
|---|---|---|
| [AC 1.1.1] Line chart 2 series (Sell-In vs Sell-Out) per bulan | ❌ | Hanya placeholder `<div>` di `App.jsx:34`: `"Sell-In vs Sell-Out Gap Chart (Fase 2 — Epic 1)"` |
| [AC 1.1.2] Filter waktu (Bulanan, Kuartal) + dropdown SKU | ❌ | Tidak ada |
| [AC 1.1.3] Data refresh ≤5 detik setelah siklus data generator | ❌ | Tidak ada data fetching ke backend |

**Dampak:** Core visualization aplikasi tidak ada. Tanpa grafik gap, National Sales Manager tidak bisa deteksi channel stuffing.

### Story 1.2 — Stock Health Tracker

| Acceptance Criteria | Status | Detail |
|---|---|---|
| [AC 1.2.1] Kartu stok per distributor + indikator warna (🔴🟢🟡) | ❌ | Tidak ada di frontend |
| [AC 1.2.2] DOI = Current Inventory / Seasonally Adjusted Forecasted Daily Demand | ❌ | **Tidak ada logika DOI** di mana pun — baik backend, data generator, maupun frontend |

**Dampak:** Supply Chain Director tidak bisa memantau risiko overstock/stockout.

### Story 1.3 — Regional Penetration Map (OUT OF SCOPE MVP)

| Acceptance Criteria | Status | Detail |
|---|---|---|
| Tabel ranking region sederhana (pengganti peta) | ❌ | Tidak ada. Sidebar punya link "Regional Reports" tapi tidak ada konten. |

**Catatan:** PRD secara eksplisit menandai peta interaktif sebagai _out of scope_ dan menyatakan akan diganti tabel ranking region. Tabel ini juga belum dibuat.

### Root Cause — Fase 2

- **Backend:** Tidak ada router/endpoint untuk data sales (`/api/sales`), inventory (`/api/inventory`), maupun distributors (`/api/distributors`)
- **Frontend:** Tidak ada dependency chart library (recharts, chart.js, d3) di `package.json`
- **Frontend:** Tidak ada komponen React fungsional — hanya `App.jsx` dengan layout statis

---

## 3. Fase 3: MITL Smart Recommendation Engine (Epic 2) — ~10%

### Story 2.1 — Financial & Commercial-Aware Card

| Acceptance Criteria | Status | Detail |
|---|---|---|
| [AC 2.1.1] Promo/JBP Calendar Index check | ❌ | Tabel `promo_calendar` exist + data generator create 1 promo row. Namun **tidak ada API endpoint** untuk query promo dari frontend. |
| [AC 2.1.2] Tag `[DO NOT CUT ALLOCATION - PROMO PREP]` + tombol disabled | ❌ | Tidak ada implementasi |
| [AC 2.1.3] Form input promo manual (CSV upload / input langsung) | ❌ | Tidak ada |

### Story 2.2 — Escalate to Commercial/Legal

| Acceptance Criteria | Status | Detail |
|---|---|---|
| [AC 2.2.1] Tombol `[Escalate to Commercial/Legal]` di kartu rekomendasi | ❌ | Tidak ada |
| [AC 2.2.2] Tiket notifikasi (status: Pending → Approved/Rejected) | ❌ | Tidak ada |
| [AC 2.2.3] In-app notification only (tanpa email) | ❌ | Tidak ada |

### Yang Sudah Ada (Partial)

Data generator (`generator.py`) sudah membuat `RecommendationCard` berdasarkan kondisi:
- **Channel Stuffing scenario:** `recommendation_type="overstock"`, severity `"high"`
- **Stockout scenario:** `recommendation_type="stockout"`, severity `"high"`
- **Normal scenario:** `recommendation_type="channel_stuffing"`, severity `"medium"`

Ini adalah seed data yang siap ditampilkan, tapi:
1. ❌ Tidak ada API endpoint untuk serve data ini ke frontend
2. ❌ Tidak ada komponen kartu rekomendasi di frontend
3. ❌ Tidak ada logic promo calendar check di backend API

---

## 4. Fase 4: Data Governance & Collaboration (Epic 3.1 + Epic 4) — ~5%

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

### 🔴 Critical 1: Backend hanya punya 1 endpoint

```
$ grep -rn "router\|@app\.\|APIRouter\|include_router" backend/app/
→ backend/app/main.py:19: @app.get("/health")  # SATU-SATUNYA ENDPOINT
```

**Endpoint yang hilang (wajib untuk MVP):**

| Endpoint | Fungsi | PRD Story |
|---|---|---|
| `POST /api/login` | JWT auth | Section 4.3 |
| `GET /api/distributors` | Data distributor | Epic 1 |
| `GET /api/sales` | Sell-in / Sell-out data | Story 1.1 |
| `GET /api/inventory` | Stock + DOI calculation | Story 1.2 |
| `GET /api/recommendations` | MITL cards | Epic 2 |
| `POST /api/recommendations/{id}/action` | Approve/Modify/Reject | Story 4.1 |
| `GET /api/recommendations/{id}/comments` | Discussion thread | Story 4.2 |
| `POST /api/recommendations/{id}/comments` | Add comment | Story 4.2 |
| `GET /api/audit-trail` | Riwayat aksi | Story 4.1 |
| `GET/POST /api/promos` | Promo calendar CRUD | Story 2.1 |

### 🔴 Critical 2: Frontend adalah shell statis

- Tidak ada data fetching (kecuali `/api/health`)
- Tidak ada chart library di dependencies
- Tidak ada komponen fungsional
- Tidak ada routing (react-router)

### 🔴 Critical 3: DOI calculation tidak ada

PRD mensyaratkan `DOI = Current Inventory / Seasonally Adjusted Forecasted Daily Demand`. Logika ini tidak ada di mana pun — baik di backend API, data generator, maupun model.

### 🔴 Critical 4: Auth & RBAC tidak ada

Aplikasi saat ini tidak memiliki login, tidak ada session, tidak ada role distinction antara Manager dan Director.

---

## 8. Minor Issues

| # | Issue | Detail | Severity |
|---|---|---|---|
| 1 | Tidak ada `httpx`, `pytest`, `pytest-asyncio` | Tidak bisa testing API endpoints | Low |
| 2 | `verify_local.py` hanya cover Fase 1 | Tidak ada test untuk API | Low |
| 3 | `alembic.ini` hardcode DB URL | Tidak pakai env var | Low |
| 4 | Tidak ada `.env.example` | Developer baru tidak tahu env vars apa yang dibutuhkan | Low |
| 5 | Frontend proxy `http://backend:8000` hanya works di Docker | Dev lokal perlu konfig manual | Low |
| 6 | Tidak ada `package-lock.json` di repo | Reproducible build risk | Low |
| 7 | `requirements.txt` tidak pin version (kecuali range `>=`) | Bisa break di masa depan | Low |

---

## 9. Kesesuaian dengan Phased Rollout PRD

| Fase (PRD) | Deliverable | Status | Keterangan |
|---|---|---|---|
| Minggu 1–2 | Setup proyek + schema DB + data generator + 3 skenario dummy | ✅ **SELESAI** | Sesuai changelog PRD |
| Minggu 3–4 | Epic 1: Dashboard (gap chart, stock health, tabel region) | ❌ **BELUM** | Tidak ada implementasi |
| Minggu 5–6 | Epic 2: MITL Engine (rekomendasi card + promo check + approval) | ❌ **BELUM** | Hanya seed data, tidak ada serving |
| Minggu 7–8 | Epic 4 + Epic 3.1 + Integrasi akhir + Demo | ❌ **BELUM** | Hanya struktur DB |

---

## 10. Rekomendasi Prioritas

Berdasarkan PRD dan gap analysis:

1. **P0: Backend API Layer** — Buat semua endpoint REST (auth, sales, inventory, recommendations, promos, audit trail, comments)
2. **P0: Auth & RBAC** — Implementasi JWT login + 2 role (manager, director)
3. **P0: Frontend Dashboard** — Komponen grafik (Sell-In vs Sell-Out) + Stock Health cards dengan DOI
4. **P1: MITL Cards** — Tampilkan recommendation cards dengan promo check logic
5. **P1: Justification Gateway** — Reason Code dropdown + Free-Text Notes + audit trail save
6. **P2: Discussion Threads** — Komentar per kartu rekomendasi
7. **P2: Escalate Button** — Workflow approval sederhana
8. **P3: Graceful Degradation** — Warning UI jika data stale
9. **P3: Seasonality Weighting (Ws)** — Tabel lookup + CSV upload
10. **P3: Promo Calendar Form** — Input promo manual di backend

---

*Laporan ini digenerate berdasarkan audit kode terhadap `PRD_Executive_Distribution_Control_Tower.md` (210 baris) dan seluruh source code di repositori.*
