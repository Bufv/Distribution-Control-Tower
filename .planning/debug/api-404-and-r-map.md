---
status: verifying
trigger: "XHRGET /api/sales/skus etc all return 404, r.map is not a function"
created: 2026-06-21T00:00:00Z
updated: 2026-06-21T00:00:00Z
---

## Current Focus

hypothesis: Nginx trailing slash strips /api prefix, causing 404 on all API routes; health endpoint at wrong path; components crash on non-array API responses
test: Fix nginx.conf proxy_pass, fix health endpoint path, add Array.isArray guards
expecting: All API calls return 200, no r.map TypeError
next_action: Verify fixes with e2e test

## Symptoms

expected: API endpoints return data, components render gracefully
actual: All 5 API endpoints return 404; TypeError: r.map is not a function
errors:
  - GET /api/sales/skus → 404
  - GET /api/sales?period=monthly → 404
  - GET /api/inventory → 404
  - GET /api/regions/ranking → 404
  - GET /api/recommendations → 404
  - TypeError: r.map is not a function (SellInSellOutChart.jsx skus.map)
reproduction: docker compose up -d, open localhost in browser
started: always (nginx config has trailing slash)

## Eliminated

- hypothesis: Backend routes are wrong
  evidence: All router prefixes and paths are correct (/api/sales/skus etc.)
  timestamp: 2026-06-21

## Evidence

- timestamp: 2026-06-21
  checked: nginx.conf line 13
  found: proxy_pass http://backend:8000/; (trailing slash strips /api prefix)
  implication: /api/sales/skus → /sales/skus on backend → 404

- timestamp: 2026-06-21
  checked: backend/app/main.py line 28 vs frontend App.jsx line 13
  found: Backend registers @app.get("/health"), frontend calls /api/health
  implication: Health check never reaches backend endpoint

- timestamp: 2026-06-21
  checked: All 5 frontend components
  found: None validate API response is array before calling .map()
  implication: 404 error body (object) set as state → .map() on object → TypeError

- timestamp: 2026-06-21
  checked: Phase status in ROADMAP.md and PRD
  found: Phases 1-5 complete, bugs are in Phase 1-2-3 code
  implication: All bugs qualify for fix per "complete phase" criteria

## Resolution

root_cause: Three independent bugs: (1) nginx proxy_pass trailing slash strips /api, (2) health endpoint at /health instead of /api/health, (3) frontend components lack Array.isArray() guards before .map()
fix: Applied all three fixes on story-2.2 branch
verification: running e2e test
files_changed:
  - nginx.conf
  - backend/app/main.py
  - frontend/src/App.jsx
  - frontend/src/components/SellInSellOutChart.jsx
  - frontend/src/components/StockHealthCards.jsx
  - frontend/src/components/RegionalTable.jsx
  - frontend/src/components/MITLCards.jsx
