# PRODUCT REQUIREMENT DOCUMENT (PRD)

**Project Name:** Executive Distribution Control Tower (FMCG Edition)
**Target Audience:** C-Level, National Sales Manager, Supply Chain Director
**Phase:** MVP (Minimum Viable Product)
**Tech Stack:** React + Python (FastAPI) + PostgreSQL
**Timeline:** 1–2 bulan (tim kecil: 1–3 developer)
**Status:** Draf — Living Document

---

## Changelog

| Tanggal | Pengubah | Ringkasan Perubahan | Alasan |
|---|---|---|---|
| 2026-06-19 | — | Dokumen inisial | — |
| 2026-06-19 | opencode | Fase 1: inisiasi proyek, schema DB (8 tabel), data generator, 3 skenario dummy, Docker Compose | Eksekusi MVP tahap infrastruktur |
| 2026-06-20 | opencode | Fase 2: backend API layer (sales, inventory, distributors, regions) + DOI logic + frontend dashboard (grafik, stock health, regional table) | Eksekusi Epic 1 Executive Dashboard |
| 2026-06-20 | opencode | Story 2.1: backend API recommendations + promo calendar + MITL card component + promo form (AC 2.1.1, 2.1.2, 2.1.3) | Eksekusi Epic 2 MITL Engine — tahap rekomendasi + promo check |
| 2026-06-21 | opencode | ROADMAP.md + STATE.md + traceability: roadmap per-story dengan branch strategy (5 phase pending) | Perencanaan sisa MVP — tiap story di branch terpisah |
| 2026-06-21 | opencode | Phase 4: Auth & RBAC — User model, migration, seed data, JWT login, auth middleware, login page + AuthContext | Eksekusi Phase 4 Auth & RBAC di branch `story-auth` |
| 2026-06-21 | opencode | Fix: data generator incremental — setiap run lanjut dari tanggal terakhir + baca inventory terakhir. Data terakumulasi, tidak di-replace | Bug fix Phase 1 gap — `fix-data-generator-reentrant` |
| 2026-06-25 | opencode | Phase 7: Story 4.2 — Discussion Thread (GET/POST comments, @mention → notification, CommentModal) | Eksekusi Epic 4 Contextual Collaboration — discussion thread |
| 2026-06-25 | opencode | Phase 8: Story 3.1 — Graceful Degradation (staleness endpoint, yellow accent + tooltip on stale data) | Eksekusi Epic 3 Data Governance — graceful degradation |
| 2026-06-24 | opencode | Phase 6: Story 4.1 — Justification Gateway (Reason Code + Notes gate, audit trail API, panel review) | Eksekusi Epic 4 Contextual Collaboration — justification gateway |
| 2026-06-25 | opencode | Phase 7: Story 4.2 — Discussion Thread (GET/POST comments, @mention → notification, CommentModal) | Eksekusi Epic 4 Contextual Collaboration — discussion thread |

---

## 1. Executive Summary

### Problem Statement

Manajemen _principal_ FMCG butuh waktu berminggu-minggu untuk mendeteksi ketimpangan distribusi (_channel stuffing_, _stockout_) karena data _sell-in_ dan _sell-out_ tersebar di sistem terpisah. Keputusan logistik sering diambil tanpa visibilitas _real-time_, menyebabkan kerugian akibat barang kedaluwarsa atau hilangnya potensi penjualan.

### Proposed Solution

Pusat komando taktis berbasis web yang menyajikan perbandingan _Sell-in vs Sell-out_ secara instan dalam satu dasbor, dilengkapi **Man-in-the-Loop Smart Recommendation Engine** yang memberikan rekomendasi kolaboratif–finansial (bukan instruksi searah) dengan mempertimbangkan biaya logistik, kalender promo, dan kedaulatan distributor independen.

### Key Success Metrics (KPI)

| Metrik | Target MVP |
|---|---|
| **Time-to-Decision Reduction** | Dari ±1 minggu menjadi ≤30 menit untuk deteksi + respons anomali distribusi |
| **Action Implementation Rate** | ≥60% rekomendasi sistem dieksekusi atau dimodifikasi oleh manajer |
| **Data Visibility Coverage** | 100% distributor dummy (3 skenario) dapat dipantau dalam 1 dasbor |
| **MITL Gate Compliance** | 100% aksi Modify/Reject wajib diiringi Reason Code + Free-Text Notes |

