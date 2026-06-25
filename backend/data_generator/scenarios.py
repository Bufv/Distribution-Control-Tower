import random
from dataclasses import dataclass
from typing import Tuple


SKU_PRICES = {
    "SKU-001": 35000,
    "SKU-002": 35000,
    "SKU-003": 55000,
    "SKU-004": 45000,
    "SKU-005": 70000,
}


def _find_sku(skus, code):
    for s in skus:
        if s.code == code:
            return s
    return skus[0]


def _find_dist(distributors, code):
    for d in distributors:
        if d.code == code:
            return d
    return distributors[0]


@dataclass
class NormalScenario:
    """Skenario A — Normal dengan gap ringan di Surabaya."""

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

    @staticmethod
    def generate_params(day_index: int) -> dict:
        return {
            "DTR-JKT-01": {"sell_in": 110, "sell_out": 100},
            "DTR-SBY-02": {"sell_in": 130, "sell_out": 70},
            "DTR-MDN-03": {"sell_in": 90, "sell_out": 85},
            "DTR-MKS-04": {"sell_in": 70, "sell_out": 65},
            "DTR-BPK-05": {"sell_in": 80, "sell_out": 75},
        }

    @staticmethod
    def generate_recommendations(distributors, skus, start_date):
        cards = []
        sby = _find_dist(distributors, "DTR-SBY-02")
        sku = _find_sku(skus, "SKU-001")
        gap = 60
        impact = gap * sku.unit_price
        cards.append({
            "title": f"Gap Sell-In/Sell-Out — {sby.name}",
            "description": (
                f"Selisih sell-in vs sell-out di {sby.name} mencapai "
                f"{gap} unit. Potensi channel stuffing ringan. "
                "Periksa aktivitas distributor."
            ),
            "recommendation_type": "channel_stuffing",
            "severity": "medium",
            "distributor_id": sby.id,
            "sku_id": sku.id,
            "region": sby.region,
            "financial_impact": impact,
            "suggest_escalate": False,
            "expected_metric": "sell_in",
            "expected_direction": "decrease",
            "expected_change_pct": 0.15,
        })
        return cards


@dataclass
class ChannelStuffingScenario:
    """Skenario B — Overstock masif di Jakarta + Makassar."""

    label = "channel_stuffing"

    @staticmethod
    def generate_sell_in(base_qty: int, day_index: int) -> int:
        return int(base_qty * (1 + random.uniform(-0.05, 0.05)))

    @staticmethod
    def generate_sell_out(base_qty: int, day_index: int, inventory: int) -> int:
        return int(base_qty * (1 + random.uniform(-0.05, 0.05)))

    @staticmethod
    def generate_inventory(base_stock: int, day_index: int) -> int:
        return int(base_stock * random.uniform(0.8, 1.0))

    @staticmethod
    def generate_params(day_index: int) -> dict:
        return {
            "DTR-JKT-01": {"sell_in": 220, "sell_out": 100},
            "DTR-SBY-02": {"sell_in": 100, "sell_out": 80},
            "DTR-MDN-03": {"sell_in": 90, "sell_out": 85},
            "DTR-MKS-04": {"sell_in": 140, "sell_out": 60},
            "DTR-BPK-05": {"sell_in": 80, "sell_out": 75},
        }

    @staticmethod
    def generate_recommendations(distributors, skus, start_date):
        cards = []
        jkt = _find_dist(distributors, "DTR-JKT-01")
        mks = _find_dist(distributors, "DTR-MKS-04")
        sku_teh = _find_sku(skus, "SKU-003")
        sku_mie = _find_sku(skus, "SKU-001")

        impact_jkt = 6000 * sku_teh.unit_price
        cards.append({
            "title": f"Overstock Masif — {jkt.name}",
            "description": (
                f"Stok di {jkt.name} diperkirakan mencapai 6.000+ unit (SKU Teh Botol), "
                "jauh melampaui batas aman 30 hari (DOI 45+). "
                "Risiko barang kedaluwarsa tinggi. "
                "Rekomendasi: potong alokasi sell-in 30% selama 2 minggu."
            ),
            "recommendation_type": "overstock",
            "severity": "high",
            "distributor_id": jkt.id,
            "sku_id": sku_teh.id,
            "region": jkt.region,
            "financial_impact": impact_jkt,
            "suggest_escalate": True,
            "expected_metric": "sell_in",
            "expected_direction": "decrease",
            "expected_change_pct": 0.30,
        })

        impact_mks = 2500 * sku_mie.unit_price
        cards.append({
            "title": f"Overstock — {mks.name}",
            "description": (
                f"Stok di {mks.name} mencapai 2.500+ unit (SKU Mie Instan), "
                "melebihi batas aman. Evaluasi jadwal pengiriman."
            ),
            "recommendation_type": "overstock",
            "severity": "high",
            "distributor_id": mks.id,
            "sku_id": sku_mie.id,
            "region": mks.region,
            "financial_impact": impact_mks,
            "suggest_escalate": False,
            "expected_metric": "sell_in",
            "expected_direction": "decrease",
            "expected_change_pct": 0.20,
        })
        return cards


