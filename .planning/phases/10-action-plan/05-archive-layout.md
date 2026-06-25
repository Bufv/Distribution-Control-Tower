---
phase: 10-action-plan
plan: 05
type: execute
wave: 3
depends_on: [03, 04]
files_modified:
  - frontend/src/App.jsx
  - frontend/src/components/Archive.jsx
  - backend/app/services/verifier.py
  - backend/data_generator/main.py
autonomous: false
must_haves:
  truths:
    - Sidebar punya 4 tab aktif: Dashboard, Commercial Action Plan, Inventory Health, Archive
    - Panel kanan untuk manager: System Recommendations (bukan MITL Cards)
    - Panel kanan untuk director: Escalation Panel (tetap)
    - Archive menampilkan semua tactic executed/rejected dengan filter
    - Verification system otomatis cek outcome vs expected baseline
  artifacts:
    - Archive.jsx
    - verifier.py (scheduler service)
  key_links:
    - App.jsx → SystemRecommendations (sidebar kanan)
    - App.jsx → CommercialActionPlan (tab)
    - App.jsx → Archive (tab)
    - verifier.py → tactics table (update verification_status)
---

<objective>
Layout final: integrasi semua komponen, buat Archive tab, verification system backend.
</objective>

<context>
@frontend/src/App.jsx
@.planning/phases/10-action-plan/03-system-recommendations.md
@.planning/phases/10-action-plan/04-action-plan-tab.md
@backend/data_generator/main.py
</context>

<tasks>

<task type="auto">
<name>Task 1: Buat Archive component</name>
<files>frontend/src/components/Archive.jsx</files>
<action>
Table view untuk tactics history (status: executed/rejected/verified/deviation_detected).

Kolom: No, Title, Type, Status, Region, Financial Impact, Created, Approved/Rejected At, Verified At

Filter bar:
- Date range: start date + end date (input type=date)
- Region: dropdown (fetch dari GET /api/distributors → unique regions)
- Status: multi-select checkboxes (executed/rejected/verified/deviation_detected)
- Type: multi-select (overstock/stockout/redistribution/investigation)
- Search: text input (filter by title)
- [Apply Filters] button

Sort: klik header kolom (asc/desc toggle).

Empty state: "Belum ada riwayat tactic."
Loading state: skeleton table.

Gunakan table HTML dengan Tailwind: striped rows, sticky header, hover effect.
</action>
<verify>Buka tab Archive → muncul table dengan data tactics executed/rejected</verify>
<done>Archive table dengan filter.</done>
</task>

<task type="auto">
<name>Task 2: Buat Verification Service</name>
<files>backend/app/services/verifier.py, backend/app/data_generator/main.py</files>
<action>
Buat `backend/app/services/verifier.py`:

```python
"""Verification service — checks if executed tactics produced expected outcomes."""
from datetime import datetime, timedelta
from sqlalchemy import select, func
from sqlalchemy.ext.asyncio import AsyncSession

from app.models.tactic import Tactic
from app.models.daily_sales import DailySales
from app.models.inventory import InventorySnapshot
from app.models.notification import Notification

async def run_verification_cycle(db: AsyncSession):
    """Check all executed tactics whose verification window has passed."""
    
    cutoff = datetime.utcnow() - timedelta(days=365)  # window: executed_at + verification_window_days
    
    result = await db.execute(
        select(Tactic).where(
            Tactic.status == 'executed',
            Tactic.verification_status.is_(None),
            Tactic.executed_at.isnot(None),
            Tactic.executed_at + (Tactic.verification_window_days * timedelta(days=1)) < datetime.utcnow()
        )
    )
    tactics = result.scalars().all()
    
    for tactic in tactics:
        if not tactic.expected_metric or not tactic.baseline_value:
            tactic.verification_status = 'deviation_detected'
            tactic.deviation_notes = 'No baseline data recorded'
            continue
        
        # Calculate current value
        current_value = await _get_current_metric(db, tactic)
        if current_value is None:
            tactic.verification_status = 'deviation_detected'
            tactic.deviation_notes = 'Could not calculate outcome metric'
            continue
        
        tactic.outcome_value = current_value
        tactic.outcome_recorded_at = datetime.utcnow()
        
        # Compare
        actual_change = (current_value - tactic.baseline_value) / tactic.baseline_value if tactic.baseline_value > 0 else 0
        expected_change = tactic.expected_change_pct * (-1 if tactic.expected_direction == 'decrease' else 1)
        tolerance = abs(expected_change * 0.5) if expected_change else 0.1
        
        if abs(actual_change - expected_change) <= max(tolerance, 0.05):
            tactic.verification_status = 'verified'
        else:
            direction_word = 'increase' if actual_change > 0 else 'decrease'
            tactic.verification_status = 'deviation_detected'
            tactic.deviation_notes = (
                f"Expected: {tactic.expected_direction} by {abs(expected_change)*100:.0f}%. "
                f"Actual: {direction_word} by {abs(actual_change)*100:.0f}%."
            )
            
            # Notify director
            from app.models.user import User
            directors = (await db.execute(select(User).where(User.role == 'director', User.is_active == True))).scalars().all()
            for d in directors:
                db.add(Notification(
                    user_id=d.id,
                    message=f"Deviation: Tactic '{tactic.title}' — {tactic.deviation_notes}",
                    related_entity_type='tactic',
                    related_entity_id=tactic.id,
                ))
    
    await db.commit()
    return len(tactics)


async def _get_current_metric(db, tactic):
    """Get current value for the expected metric."""
    if not tactic.distributor_id or not tactic.sku_id:
        return None
    
    three_days_ago = datetime.now().date() - timedelta(days=3)
    
    if tactic.expected_metric == 'sell_in':
        r = await db.execute(
            select(func.avg(DailySales.sell_in_qty))
            .where(DailySales.distributor_id == tactic.distributor_id, DailySales.sku_id == tactic.sku_id, DailySales.date >= three_days_ago)
        )
        return float(r.scalar_one() or 0)
    
    elif tactic.expected_metric == 'sell_out':
        r = await db.execute(
            select(func.avg(DailySales.sell_out_qty))
            .where(DailySales.distributor_id == tactic.distributor_id, DailySales.sku_id == tactic.sku_id, DailySales.date >= three_days_ago)
        )
        return float(r.scalar_one() or 0)
    
    elif tactic.expected_metric == 'inventory':
        r = await db.execute(
            select(InventorySnapshot.current_stock)
            .where(InventorySnapshot.distributor_id == tactic.distributor_id, InventorySnapshot.sku_id == tactic.sku_id)
            .order_by(InventorySnapshot.snapshot_date.desc()).limit(1)
        )
        val = r.scalar_one_or_none()
        return float(val) if val is not None else None
    
    return None
```

