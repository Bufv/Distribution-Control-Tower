---
phase: 10-action-plan
plan: 04
type: execute
wave: 2
depends_on: [02]
files_modified:
  - frontend/src/components/CommercialActionPlan.jsx
  - frontend/src/components/TacticCard.jsx
  - frontend/src/components/TacticDetailModal.jsx
autonomous: true
must_haves:
  truths:
    - Manager bisa lihat tactics dalam swimlane: Draft / Submitted / Approved / Rejected / Executed
    - Manager bisa create tactic manual dari tombol [+ Create Tactic]
    - Director bisa approve/reject tactic di swimlane Submitted
    - Manager bisa execute tactic yang sudah approved
    - TacticDetailModal punya 3 mode: create / edit / view
  artifacts:
    - CommercialActionPlan.jsx (kanban swimlane)
    - TacticCard.jsx
    - TacticDetailModal.jsx (create/edit/view + comments + audit trail)
  key_links:
    - CommercialActionPlan → GET/POST /api/tactics
    - TacticDetailModal → PUT /api/tactics/{id}, POST /api/tactics/{id}/submit/approve/reject/execute
---

<objective>
Tab utama Commercial Action Plan dengan kanban swimlane untuk mengelola lifecycle tactic.
</objective>

<context>
@frontend/src/App.jsx
@frontend/src/api.js
@frontend/src/components/MITLDetailModal.jsx (comment thread pattern)
@frontend/src/components/EscalationPanel.jsx (pattern for conditional buttons)
</context>

<tasks>

<task type="auto">
<name>Task 1: Buat TacticCard komponen</name>
<files>frontend/src/components/TacticCard.jsx</files>
<action>
Props: { tactic, user, onClick, onAction }

Tampilkan dalam card kecil (w-72, bg-white, rounded-lg, border, shadow-sm):
- Title (font-semibold, truncate)
- Tactic type badge (overstock=red, stockout=orange, redistribution=purple, investigation=blue)
- Severity badge (high/medium/low)
- Region text
- Financial impact (format Rp)
- Created date (relative: "2 hari lalu")
- Status badge:
  - draft: gray (bg-gray-100 text-gray-700)
  - submitted: blue with pulsing dot (bg-blue-100 text-blue-700) — "Menunggu Approval"
  - approved: green (bg-green-100 text-green-700)
  - rejected: red (bg-red-100 text-red-700)
  - executed: green with check (bg-green-100 text-green-700) — "Terverifikasi" if verified

Conditional buttons (bottom of card):
- Manager + draft: [Edit] [Submit] [Hapus]
- Manager + approved: [Execute]
- Manager + rejected: [Revisi]
- Director + submitted: [Approve ✓] (green) [Reject ✕] (red)
- Other states: no buttons

onAction dipanggil dengan (tactic, actionType) — parent handle API call.
onClick dipanggil saat card di-klik (buka modal detail).
</action>
<verify>Render card dengan status draft → tombol Edit/Submit/Hapus muncul</verify>
<done>TacticCard dengan conditional buttons.</done>
</task>

<task type="auto">
<name>Task 2: Buat CommercialActionPlan swimlane component</name>
<files>frontend/src/components/CommercialActionPlan.jsx</files>
<action>
Layout utama untuk tab Action Plan.

Struktur:
```jsx
export default function CommercialActionPlan({ user }) {
  // State
  const [tactics, setTactics] = useState([])
  const [loading, setLoading] = useState(true)
  const [detailTactic, setDetailTactic] = useState(null)
  const [showCreate, setShowCreate] = useState(false)

  // Fetch GET /api/tactics
  // Kelompokkan ke swimlanes berdasarkan status

  const swimlanes = [
    { key: 'draft', label: 'Draft', icon: '📝', color: 'gray' },
    { key: 'submitted', label: 'Menunggu Approval', icon: '⏳', color: 'blue' },
    { key: 'approved', label: 'Disetujui', icon: '✅', color: 'green' },
    { key: 'rejected', label: 'Ditolak', icon: '❌', color: 'red' },
    { key: 'executed', label: 'Tereksekusi', icon: '✓', color: 'green-dark' },
  ]

  // Setiap swimlane: header + horizontal scroll container of TacticCards
  // Filter: hanya tampilkan swimlane yang relevan untuk role
  //   - Manager: lihat semua
  //   - Director: lihat submitted/approved/rejected/executed (tidak draft orang lain)

  // Handler untuk onAction:
  // submit: POST /api/tactics/{id}/submit
  // approve: POST /api/tactics/{id}/approve (director only)
  // reject: POST /api/tactics/{id}/reject (director only, prompt reason)
  // execute: POST /api/tactics/{id}/execute
  // revise: POST /api/tactics/{id}/revise
  // delete: DELETE /api/tactics/{id}
  // Setelah action: refresh fetch

  // [+ Create Tactic] button — untuk manager
  // Buka TacticDetailModal dalam mode 'create'
}
```