---

## 2. User Experience & Functionality

### User Personas

| Persona | Peran Utama | Kebutuhan Utama di Aplikasi |
|---|---|---|
| **National Sales Manager** | Menggenjot volume penjualan & memantau performa distributor | Melihat wilayah _underperform_, mengintervensi distributor yang nakal/pasif |
| **Supply Chain Director** | Menjaga keseimbangan kapasitas pabrik dengan stok lapangan | Memantau _stock aging_, mengatur alokasi stok antar wilayah |

### User Stories & Acceptance Criteria

#### Epic 1: Executive Dashboard (The Command Center)

**Story 1.1 — Sell-In vs Sell-Out Gap Chart**
> Sebagai National Sales Manager, saya ingin melihat grafik perbandingan _sell-in_ dan _sell-out_ sehingga saya bisa mendeteksi _channel stuffing_ secara instan.

- [AC 1.1.1] Grafik garis waktu (line chart) menampilkan 2 series: `Sell-In (dikirim ke distributor)` vs `Sell-Out (terjual ke toko)` per bulan.
- [AC 1.1.2] Filter waktu: Bulanan, Kuartal. Filter SKU: dropdown kategori produk.
- [AC 1.1.3] Data diperbarui dalam ≤5 detik setelah _data generator_ menyelesaikan siklus simulasi.

**Story 1.2 — Stock Health Tracker**
> Sebagai Supply Chain Director, saya ingin melihat status stok di seluruh gudang distributor dengan indikator warna sehingga saya bisa mengantisipasi risiko _overstock_ atau _stockout_.

- [AC 1.2.1] Kartu stok per distributor menampilkan indikator:
  - 🔴 _Overstock_ (DOI > 30 hari)
  - 🟢 _Healthy Stock_ (DOI 14–30 hari)
  - 🟡 _Understock / OOS Risk_ (DOI < 14 hari)
- [AC 1.2.2] DOI dihitung menggunakan rumus: `Current Inventory / Seasonally Adjusted Forecasted Daily Demand`.

**Story 1.3 — Regional Penetration Map (Ditunda)**
> ❌ **OUT OF SCOPE MVP.** Fitur peta interaktif Indonesia tidak masuk rilis pertama. Akan diganti dengan tabel ranking region sederhana berdasarkan volume _sell-out_.

#### Epic 2: Man-in-the-Loop (MITL) Smart Recommendation Engine

**Story 2.1 — The Financial & Commercial-Aware Card**
> Sebagai National Sales Manager, saya ingin kartu rekomendasi sistem memeriksa kalender promo sehingga saya tidak memotong alokasi _sell-in_ menjelang promo _Modern Trade_.

- [AC 2.1.1] Setiap kartu rekomendasi mengecek **Promo/JBP Calendar Index**.
- [AC 2.1.2] Jika ada promo MT dalam 30 hari ke depan, kartu menampilkan tag `[DO NOT CUT ALLOCATION - PROMO PREP]` dan tombol pengurangan alokasi _sell-in_ dinonaktifkan.
- [AC 2.1.3] Data promo diisi manual melalui form backend sederhana (CSV upload atau input langsung).

**Story 2.2 — Refactored Action Button (Simplified Workflow)**
> Sebagai Supply Chain Director, saya ingin men-_trigger_ koordinasi lintas distributor ketika satu wilayah kelebihan stok dan wilayah lain kekurangan.

- [AC 2.2.1] Tombol `[Escalate to Commercial/Legal]` tersedia di kartu rekomendasi.
- [AC 2.2.2] Sistem membuat **tiket** notifikasi sederhana (status: `Pending → Approved/Rejected`) ke dashboard _Commercial Director_ untuk di-approve.
- [AC 2.2.3] Tidak ada integrasi email otomatis — notifikasi cukup di dalam aplikasi (in-app notification).

#### Epic 3: Data Governance & UI Mitigation

