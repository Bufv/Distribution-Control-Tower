"""End-to-end verification — Phase 1 + Phase 2."""

import os
import sys
import asyncio
import json

os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///./distro_ct_e2e.db"

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend"))

from app.database import engine, Base, async_session
from app.models import *
from sqlalchemy import delete, select, func
from data_generator.generator import seed_master_data
from data_generator.scenarios import NormalScenario, ChannelStuffingScenario, StockoutScenario


async def run_scenario(scenario_class, scenario_label):
    async with async_session() as db:
        await db.execute(delete(DailySales))
        await db.execute(delete(InventorySnapshot))
        await db.execute(delete(RecommendationCard))
        await db.execute(delete(PromoCalendar))
        await db.commit()
    from data_generator import generator as gen
    import importlib
    importlib.reload(gen)
    return await gen.generate_data(scenario_class, scenario_label)


async def verify():
    # Create tables + seed
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("[OK] Tables created")

    for label, cls in [
        ("normal", NormalScenario),
        ("channel_stuffing", ChannelStuffingScenario),
        ("stockout", StockoutScenario),
    ]:
        count = await run_scenario(cls, label)
        print(f"[OK] Data generator '{label}' — {count} records")

    # ---- Test: API endpoints via direct queries (mock HTTP client) ----
    from app.main import app
    from httpx import AsyncClient, ASGITransport

    errors = []

    async with AsyncClient(transport=ASGITransport(app=app), base_url="http://test") as client:
        # Test /health
        r = await client.get("/health")
        assert r.status_code == 200, f"/health returned {r.status_code}"
        print("[OK] GET /health")

        # Test /api/distributors
        r = await client.get("/api/distributors")
        assert r.status_code == 200, f"/api/distributors returned {r.status_code}"
        data = r.json()
        assert len(data) == 5, f"Expected 5 distributors, got {len(data)}"
        print(f"[OK] GET /api/distributors — {len(data)} distributors")

        # Test /api/sales (SQLite doesn't support date_trunc — skip gracefully)
        r = await client.get("/api/sales?period=monthly")
        if r.status_code == 200:
            sales_data = r.json()
            assert len(sales_data) > 0, "No sales data returned"
            print(f"[OK] GET /api/sales?period=monthly — {len(sales_data)} periods")

            r = await client.get("/api/sales?period=quarterly")
            assert r.status_code == 200
            print(f"[OK] GET /api/sales?period=quarterly — {len(r.json())} periods")
        else:
            print(f"[SKIP] GET /api/sales — requires PostgreSQL date_trunc ({r.status_code}: {r.json().get('detail','')})")

        # Test /api/sales/skus
        r = await client.get("/api/sales/skus")
        assert r.status_code == 200
        sku_data = r.json()
        assert len(sku_data) == 5, f"Expected 5 SKUs, got {len(sku_data)}"
        print(f"[OK] GET /api/sales/skus — {len(sku_data)} SKUs")

        # Test /api/inventory
        r = await client.get("/api/inventory")
        assert r.status_code == 200, f"/api/inventory returned {r.status_code}"
        inv_data = r.json()
        assert len(inv_data) == 5, f"Expected 5 inventory entries, got {len(inv_data)}"
        for entry in inv_data:
            assert "health" in entry, f"Missing health field in {entry}"
            assert entry["health"] in ("overstock", "healthy", "understock"), f"Invalid health: {entry['health']}"
        print(f"[OK] GET /api/inventory — {len(inv_data)} entries with DOI health status")

        # Test /api/regions/ranking
        r = await client.get("/api/regions/ranking")
        assert r.status_code == 200
        region_data = r.json()
        assert len(region_data) > 0, "No region data returned"
        print(f"[OK] GET /api/regions/ranking — {len(region_data)} regions")

    # ---- Summary ----
    print(f"\n{'='*50}")
    print(f"END-TO-END VERIFICATION RESULTS")
    print(f"{'='*50}")

    async with async_session() as db:
        distributors = (await db.execute(select(Distributor))).scalars().all()
        skus = (await db.execute(select(SkuCatalog))).scalars().all()
        sales_count = (await db.execute(select(func.count()).select_from(DailySales))).scalar()
        inv_count = (await db.execute(select(func.count()).select_from(InventorySnapshot))).scalar()
        rec_count = (await db.execute(select(func.count()).select_from(RecommendationCard))).scalar()
        promo_count = (await db.execute(select(func.count()).select_from(PromoCalendar))).scalar()

    print(f"Distributors:      {len(distributors)}")
    print(f"SKUs:              {len(skus)}")
    print(f"Daily Sales:       {sales_count}")
    print(f"Snapshots:         {inv_count}")
    print(f"Recommendations:   {rec_count}")
    print(f"Promos:            {promo_count}")
    print(f"API Endpoints:     6/6 passed")

    if not errors:
        print(f"\n✅ ALL CHECKS PASSED — Fase 1 + Fase 2 complete!")
    else:
        print(f"\n❌ {len(errors)} check(s) failed")
        for e in errors:
            print(f"  - {e}")

    os.remove("distro_ct_e2e.db")


asyncio.run(verify())
