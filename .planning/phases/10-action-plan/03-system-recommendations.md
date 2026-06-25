---
phase: 10-action-plan
plan: 03
type: execute
wave: 2
depends_on: [02]
files_modified:
  - frontend/src/components/SystemRecommendations.jsx
  - frontend/src/components/RecommendationCardSimple.jsx
autonomous: true
must_haves:
  truths:
    - Panel kanan hanya menampilkan recommendation dengan status pending
    - Setelah di-action (approve/modify/reject), card hilang dari panel
    - Approve → toast: "Tactic dibuat di Action Plan"
    - Modify → form sederhana di modal
  artifacts:
    - SystemRecommendations.jsx
    - RecommendationCardSimple.jsx
  key_links:
    - SystemRecommendations → GET /api/recommendations (hanya pending)
    - SystemRecommendations → POST /api/recommendations/{id}/approve
---

<objective>
Ubah MITLCards jadi SystemRecommendations — panel rekomendasi read-only dengan action langsung di card.
</objective>

<context>
@frontend/src/App.jsx
@frontend/src/api.js
@frontend/src/components/MITLCards.jsx
</context>

<tasks>

<task type="auto">
<name>Task 1: Buat RecommendationCardSimple component</name>
<files>frontend/src/components/RecommendationCardSimple.jsx</files>
<action>
Buat komponen card ringan dengan props: { card, onApprove, onModify, onReject }.

Tampilkan:
- Title (bold, truncate)
- Description (text-sm, line-clamp-2)
- Severity badge (high=red, medium=yellow, low=blue)
- Region + financial_impact (format Rp, misal "Rp 280jt")
- Promo tag jika promo_nearby (purple background)
- suggest_escalate badge jika true — "⚠️ Rekomendasi Eskalasi" (orange bg)

3 tombol action langsung:
- [✓ Approve] bg-green-600 hover:bg-green-700 text-white
- [✎ Modify] bg-blue-600 hover:bg-blue-700 text-white
- [✕ Reject] bg-red-600 hover:bg-red-700 text-white

Jika card punya sell_in_cuttable=false (promo nearby), tombol Modify di-disable dengan title "Disabled: promo nearby".

Gunakan Tailwind classes. Jangan modal — tombol langsung panggil callback.

Format financial_impact helper:
```js
const formatRp = (val) => {
  if (!val) return null;
  if (val >= 1_000_000_000) return `Rp ${(val / 1_000_000_000).toFixed(1)}M`;
  if (val >= 1_000_000) return `Rp ${(val / 1_000_000).toFixed(0)}jt`;
  if (val >= 1_000) return `Rp ${(val / 1_000).toFixed(0)}rb`;
  return `Rp ${val}`;
};
```
</action>
<verify>Render komponen di Storybook atau inline test — 3 tombol muncul sesuai spec</verify>
<done>RecommendationCardSimple dengan 3 action buttons siap.</done>
</task>

<task type="auto">
<name>Task 2: Buat SystemRecommendations panel component</name>
<files>frontend/src/components/SystemRecommendations.jsx</files>
<action>
Panel utama sidebar kanan — menggantikan MITLCards.

```jsx
import { useState, useEffect, useCallback } from 'react'
import { api } from '../api'
import RecommendationCardSimple from './RecommendationCardSimple'

export default function SystemRecommendations({ onModifyCard }) {
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actioning, setActioning] = useState(null) // cardId sedang di-action

  const fetchCards = async () => {
    setLoading(true)
    try {
      const res = await api('/api/recommendations')
      const data = await res.json()
      setCards(Array.isArray(data) ? data : [])
    } catch {
      setError('Gagal memuat rekomendasi')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCards() }, [])

  const handleApprove = async (cardId) => {
    setActioning(cardId)
    try {
      const res = await api(`/api/recommendations/${cardId}/approve`, { method: 'POST' })
      if (!res.ok) throw new Error()
      // Tampilkan toast — untuk MVP cukup alert atau state
      fetchCards()
    } catch {
      setError('Gagal approve rekomendasi')
    } finally {
      setActioning(null)
    }
  }

  const handleReject = async (cardId) => {
    if (!confirm('Yakin reject rekomendasi ini?')) return
    setActioning(cardId)
    try {
      const res = await api(`/api/recommendations/${cardId}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'reject', reason_code: 'Commercial Strategy', notes: 'Rejected from panel' }),
      })
      if (!res.ok) throw new Error()
      fetchCards()
    } catch {
      setError('Gagal reject')
    } finally {
      setActioning(null)
    }
  }

  const handleModify = (card) => {
    onModifyCard(card) // parent (App) tampilkan modal
  }

  // Loading, empty, error states
  if (loading) return <div className="text-center text-gray-400 text-sm py-8">Memuat rekomendasi...</div>
  if (error) return (
    <div className="text-center">
      <p className="text-red-500 text-sm mb-2">{error}</p>
      <button onClick={fetchCards} className="text-xs text-blue-600 hover:underline">Coba lagi</button>
    </div>
  )
  if (cards.length === 0) return <div className="text-center text-gray-400 text-sm py-8">Tidak ada rekomendasi baru</div>

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
        <span>{cards.length} rekomendasi</span>
        <button onClick={fetchCards} className="hover:text-gray-600">↻ Refresh</button>
      </div>
      {cards.map(card => (
        <RecommendationCardSimple
          key={card.id}
          card={card}
          onApprove={handleApprove}
          onModify={handleModify}
          onReject={handleReject}
          disabled={actioning === card.id}
        />
      ))}
    </div>
  )
}
```

Gunakan fetch + re-render. Tidak perlu state management complex.
</action>
<verify>Render panel dengan card dari API. Approve → card hilang. Reject → card hilang.</verify>
<done>SystemRecommendations panel dengan auto-refresh setelah action.</done>
</task>

</tasks>

<verification>
1. GET /api/recommendations hanya return cards dengan status='pending'
2. Approve → card hilang, muncul di Action Plan
3. Reject → card hilang, audit trail terisi
4. Modify → modal form → card hilang
</verification>

<success_criteria>
- Panel kanan hanya show pending recommendations
- Action langsung dari card tanpa modal (kecuali modify)
- Card hilang setelah di-action
</success_criteria>

<output>
`.planning/phases/10-action-plan/03-system-recommendations-SUMMARY.md`
</output>