**Story 3.1 — Graceful Degradation on UI**
> Sebagai pengguna, saya ingin UI tetap berfungsi dan memberi peringatan ketika data distributor terlambat sehingga saya tidak mengambil keputusan dalam keadaan buta.

- [AC 3.1.1] Jika data distributor tidak masuk >12 jam, aksen UI berubah menjadi kuning di area yang terpengaruh.
- [AC 3.1.2] _Tooltip_ muncul: _"Peringatan: Data Sell-Out [Wilayah] menggunakan estimasi proyeksi H-1. Keputusan logistik harap memperhitungkan margin of error."_

**Story 3.2 — Manual Override untuk Ws (DITUNDA)**
> ❌ **OUT OF SCOPE MVP.** Fitur penggeser bobot parameter (_Market Condition Adjustment_) tidak masuk rilis pertama.

#### Epic 4: Contextual Collaboration & Audit Trail

**Story 4.1 — The Justification Gateway**
> Sebagai National Sales Manager, saya wajib mengisi alasan ketika memodifikasi atau menolak rekomendasi sehingga ada jejak audit yang jelas.

- [AC 4.1.1] Tombol Modify/Reject terkunci (_gated_) sampai Reason Code dipilih dari dropdown:
  1. Logistics / Force Majeure
  2. Commercial Strategy
  3. Market Shock
  4. Data Accuracy Doubt
- [AC 4.1.2] Wajib mengisi _Free-Text Notes_ (min 10 karakter) sebelum eksekusi.
- [AC 4.1.3] Riwayat aksi tersimpan di tabel `audit_trail` dan bisa dilihat di panel review.

**Story 4.2 — In-Context Discussion Thread (Simplified)**
> Sebagai Supply Chain Director, saya ingin berdiskusi singkat dengan NSM di dalam kartu rekomendasi sehingga keputusan bisa diambil cepat tanpa aplikasi chat terpisah.

- [AC 4.2.1] Di bagian bawah setiap kartu terdapat _thread_ komentar (flat, tanpa nested reply).
- [AC 4.2.2] Mention user dengan format `@username` — menampilkan notifikasi (tanpa email).
- [AC 4.2.3] Tidak ada tagging dengan pertanyaan preset (cukup free-text biasa).

### Non-Goals (Out of Scope — MVP)

- Peta penetrasi regional interaktif (Fitur 1.3)
- Manual Override untuk Ws / Market Condition Adjustment (Fitur 3.2)
- Workflow approval dengan approval chain multi-level yang kompleks (cukup 1 level approve/reject)
- Integrasi email/SMS/WhatsApp notification
- Autentikasi SSO atau RBAC kompleks (cukup login dasar + role: Manager, Director)
- Deployment production-grade (cukup docker-compose di VPS tunggal)

---

## 3. AI System Requirements (MITL Engine)

### Tool Requirements

| Komponen | Keterangan |
|---|---|
| **Rule-based Recommendation Engine** | Tidak menggunakan ML/model AI. Cukup logika kondisional: `IF (sell_in - sell_out) > threshold THEN generate card` |
| **Seasonality Weighting (Ws)** | Faktor pengali dari tabel lookup musiman (diisi manual via CSV oleh tim bisnis) |
| **Promo Calendar Check** | Cek tabel `promo_calendar` — query `WHERE region = X AND start_date <= now()+30 days` |

### Evaluation Strategy

| Kriteria | Target MVP |
|---|---|
| **Recommendation Precision** | Rekomendasi yang muncul harus sesuai dengan kondisi data (tidak ada _false positive_ alert) |
| **DOI Accuracy** | Selisih DOI kalkulasi vs data historis < 10% |
| **Gate Logging Completeness** | 100% aksi gate (Modify/Reject) tercatat di `audit_trail` |

---

## 4. Technical Specifications

### Architecture Overview

```
[React Frontend] ──HTTP/WS──> [FastAPI Backend] ──> [PostgreSQL]
                                    │
                                    └──> [Data Generator Script] (simulasi periodik)
```

