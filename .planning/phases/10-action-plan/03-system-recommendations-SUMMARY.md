# Plan 03 — System Recommendations Panel SUMMARY

## Status: ✅ Complete

## Deliverables
- `frontend/src/components/RecommendationCardSimple.jsx` — card ringan 3 tombol
- `frontend/src/components/SystemRecommendations.jsx` — panel sidebar kanan

## Features
- Card dengan severity badge, financial_impact, promo tag, suggest_escalate badge
- Approve → auto-create tactic + card hilang
- Modify → buka MITLDetailModal (existing)
- Reject → card hilang
- Auto-refresh setelah action

## Bug Fixes
- `expected_change_pct * 100` → `expected_change_pct` (nampil 2000% bukannya 20%)

## Verification
- ✅ Panel hanya show pending recommendations (default API filter)
- ✅ Approve: card hilang, muncul di Action Plan Draft
- ✅ Reject: card hilang, audit trail terisi
- ✅ Loading/error/empty states