Modifikasi `backend/app/data_generator/main.py` — panggil `run_verification_cycle(db)` setelah generate data.
```python
# Tambah di akhir generate_data (setelah db.commit, return record_count):
from app.services.verifier import run_verification_cycle
verified_count = await run_verification_cycle(db)
print(f"Verification: {verified_count} tactics checked")
```
</action>
<verify>Generator memanggil verifier. Tactic dengan window lewat terverifikasi.</verify>
<done>Verification service berfungsi — update verification_status otomatis.</done>
</task>

<task type="checkpoint:human-verify">
<name>Task 3: Integrasi App.jsx — Layout Final</name>
<files>frontend/src/App.jsx</files>
<action>
Ubah `frontend/src/App.jsx` untuk layout final:

1. **Import baru:**
```javascript
import SystemRecommendations from './components/SystemRecommendations'
import CommercialActionPlan from './components/CommercialActionPlan'
import TacticDetailModal from './components/TacticDetailModal'
import Archive from './components/Archive'
```

2. **Import dihapus:**
```javascript
// Hapus:
import MITLCards from './components/MITLCards'
// Hapus juga MITLDetailModal jika tidak dipakai lagi (tapi tetap untuk modify form)
// Biarkan dulu MITLDetailModal untuk modify flow
```

3. **Nav items baru:**
```javascript
const navItems = [
  { id: 'dashboard', label: 'Dashboard' },
  { id: 'action-plan', label: 'Commercial Action Plan' },
  { id: 'inventory', label: 'Inventory Health' },
  { id: 'archive', label: 'Archive' },
]
```
Semua tab aktif (tidak ada disabled).

4. **State management baru:**
```javascript
const [detailTactic, setDetailTactic] = useState(null)
const [tacticModalMode, setTacticModalMode] = useState('view')
const [showTacticModal, setShowTacticModal] = useState(false)
```

5. **Right panel sidebar:**
```jsx
<aside className="w-80 bg-white border-l p-4 hidden lg:flex flex-col shrink-0">
  <h3 className="font-semibold text-sm uppercase tracking-wide text-gray-500 mb-4">
    {isDirector ? 'Escalation Panel' : 'System Recommendations'}
  </h3>
  <div className="flex-1 overflow-y-auto">
    {isDirector ? (
      <EscalationPanel user={user} />
    ) : (
      <SystemRecommendations onModifyCard={setDetailCard} />
    )}
  </div>
</aside>
```

6. **Main area routing:**
```jsx
{activeTab === 'dashboard' && (
  <div className="max-w-6xl mx-auto space-y-6">
    <div>
      <h2 className="text-2xl font-semibold text-gray-900">Executive Dashboard</h2>
      <p className="text-sm text-gray-500 mt-1">Pusat komando distribusi nasional</p>
    </div>
    <SellInSellOutChart />
    <StockHealthCards />
  </div>
)}

{activeTab === 'action-plan' && (
  <CommercialActionPlan user={user} />
)}

{activeTab === 'inventory' && (
  <InventoryPage />
)}

{activeTab === 'archive' && (
  <Archive user={user} />
)}
```

7. **Modals:**
```jsx
{showPromoForm && <PromoForm onClose={() => setShowPromoForm(false)} />}
{detailCard && <MITLDetailModal card={detailCard} onClose={() => setDetailCard(null)} />}
{showTacticModal && (
  <TacticDetailModal
    mode={tacticModalMode}
    tactic={detailTactic}
    user={user}
    onClose={() => setShowTacticModal(false)}
    onAction={() => { setShowTacticModal(false); /* trigger refresh */ }}
  />
)}
```

8. **Label sidebar:**
```
<h1 className="text-lg font-bold mb-6">Distro Control Tower</h1>
```

Tidak ada perubahan di backend untuk task ini.
</action>
<verify>Buka app → sidebar 4 tab aktif → klik masing2 → konten berubah. Panel kanan untuk manager: System Recommendations.</verify>
<done>Layout final terintegrasi, semua tab aktif, Regional Table dihapus.</done>
</task>

</tasks>

<verification>
1. Sidebar: 4 tab aktif + tidak ada tab disabled
2. Panel kanan manager: System Recommendations dengan action buttons
3. Panel kanan director: Escalation Panel (unchanged)
4. Tab Action Plan: 5 swimlane dengan data
5. Tab Archive: table dengan filter
6. Verification: setelah window lewat, tactic dapat status verified/deviation
</verification>

<success_criteria>
- Semua komponen terintegrasi di App.jsx
- Regional Table dihapus dari dashboard
- Verification service berjalan di setiap generator cycle
</success_criteria>

<output>
`.planning/phases/10-action-plan/05-archive-layout-SUMMARY.md`
</output>