- **Frontend:** React + Vite + Tailwind CSS. Layout 3-bilah (sidebar, main workspace, tactic panel).
- **Backend:** Python FastAPI, async endpoints, Pydantic validasi.
- **Database:** PostgreSQL dengan schema: `distributors`, `sku_catalog`, `daily_sales`, `inventory_snapshots`, `promo_calendar`, `recommendation_cards`, `audit_trail`, `comments`.
- **Data Generator:** Script Python (CronJob atau Celery Beat) yang menjalankan 3 skenario (Normal, Channel Stuffing, Stockout) secara bergiliran.

### Integration Points

| Integrasi | Pendekatan MVP |
|---|---|
| **Auth** | JWT sederhana (login via username/password), 2 role: `manager` dan `director` |
| **Database** | FastAPI + SQLAlchemy async + Alembic migration |
| **Hosting** | Docker Compose di VPS tunggal (DigitalOcean/AWS EC2 $12–$24/bln) |

### Security & Privacy

- Semua data bersifat dummy/simulasi — tidak ada PII.
- Password di-hash dengan bcrypt.
- Semua endpoint API dilindungi JWT (kecuali `/login`, `/docs`).

---

## 5. Risks & Roadmap

### Phased Rollout

| Fase | Durasi | Deliverable |
|---|---|---|
| **Minggu 1–2** | 2 minggu | Setup proyek + schema DB + data generator + 3 skenario dummy |
| **Minggu 3–4** | 2 minggu | Epic 1: Executive Dashboard (gap chart, stock health, tabel region) |
| **Minggu 5–6** | 2 minggu | Epic 2: MITL Engine (rekomendasi card + promo check + simplified approval) |
| **Minggu 7–8** | 2 minggu | Epic 4: Collaboration (justification gateway, discussion thread) + Epic 3.1 Graceful Degradation + Integrasi akhir + Demo |

### Technical Risks

| Risiko | Dampak | Mitigasi |
|---|---|---|
| **Data generator tidak realistis** | Demo tidak meyakinkan | Libatkan domain expert FMCG untuk validasi skenario dummy |
| **Estimasi DOI meleset karena data musiman minim** | Rekomendasi kurang akurat | Gunakan tabel lookup Ws yang bisa diisi manual; jangan otomatis |
| **Tim 1–3 dev kewalahan** | Jadwal molor | Prioritaskan Epic 1 & 2; Epic 4 disederhanakan (comment flat, tanpa notification real-time) |

---

## Traceability

| Requirement | Phase | Branch | Status |
|-------------|-------|--------|--------|
| Infrastruktur (Docker, DB, schema, 8 tabel) | Phase 1 | `main` | ✅ Complete |
| Data Generator (3 skenario, 5 distributor, 5 SKU) | Phase 1 | `main` | ✅ Complete |
| Story 1.1 — Sell-In vs Sell-Out Gap Chart | Phase 2 | `main` | ✅ Complete |
| Story 1.2 — Stock Health Tracker (DOI) | Phase 2 | `main` | ✅ Complete |
| Story 1.3 — Regional Ranking Table | Phase 2 | `main` | ✅ Complete |
| Story 2.1 — Promo-Aware Recommendation Cards | Phase 3 | `story-2.1` | ✅ Complete |
| Auth & RBAC (JWT, 2 role, bcrypt) — Section 4.3 | Phase 4 | `story-auth` | ✅ Complete |
| Story 2.2 — Escalate to Commercial/Legal | Phase 5 | `story-2.2` | ✅ Complete |
| Story 4.1 — Justification Gateway (Reason Code + Notes) | Phase 6 | `story-4.1` | ✅ Complete |
| Story 4.2 — In-Context Discussion Thread | Phase 7 | `story-4.2` | ✅ Complete |
| Story 3.1 — Graceful Degradation on UI | Phase 8 | `story-3.1` | ✅ Complete |

**Coverage:** 11/11 v1 requirements mapped ✓ | **Completed:** 11/11 | **Pending:** 0/11

---

## Lampiran & Tautan

> - Figma Mockup: `TBD`
> - Skema Database: `backend/alembic/versions/001_initial_schema.py`
> - Data Generator Script: `backend/data_generator/`
> - Docker Compose: `docker-compose.yml`
> - Struktur Proyek: lihat `run.sh` untuk panduan menjalankan
