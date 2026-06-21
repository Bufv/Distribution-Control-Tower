# ROADMAP — Executive Distribution Control Tower

## Overview

Pusat komando taktis FMCG berbasis web yang menyajikan perbandingan Sell-in vs Sell-out secara instan dengan Man-in-the-Loop Smart Recommendation Engine. Roadmap ini dibagi per-story, masing-masing dikerjakan di branch terpisah.

**Depth:** Standard (8 phases — 3 completed, 5 pending)
**Coverage:** 8/8 phases mapped ✓
**Overall Progress:** ~65%

---

## Phase 1: Infrastructure & Data Layer

**Status:** ✅ COMPLETE (100%)
**Branch:** `main`
**Timeline:** Minggu 1–2

**Goal:** Foundation proyek siap — database, data generator, Docker Compose berjalan.

**Requirements:** Infrastruktur (React + Vite + Tailwind, FastAPI, PostgreSQL, Docker Compose, 8 tabel database, 3 skenario data generator, 5 distributor + 5 SKU, Nginx reverse proxy, run.sh)

**Success Criteria:**
1. `docker compose up` menjalankan 4 service (db, backend, frontend, data-generator)
2. 8 tabel database terbuat via Alembic migration
3. Data generator menghasilkan 3 skenario (Normal, Channel Stuffing, Stockout) secara round-robin
4. Frontend React dapat diakses via browser di port 80

---

## Phase 2: Executive Dashboard — Epic 1

**Status:** ✅ COMPLETE (100%)
**Branch:** `main`
**Timeline:** Minggu 3–4

**Goal:** National Sales Manager dan Supply Chain Director dapat memantau performa distribusi dalam satu dasbor.

**Requirements:**
- Story 1.1 — Sell-In vs Sell-Out Gap Chart (AC 1.1.1, 1.1.2, 1.1.3)
- Story 1.2 — Stock Health Tracker (AC 1.2.1, 1.2.2)
- Story 1.3 — Regional Ranking Table (pengganti peta)

**Success Criteria:**
1. Line chart menampilkan 2 series Sell-In vs Sell-Out dengan filter waktu dan SKU
2. Kartu stok per distributor menampilkan indikator warna (🔴🟢🟡) berdasarkan DOI
3. Tabel ranking region menunjukkan peringkat wilayah berdasarkan volume sell-out

---

## Phase 3: MITL Engine — Story 2.1 (Promo-Aware Cards)

**Status:** ✅ COMPLETE (100%)
**Branch:** `story-2.1`
**Timeline:** Minggu 5–6 (parsial)

**Goal:** Kartu rekomendasi sistem memeriksa kalender promo sebelum menyarankan pengurangan alokasi.

**Requirements:**
- Story 2.1 — Financial & Commercial-Aware Card (AC 2.1.1, 2.1.2, 2.1.3)

**Success Criteria:**
1. Setiap kartu rekomendasi mengecek Promo/JBP Calendar Index
2. Jika ada promo MT dalam 30 hari, tag `[DO NOT CUT ALLOCATION - PROMO PREP]` muncul dan tombol pengurangan alokasi dinonaktifkan
3. Data promo dapat diisi manual melalui form/POST API

---

## Phase 4: Auth & RBAC

**Status:** ⏳ PENDING
**Branch:** `story-auth`
**Dependencies:** `main`
**Timeline:** Setelah approval roadmap

**Goal:** Pengguna dapat login/logout dengan role-based access control.

**Requirements:**
- Section 4.3 — JWT authentication, 2 role (manager, director), bcrypt, endpoint protection

**Success Criteria:**
1. User dapat login via username/password dan menerima JWT token
2. Role `manager` dan `director` memiliki akses berbeda
3. Semua endpoint API (kecuali `/login`, `/docs`) dilindungi JWT dependency
4. Password di-hash dengan bcrypt (`passlib`)
5. Halaman login di frontend dengan redirect setelah sukses

---

## Phase 5: MITL Engine — Story 2.2 (Escalate to Commercial/Legal)

**Status:** ⏳ PENDING
**Branch:** `story-2.2`
**Dependencies:** `story-auth`
**Timeline:** Setelah Auth selesai

**Goal:** Supply Chain Director dapat men-trigger koordinasi lintas distributor ketika satu wilayah kelebihan stok dan wilayah lain kekurangan.

**Requirements:**
- Story 2.2 — Refactored Action Button (AC 2.2.1, 2.2.2, 2.2.3)

**Success Criteria:**
1. Tombol `[Escalate to Commercial/Legal]` tersedia di kartu rekomendasi
2. Sistem membuat tiket notifikasi dengan status `Pending → Approved/Rejected`
3. Dashboard Commercial Director menampilkan tiket pending untuk di-approve/reject
4. Notifikasi cukup di dalam aplikasi (in-app) — tanpa email

