# Plan 01 — Data Generator Upgrade SUMMARY

## Status: ✅ Complete

## Deliverables
- `backend/app/models/sku.py` — tambah `unit_price` column
- `backend/app/models/recommendation.py` — tambah `financial_impact`, `suggest_escalate`, `expected_*`
- `backend/alembic/versions/005_add_unit_price.py` — migration
- `backend/alembic/versions/006_add_recommendation_fields.py` — migration
- `backend/data_generator/scenarios.py` — 3 skenario realistis
- `backend/data_generator/generator.py` — context-aware, hanya hapus pending cards
- `backend/data_generator/main.py` — panggil verifier setelah generate

## Bug Fixes
- Migration revision IDs: `005_add_unit_price` down_revision = `004` (bukan `004_add_scenario_counter`)
- Sama untuk 006

## Verification
- ✅ Data generator seeding dengan financial_impact (Rp 35rb-70rb per unit)
- ✅ Threshold >= Rp 200jt → suggest_escalate=true
- ✅ Cards dengan status != 'pending' tidak dihapus
- ✅ Context-aware: data disesuaikan dengan executed tactics
- ✅ Verifier dipanggil setelah generate