Layout: grid swimlane horizontal (1 column di mobile, 3-5 columns di lg).
Setiap swimlane: header dengan count badge + horizontal scroll (overflow-x-auto) dari TacticCards.

Loading state: skeleton per swimlane.
Empty state per swimlane: "Belum ada tactic" dengan icon.

TacticDetailModal inline state — setDetailTactic untuk view/edit.
</action>
<verify>Tab Action Plan menampilkan 5 swimlane dengan cards yang sesuai</verify>
<done>CommercialActionPlan dengan swimlane layout.</done>
</task>

<task type="auto">
<name>Task 3: Buat TacticDetailModal</name>
<files>frontend/src/components/TacticDetailModal.jsx</files>
<action>
Modal full-feature untuk create/edit/view tactic. Props: { mode, tactic, user, onClose, onAction }.

**Mode CREATE:**
- Form dengan semua field: title, description, tactic_type, severity, region, distributor (dropdown dari GET /api/distributors), sku (dropdown dari GET /api/sales/skus), financial_impact_est, reason_code (4 pilihan existing), proposal_notes (required, min 10).
- Expected Outcome section: metric (dropdown), direction (increase/decrease), change_pct (number 0-100), verification_window_days (number, default 7).
- Footer: [Save as Draft] → POST /api/tactics → tutup + refresh parent.

**Mode EDIT** (sama seperti CREATE tapi pre-filled):
- Footer: [Save] → PUT /api/tactics/{id} | [Submit for Approval] → PUT + POST submit | [Cancel]

**Mode VIEW** (tabs):
- Tab 1: **Detail** — semua field read-only
- Tab 2: **Diskusi** — comment thread (sama pattern seperti di MITLDetailModal: GET/POST /api/recommendations/{id}/comments — TAPI untuk tactic, endpoint baru atau reuse. Untuk MVP, comment di tactic_id saja pakai endpoint /api/tactics/{id}/comments — tapi untuk simplify, GUNAKAN ulang pattern comment yang ada: GET/POST comment dengan related_entity_type='tactic'. Buat handler comment di frontend langsung state management aja tanpa API baru — cukup tampilkan static dulu, comment via recommend API.)
  
  Actually untuk MVP: comment thread tidak perlu di tactic. Komentar bisa tetap di recommendation card. Tapi untuk konsistensi UX, bikin comment area di TacticDetailModal dengan state lokal (disimpan di frontend state, tidak persist ke DB untuk MVP). Simplifikasi.

- Tab 3: **Riwayat** — timeline status changes (dari created_at → submitted_at → dll). Ini di-render dari data model (field timestamp), bukan dari tabel terpisah.
- Tab 4: **Verifikasi** — baseline_value, outcome_value, verification_status (jika sudah executed).

Footer buttons (contextual — sama seperti TacticCard tapi lebih besar).

Gunakan tailwind, modal overlay (fixed inset-0 bg-black/40), max-w-3xl.
</action>
<verify>Klik [+ Create Tactic] → modal muncul dengan form → isi → submit → muncul di swimlane Draft</verify>
<done>TacticDetailModal dengan 3 mode dan 4 tabs.</done>
</task>

</tasks>

<verification>
1. [+ Create Tactic] → modal create → submit → muncul di Draft
2. Submit tactic → pindah ke Submitted
3. Director approve → pindah ke Approved
4. Manager execute → pindah ke Executed
5. Director reject → pindah ke Rejected + bisa direvise
</verification>

<success_criteria>
- Kanban swimlane berfungsi penuh
- Tactic bisa create manual dan dari system recommendation
- Full lifecycle: draft → submitted → approved/rejected → executed
</success_criteria>

<output>
`.planning/phases/10-action-plan/04-action-plan-tab-SUMMARY.md`
</output>
