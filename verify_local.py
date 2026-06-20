"""Quick local verification script — runs data generator against SQLite."""

import os
import sys
import asyncio

os.environ["DATABASE_URL"] = "sqlite+aiosqlite:///./distro_ct_test.db"

sys.path.insert(0, os.path.join(os.path.dirname(__file__), "backend"))

from app.database import engine, Base, async_session
from app.models import *  # noqa: F401, F403
from data_generator.generator import seed_master_data
from data_generator.scenarios import NormalScenario, ChannelStuffingScenario, StockoutScenario
from sqlalchemy import delete, select, func


async def run_scenario(scenario_class, scenario_label):
    """Clear volatile data, then generate fresh data for a scenario."""
    async with async_session() as db:
        await db.execute(delete(DailySales))
        await db.execute(delete(InventorySnapshot))
        await db.execute(delete(RecommendationCard))
        await db.execute(delete(PromoCalendar))
        await db.commit()

    # Re-import to use the fresh module
    from data_generator import generator as gen
    import importlib
    importlib.reload(gen)

    return await gen.generate_data(scenario_class, scenario_label)


async def verify():
    async with engine.begin() as conn:
        await conn.run_sync(Base.metadata.create_all)
    print("[OK] Tables created")

    for label, cls in [
        ("normal", NormalScenario),
        ("channel_stuffing", ChannelStuffingScenario),
        ("stockout", StockoutScenario),
    ]:
        count = await run_scenario(cls, label)
        print(f"[OK] Scenario '{label}' — {count} records")

    async with async_session() as db:
        distributors = (await db.execute(select(Distributor))).scalars().all()
        skus = (await db.execute(select(SkuCatalog))).scalars().all()
        sales_count = (await db.execute(select(func.count()).select_from(DailySales))).scalar()
        inv_count = (await db.execute(select(func.count()).select_from(InventorySnapshot))).scalar()
        rec_count = (await db.execute(select(func.count()).select_from(RecommendationCard))).scalar()
        promo_count = (await db.execute(select(func.count()).select_from(PromoCalendar))).scalar()

    print(f"\n=== VERIFICATION ===")
    print(f"Distributors:     {len(distributors)}")
    print(f"SKUs:             {len(skus)}")
    print(f"Daily Sales:      {sales_count}")
    print(f"Snapshots:        {inv_count}")
    print(f"Recommendations:  {rec_count}")
    print(f"Promos:           {promo_count}")

    ok = all([
        len(distributors) == 5,
        len(skus) == 5,
        sales_count is not None and sales_count > 0,
        inv_count is not None and inv_count > 0,
    ])

    if ok:
        print("\n✅ ALL CHECKS PASSED — Phase 1 complete!")
    else:
        print("\n❌ Some checks failed")

    os.remove("distro_ct_test.db")


asyncio.run(verify())
