---
phase: 10-action-plan
plan: 01
type: execute
wave: 1
depends_on: []
files_modified:
  - backend/app/models/sku.py
  - backend/app/models/recommendation.py
  - backend/data_generator/scenarios.py
  - backend/data_generator/generator.py
  - backend/alembic/versions/005_add_unit_price.py
  - backend/alembic/versions/006_add_recommendation_fields.py
autonomous: true
must_haves:
  truths:
    - Setiap rekomendasi punya financial_impact (Rp) dari unit_price x qty
    - Rekomendasi impact >= Rp 200jt auto suggest escalate
    - Data generator tidak hapus card yang sudah di-action
    - Context-aware: jika ada tactic executed, generator adjust data
  artifacts:
    - SkuCatalog.unit_price column
    - RecommendationCard.financial_impact, suggest_escalate, expected_* columns
  key_links:
    - generator.py → sku_catalog.unit_price untuk hitung financial_impact
    - generator.py → tactics table untuk context-aware adjustment
---

<objective>
Upgrade data generator dengan skenario realistis berdampak finansial terukur.
</objective>

<context>
@backend/app/models/sku.py
@backend/app/models/recommendation.py
@backend/data_generator/scenarios.py
@backend/data_generator/generator.py
</context>

<tasks>

<task type="auto">
<name>Task 1: Tambah unit_price ke SkuCatalog + migration</name>
<files>backend/app/models/sku.py, backend/alembic/versions/005_add_unit_price.py</files>
<action>
Tambah `unit_price: Mapped[int] = mapped_column(Integer, default=0)` di SkuCatalog.

Buat migration 005_add_unit_price.py:
```python
"""Add unit_price to sku_catalog"""
from alembic import op
import sqlalchemy as sa

revision = '005_add_unit_price'
down_revision = '004_add_scenario_counter'

def upgrade():
    op.add_column('sku_catalog', sa.Column('unit_price', sa.Integer(), server_default='0', nullable=False))

def downgrade():
    op.drop_column('sku_catalog', 'unit_price')
```
</action>
<verify>python -c "from app.models.sku import SkuCatalog; print(hasattr(SkuCatalog, 'unit_price'))" → True</verify>
<done>unit_price ada di model + migration siap.</done>
</task>

<task type="auto">
<name>Task 2: Tambah financial & escalation fields ke RecommendationCard + migration</name>
<files>backend/app/models/recommendation.py, backend/alembic/versions/006_add_recommendation_fields.py</files>
<action>
Tambah field: financial_impact (BigInteger), suggest_escalate (Boolean, default=False), expected_metric (String 50), expected_direction (String 20), expected_change_pct (Float).

Migration 006_add_recommendation_fields.py:
```python
"""Add financial/escalation fields"""
from alembic import op
import sqlalchemy as sa

revision = '006_add_recommendation_fields'
down_revision = '005_add_unit_price'

def upgrade():
    op.add_column('recommendation_cards', sa.Column('financial_impact', sa.BigInteger(), nullable=True))
    op.add_column('recommendation_cards', sa.Column('suggest_escalate', sa.Boolean(), server_default='f', nullable=False))
    op.add_column('recommendation_cards', sa.Column('expected_metric', sa.String(50), nullable=True))
    op.add_column('recommendation_cards', sa.Column('expected_direction', sa.String(20), nullable=True))
    op.add_column('recommendation_cards', sa.Column('expected_change_pct', sa.Float(), nullable=True))

def downgrade():
    op.drop_column('recommendation_cards', 'expected_change_pct')
    op.drop_column('recommendation_cards', 'expected_direction')
    op.drop_column('recommendation_cards', 'expected_metric')
    op.drop_column('recommendation_cards', 'suggest_escalate')
    op.drop_column('recommendation_cards', 'financial_impact')
```
</action>
<verify>python -c "from app.models.recommendation import RecommendationCard; print(hasattr(RecommendationCard, 'financial_impact'))" → True</verify>
<done>Field baru ada di model + migration siap.</done>
</task>

<task type="auto">
<name>Task 3: Rewrite scenarios.py dengan 3 skenario realistis</name>
<files>backend/app/data_generator/scenarios.py</files>
<action>
Tulis ulang 3 skenario dengan data berikut:

**Harga SKU:** SKU-001: 35000, SKU-002: 35000, SKU-003: 55000, SKU-004: 45000, SKU-005: 70000

**Skenario A (normal):** Hanya Surabaya gap > 30, 1 card financial ~Rp 1,75jt
**Skenario B (channel_stuffing):** Jakarta overstock 6000+ (financial ~Rp 280jt, suggest_escalate=true), Makassar overstock 2500+ (~Rp 112jt)
**Skenario C (stockout):** Medan stockout (~Rp 42jt), Balikpapan overstock (~Rp 210jt, suggest_escalate=true), opportunity redistribusi (~Rp 250jt)

Setiap class punya `generate_params(day_index)` dan `generate_recommendations(distributors, skus, start_date)`. Return list of dict, jangan akses DB.
</action>
<verify>python3 -c "from data_generator.scenarios import pick_scenario; print(pick_scenario(0))"</verify>
<done>scenarios.py dengan 3 skenario baru.</done>
</task>

</tasks>

<verification>
1. Migration jalan tanpa error
2. Generator cycle baru tidak hapus cards dengan status != 'pending'
3. Context-aware: jika ada tactic executed, generator adjust data
</verification>

<success_criteria>
- Generator hasilkan rekomendasi dengan financial_impact
- Threshold >= Rp 200jt → suggest_escalate=true
- Card yang sudah di-action tidak dihapus
</success_criteria>

<output>
`.planning/phases/10-action-plan/01-data-generator-SUMMARY.md`
</output>