@dataclass
class StockoutScenario:
    """Skenario C — Stockout Medan + Overstock Balikpapan + Redistribusi."""

    label = "stockout"

    @staticmethod
    def generate_sell_in(base_qty: int, day_index: int) -> int:
        return int(base_qty * (1 + random.uniform(-0.05, 0.05)))

    @staticmethod
    def generate_sell_out(base_qty: int, day_index: int, inventory: int) -> int:
        return int(base_qty * (1 + random.uniform(-0.05, 0.05)))

    @staticmethod
    def generate_inventory(base_stock: int, day_index: int) -> int:
        return int(base_stock * random.uniform(0.8, 1.0))

    @staticmethod
    def generate_params(day_index: int) -> dict:
        return {
            "DTR-JKT-01": {"sell_in": 110, "sell_out": 100},
            "DTR-SBY-02": {"sell_in": 100, "sell_out": 90},
            "DTR-MDN-03": {"sell_in": 40, "sell_out": 135},
            "DTR-MKS-04": {"sell_in": 70, "sell_out": 65},
            "DTR-BPK-05": {"sell_in": 160, "sell_out": 60},
        }

    @staticmethod
    def generate_recommendations(distributors, skus, start_date):
        cards = []
        mdn = _find_dist(distributors, "DTR-MDN-03")
        bpk = _find_dist(distributors, "DTR-BPK-05")
        sku = _find_sku(skus, "SKU-005")

        impact_mdn = 600 * sku.unit_price
        cards.append({
            "title": f"Stockout — {mdn.name}",
            "description": (
                f"Stok {mdn.name} habis (0 unit) untuk SKU Biskuit Coklat. "
                "Potensi kehilangan penjualan di periode peak demand. "
                "Segera alokasikan pengiriman darurat."
            ),
            "recommendation_type": "stockout",
            "severity": "high",
            "distributor_id": mdn.id,
            "sku_id": sku.id,
            "region": mdn.region,
            "financial_impact": impact_mdn,
            "suggest_escalate": False,
            "expected_metric": "inventory",
            "expected_direction": "increase",
            "expected_change_pct": 0.50,
        })

        impact_bpk = 3500 * sku.unit_price
        cards.append({
            "title": f"Overstock — {bpk.name}",
            "description": (
                f"Stok {bpk.name} mencapai 3.500+ unit untuk SKU Biskuit Coklat "
                "(DOI 45+). Risiko overstock dan kedaluwarsa."
            ),
            "recommendation_type": "overstock",
            "severity": "high",
            "distributor_id": bpk.id,
            "sku_id": sku.id,
            "region": bpk.region,
            "financial_impact": impact_bpk,
            "suggest_escalate": True,
            "expected_metric": "sell_in",
            "expected_direction": "decrease",
            "expected_change_pct": 0.25,
        })

        cards.append({
            "title": f"Opportunity Redistribusi — {bpk.name} → {mdn.name}",
            "description": (
                f"SKU Biskuit Coklat: {bpk.name} kelebihan 3.500 unit sementara "
                f"{mdn.name} stockout. Kirim 1.500 unit dari {bpk.region} ke "
                f"{mdn.region}. Hemat biaya produksi baru + percepat restock."
            ),
            "recommendation_type": "redistribution",
            "severity": "high",
            "distributor_id": bpk.id,
            "sku_id": sku.id,
            "region": bpk.region,
            "financial_impact": 250000000,
            "suggest_escalate": True,
            "expected_metric": "inventory",
            "expected_direction": "decrease",
            "expected_change_pct": 0.30,
        })
        return cards


SCENARIO_CLASSES = [NormalScenario, ChannelStuffingScenario, StockoutScenario]


def pick_scenario(counter: int) -> Tuple:
    """Round-robin pemilihan skenario berdasarkan counter."""
    cls = SCENARIO_CLASSES[counter % len(SCENARIO_CLASSES)]
    return cls, cls.label
