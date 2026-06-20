import random
from dataclasses import dataclass
from typing import Tuple


@dataclass
class NormalScenario:
    """Skenario A — sell-in ≈ sell-out, deviasi ±5%, DOI 14-30 hari."""

    label = "normal"

    @staticmethod
    def generate_sell_in(base_qty: int, day_index: int) -> int:
        return int(base_qty * (1 + random.uniform(-0.05, 0.05)))

    @staticmethod
    def generate_sell_out(base_qty: int, day_index: int, inventory: int) -> int:
        return int(base_qty * (1 + random.uniform(-0.05, 0.05)))

    @staticmethod
    def generate_inventory(base_stock: int, day_index: int) -> int:
        return int(base_stock * random.uniform(0.8, 1.0))


@dataclass
class ChannelStuffingScenario:
    """Skenario B — sell-in spike +30–50% di akhir siklus, sell-out flat/menurun.
    Memicu alert overstock (DOI > 30 hari).
    """

    label = "channel_stuffing"

    @staticmethod
    def generate_sell_in(base_qty: int, day_index: int) -> int:
        if day_index >= 5:
            return int(base_qty * random.uniform(1.3, 1.5))
        return int(base_qty * random.uniform(0.9, 1.1))

    @staticmethod
    def generate_sell_out(base_qty: int, day_index: int, inventory: int) -> int:
        return int(base_qty * random.uniform(0.9, 1.05))

    @staticmethod
    def generate_inventory(base_stock: int, day_index: int) -> int:
        return int(base_stock * (1 + day_index * 0.1))


@dataclass
class StockoutScenario:
    """Skenario C — sell-out menyentuh 0 karena stok habis, sell-in telat merespons.
    Memicu alert stockout (DOI = 0).
    """

    label = "stockout"

    @staticmethod
    def generate_sell_in(base_qty: int, day_index: int) -> int:
        if day_index <= 2:
            return int(base_qty * 0.3)
        return int(base_qty * 1.2)

    @staticmethod
    def generate_sell_out(base_qty: int, day_index: int, inventory: int) -> int:
        if inventory <= 0:
            return 0
        if day_index <= 3:
            return int(base_qty * 1.2)
        return int(base_qty * 0.5)

    @staticmethod
    def generate_inventory(base_stock: int, day_index: int) -> int:
        if day_index <= 3:
            remaining = int(base_stock * (1 - day_index * 0.3))
            return max(remaining, 0)
        return 0


SCENARIO_CLASSES = [NormalScenario, ChannelStuffingScenario, StockoutScenario]


def pick_scenario(counter: int) -> Tuple:
    """Round-robin pemilihan skenario berdasarkan counter."""
    cls = SCENARIO_CLASSES[counter % len(SCENARIO_CLASSES)]
    return cls, cls.label