---

## Phase 6: Justification Gateway — Story 4.1

**Status:** ⏳ PENDING
**Branch:** `story-4.1`
**Dependencies:** `story-2.2`
**Timeline:** Setelah Escalate selesai

**Goal:** Setiap aksi Modify/Reject terhadap rekomendasi memiliki jejak audit yang jelas.

**Requirements:**
- Story 4.1 — The Justification Gateway (AC 4.1.1, 4.1.2, 4.1.3)

**Success Criteria:**
1. Tombol Modify/Reject terkunci (_gated_) sampai Reason Code dipilih dari dropdown (4 pilihan)
2. Free-Text Notes wajib diisi min 10 karakter sebelum eksekusi
3. Riwayat aksi tersimpan di tabel `audit_trail` dan bisa dilihat di panel review
4. API endpoint `POST /api/recommendations/{id}/action` dan `GET /api/audit-trail`

---

## Phase 7: Discussion Thread — Story 4.2

**Status:** ⏳ PENDING
**Branch:** `story-4.2`
**Dependencies:** `story-2.2`
**Timeline:** Setelah Escalate selesai (bisa paralel dengan Story 4.1)

**Goal:** NSM dan Supply Chain Director dapat berdiskusi singkat di dalam kartu rekomendasi.

**Requirements:**
- Story 4.2 — In-Context Discussion Thread (AC 4.2.1, 4.2.2, 4.2.3)

**Success Criteria:**
1. Thread komentar flat (tanpa nested reply) di bagian bawah setiap kartu rekomendasi
2. Mention user dengan format `@username` mengirim notifikasi in-app
3. Free-text biasa tanpa tagging preset
4. API endpoint `GET/POST /api/recommendations/{id}/comments`

---

## Phase 8: Graceful Degradation — Story 3.1

**Status:** ⏳ PENDING
**Branch:** `story-3.1`
**Dependencies:** `main` (independen — bisa paralel dengan phase lain)
**Timeline:** Kapan saja (tidak memiliki dependency ke story lain)

**Goal:** UI tetap berfungsi dan memberi peringatan ketika data distributor terlambat.

**Requirements:**
- Story 3.1 — Graceful Degradation on UI (AC 3.1.1, 3.1.2)

**Success Criteria:**
1. Jika data distributor tidak masuk >12 jam, aksen UI berubah menjadi kuning di area yang terpengaruh
2. Tooltip muncul: "Peringatan: Data Sell-Out [Wilayah] menggunakan estimasi proyeksi H-1. Keputusan logistik harap memperhitungkan margin of error."

---

## Dependency Graph

```
main
├── story-auth  (Phase 4)
│   └── story-2.2  (Phase 5)
│       ├── story-4.1  (Phase 6)
│       └── story-4.2  (Phase 7)
└── story-3.1  (Phase 8 — independen, bisa paralel)
```

---

## Branch Strategy

| Branch | Base Branch | Phase | Status |
|--------|-------------|-------|--------|
| `main` | — | Phase 1, 2 | ✅ Complete |
| `story-2.1` | `main` | Phase 3 | ✅ Complete |
| `story-auth` | `main` | Phase 4 | ⏳ Pending |
| `story-2.2` | `story-auth` | Phase 5 | ⏳ Pending |
| `story-4.1` | `story-2.2` | Phase 6 | ⏳ Pending |
| `story-4.2` | `story-2.2` | Phase 7 | ⏳ Pending |
| `story-3.1` | `main` | Phase 8 | ⏳ Pending |

---

## Coverage Map

| Requirement | Phase | Status |
|-------------|-------|--------|
| Infrastructure (Docker, DB, schema) | Phase 1 | ✅ |
| Data Generator (3 skenario) | Phase 1 | ✅ |
| Story 1.1 — Gap Chart | Phase 2 | ✅ |
| Story 1.2 — Stock Health | Phase 2 | ✅ |
| Story 1.3 — Regional Table | Phase 2 | ✅ |
| Story 2.1 — Promo-Aware Cards | Phase 3 | ✅ |
| Auth & RBAC (Section 4.3) | Phase 4 | ⏳ |
| Story 2.2 — Escalate Button | Phase 5 | ⏳ |
| Story 4.1 — Justification Gateway | Phase 6 | ⏳ |
| Story 4.2 — Discussion Thread | Phase 7 | ⏳ |
| Story 3.1 — Graceful Degradation | Phase 8 | ⏳ |

**Coverage:** 11/11 v1 requirements mapped ✓
**Completed:** 6/11 ✓
**Pending:** 5/11 ⏳
