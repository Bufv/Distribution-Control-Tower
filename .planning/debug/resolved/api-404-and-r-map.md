---
status: resolved
trigger: "XHRGET /api/sales/skus etc all return 404, r.map is not a function"
created: 2026-06-21T00:00:00Z
updated: 2026-06-21T00:00:00Z
---

## DEBUG COMPLETE

**Debug Session:** .planning/debug/resolved/api-404-and-r-map.md

**Root Cause:** Three independent bugs in completed phases:
1. Nginx proxy_pass trailing slash strips /api prefix → all API routes return 404
2. Health endpoint at /health instead of /api/health → frontend can't check health
3. Frontend components lack Array.isArray() guards → r.map is not a function on 404 error body

**Fix Applied:**
1. nginx.conf: removed trailing slash from proxy_pass
2. backend/app/main.py: moved health endpoint to /api/health, updated PUBLIC_PATHS
3. frontend/src/App.jsx: replaced fetch with api() helper for health check
4. All 4 data components: added Array.isArray() guard before setState
5. verify_e2e.py: updated health check path, added auth login for protected endpoints
6. backend/app/config.py: added extra="ignore" to fix Pydantic v2 validation

**Verification:**
- ✅ GET /api/health → 200
- ✅ POST /api/login → token acquired
- ✅ GET /api/distributors → 200, 5 distributors
- ✅ GET /api/sales/skus → 200, 5 SKUs
- ✅ GET /api/inventory → 200, 5 entries with DOI
- ✅ GET /api/regions/ranking → 200, 5 regions
- 6/6 API endpoints passed

**Files Changed:**
- nginx.conf: proxy_pass trailing slash removed
- backend/app/main.py: /health → /api/health
- backend/app/config.py: added extra="ignore"
- frontend/src/App.jsx: api() import + health call via api()
- frontend/src/components/SellInSellOutChart.jsx: Array.isArray guards
- frontend/src/components/StockHealthCards.jsx: Array.isArray guard
- frontend/src/components/RegionalTable.jsx: Array.isArray guard
- frontend/src/components/MITLCards.jsx: Array.isArray guard
- verify_e2e.py: updated test paths + added auth

**Commit:** (pending)
