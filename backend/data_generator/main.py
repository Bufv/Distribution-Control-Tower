"""Entry point data generator — dipanggil oleh CronJob.

Membaca file counter untuk round-robin skenario, lalu generate data.
Simpan counter increment untuk run berikutnya.
"""

import os
import asyncio
from pathlib import Path

from data_generator.scenarios import pick_scenario
from data_generator.generator import generate_data

_COUNTER_FILE = Path("/tmp/data_generator_counter.txt")


def _read_counter() -> int:
    if _COUNTER_FILE.exists():
        return int(_COUNTER_FILE.read_text().strip())
    return 0


def _write_counter(value: int) -> None:
    _COUNTER_FILE.write_text(str(value))


async def main():
    counter = _read_counter()
    scenario_class, scenario_label = pick_scenario(counter)

    print(f"[data-generator] Run #{counter} — skenario: {scenario_label}")

    record_count = await generate_data(scenario_class, scenario_label)

    _write_counter(counter + 1)

    print(f"[data-generator] Selesai — {record_count} record tersimpan ({scenario_label})")


if __name__ == "__main__":
    asyncio.run(main())
