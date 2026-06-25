"""Entry point data generator — dipanggil oleh CronJob.

Memilih skenario berdasarkan counter di database (round-robin per run).
Siklus: Normal → Channel Stuffing → Stockout → Normal → ...
"""

import asyncio

from sqlalchemy import text

from app.database import async_session
from data_generator.scenarios import pick_scenario, SCENARIO_CLASSES
from data_generator.generator import generate_data


async def _get_and_increment_counter() -> int:
    async with async_session() as db:
        await db.execute(text(
            "INSERT INTO scenario_counter (id, counter) VALUES (1, 0) ON CONFLICT DO NOTHING"
        ))
        result = await db.execute(
            text("SELECT counter FROM scenario_counter WHERE id = 1 FOR UPDATE")
        )
        counter = result.scalar_one()
        await db.execute(
            text("UPDATE scenario_counter SET counter = counter + 1 WHERE id = 1")
        )
        await db.commit()
        return counter % len(SCENARIO_CLASSES)


async def main():
    counter = await _get_and_increment_counter()
    scenario_class, scenario_label = pick_scenario(counter)

    print(f"[data-generator] Run #{counter} — skenario: {scenario_label}")

    record_count = await generate_data(scenario_class, scenario_label)

    # Verification check — bandingkan baseline vs outcome untuk executed tactics
    from app.services.verifier import run_verification_cycle
    async with async_session() as db:
        verified_count = await run_verification_cycle(db)
        if verified_count:
            print(f"[data-generator] Verifikasi: {verified_count} tactic dicek")

    print(f"[data-generator] Selesai — {record_count} record tersimpan ({scenario_label})")


if __name__ == "__main__":
    asyncio.run(main())
