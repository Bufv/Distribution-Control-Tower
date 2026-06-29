# Phase 11 — Data Integrity & Flow Rate Analysis

## Story 11.1: Verifier Cutoff Bug Fix

**Branch:** `fix/verifier-cutoff-bug`
**Status:** ✅ Complete (merged to main)

### Problem
Verifier di `backend/app/services/verifier.py:28` punya filter `executed_at < datetime.utcnow() - 365days` (cutoff). Karena timeline simulasi mulai dari 2026-01-01, cutoff ini **tidak pernah match** — sehingga verifier tidak pernah menyetel `verification_status` ke `verified` atau `missed`. Akibatnya, executed tactics memengaruhi data generator di semua run berikutnya secara permanen.

### Fix
1. Hapus `cutoff` dan filter `executed_at < cutoff` yang salah
2. Per-tactic `window_end > now` check sudah cukup sebagai timing mechanism
3. Hapus panggilan `run_verification_cycle()` redundant di `backend/data_generator/main.py:40-45`

### Files Changed
- `backend/app/services/verifier.py` — Hapus cutoff filter
- `backend/data_generator/main.py` — Hapus redundant verifier call

---

## Story 11.2: Inventory Realism Enhancement

**Branch:** `fix/flow-rate-analysis`
**Status:** ✅ Complete

### Problems
1. **Data inventory tidak sinkron:** `generate_inventory` mengalikan stok dengan `random.uniform(0.8, 1.0)`. Stok di DB (dibaca run berikutnya) selalu lebih rendah dari `running_inventory` di memory. Setiap run, stok menyusut artifisial.
2. **Stok cenderung naik terus:** `BASE_SELL_IN_RANGE = (80, 120)` mean 100 vs `BASE_SELL_OUT_RANGE = (70, 110)` mean 90. Untuk 20+ pasangan distributor-SKU tanpa parameter khusus di scenario, stok naik ~10 unit/hari secara probabilistik.
3. **Tactic adjustment tidak lengkap:** Hanya handle 2 dari 4+ kombinasi metric×direction.

### Fix
1. `generate_inventory` → `return base_stock` (tanpa factor 0.8–1.0)
2. `BASE_SELL_OUT_RANGE` → `(80, 120)` (sama dengan sell_in)
3. Tactic adjustment handle semua kombinasi: sell_in ↑↓, sell_out ↑↓, inventory ↑↓, gap ↓

### Files Changed
- `backend/data_generator/scenarios.py` — generate_inventory di 3 scenario
- `backend/data_generator/generator.py` — BASE_SELL_OUT_RANGE, tactic adjustment block

---

## Story 11.3: Flow Rate Analysis UI

**Branch:** `fix/flow-rate-analysis`
**Status:** 🚧 In Progress (backend + frontend applied)

### Problem
Manager tidak punya alat untuk menganalisis flow rate (sell-in vs sell-out) per distributor secara mandiri. Chart yang ada hanya agregasi global semua distributor. Rekomendasi sistem menyajikan kesimpulan, tapi manager tidak bisa eksplorasi data mentah.

### Solution
Tambahkan filter distributor ke chart yang sudah ada (SellInSellOutChart), plot gap sebagai area merah eksplisit, dan tampilkan total gap sebagai ringkasan.

### Changes

#### Backend: `backend/app/routers/sales.py`
- Tambah parameter opsional `distributor_id: str = Query(None)`
- Filter query dengan `DailySales.distributor_id == distributor_id`
- Tambah field `gap: int(row.sell_in) - int(row.sell_out)` di response

#### Frontend: `frontend/src/components/SellInSellOutChart.jsx`
- Fetch daftar distributor dari `GET /api/distributors`
- Dropdown "Semua Distributor" + per-distributor
- Judul chart dinamis berdasarkan distributor terpilih
- Area chart merah untuk dataKey "gap"
- Ringkasan "Total Gap: X unit" di bawah chart

### Files Changed
- `backend/app/routers/sales.py` — distributor_id filter + gap field
- `frontend/src/components/SellInSellOutChart.jsx` — distributor dropdown, area chart, summary
