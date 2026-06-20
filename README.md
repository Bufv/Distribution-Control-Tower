# Executive Distribution Control Tower (FMCG Edition)

Pusat komando taktis bagi manajemen _principal_ FMCG untuk memantau pergerakan produk dari level distributor hingga ke _retailer_. Menyajikan perbandingan _Sell-In vs Sell-Out_ secara instan dengan **Man-in-the-Loop Smart Recommendation Engine**.

---

## Fitur Utama

- **Executive Dashboard** — Grafik gap Sell-In/Sell-Out, stock health tracker (indikator 🔴🟢🟡), ranking region
- **MITL Smart Recommendation Engine** — Kartu rekomendasi dengan pengecekan kalender promo
- **Justification Gateway + Audit Trail** — Reason code dropdown + free-text notes + riwayat aksi
- **3 Skenario Simulasi** — Normal, Channel Stuffing, Stockout (data generator round-robin)

## Tech Stack

| Layer | Teknologi |
|---|---|
| Frontend | React + Vite + Tailwind CSS + Recharts |
| Backend | Python FastAPI + SQLAlchemy async |
| Database | PostgreSQL 16 + Alembic migration |
| Infra | Docker Compose (VPS tunggal) |

## Cara Menjalankan

### Docker (production-like)

```bash
bash run.sh docker
```

Akses: `http://localhost` (frontend) — `http://localhost:8000/docs` (API Swagger)

### Development Lokal

```bash
bash run.sh dev      # FastAPI dev server (butuh PostgreSQL running)
bash run.sh seed     # Data generator sekali
bash run.sh verify   # Verifikasi E2E via SQLite
```

### Data Generator (CronJob)

```bash
bash run.sh cron
# lalu tambahkan ke crontab:
# */5 * * * * cd /path/to/project && docker compose run --rm data-generator
```

## Struktur Proyek

```
├── backend/
│   ├── app/               # FastAPI app
│   │   ├── models/        # 8 SQLAlchemy models
│   │   ├── routers/       # API endpoints (sales, inventory, dll)
│   │   └── services/      # DOI calculation logic
│   ├── alembic/           # Database migrations
│   ├── data_generator/    # 3 skenario dummy data
│   └── requirements.txt
├── frontend/
│   ├── src/
│   │   ├── components/    # React komponen dashboard
│   │   ├── App.jsx        # Layout 3-bilah
│   │   └── main.jsx
│   └── package.json
├── docker-compose.yml
├── Dockerfile.backend
├── Dockerfile.frontend
├── nginx.conf
├── run.sh
├── .env.example
└── docs/
    ├── PRD_Executive_Distribution_Control_Tower.md
    └── AUDIT_IMPLEMENTASI.md
```

## API Endpoints

| Method | Endpoint | Fungsi |
|---|---|---|
| GET | `/health` | Health check |
| GET | `/api/distributors` | Daftar distributor |
| GET | `/api/sales` | Sell-In vs Sell-Out (filter: period, sku_id) |
| GET | `/api/sales/skus` | Daftar SKU untuk filter |
| GET | `/api/inventory` | Stock health + DOI per distributor |
| GET | `/api/regions/ranking` | Ranking region by sell-out |

## Status Proyek

| Fase | Deliverable | Status |
|---|---|---|
| Minggu 1–2 | Infrastruktur + DB + Data Generator | ✅ Selesai |
| Minggu 3–4 | Executive Dashboard (Epic 1) | ✅ Selesai |
| Minggu 5–6 | MITL Engine (Epic 2) | ⏳ Belum |
| Minggu 7–8 | Kolaborasi + Data Governance (Epic 3.1 + Epic 4) | ⏳ Belum |

---

_Lihat [PRD lengkap](docs/PRD_Executive_Distribution_Control_Tower.md) untuk detail spesifikasi._
