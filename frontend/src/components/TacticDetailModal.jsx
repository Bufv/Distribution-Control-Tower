import { useState, useEffect } from 'react'
import { api } from '../api'

const REASON_CODES = [
  'Logistics / Force Majeure',
  'Commercial Strategy',
  'Market Shock',
  'Data Accuracy Doubt',
]

const TACTIC_TYPES = [
  { value: 'overstock', label: 'Overstock' },
  { value: 'stockout', label: 'Stockout' },
  { value: 'redistribution', label: 'Redistribusi' },
  { value: 'investigation', label: 'Investigasi' },
]

const SEVERITIES = [
  { value: 'high', label: 'High' },
  { value: 'medium', label: 'Medium' },
  { value: 'low', label: 'Low' },
]

const METRICS = [
  { value: 'sell_in', label: 'Sell-In' },
  { value: 'sell_out', label: 'Sell-Out' },
  { value: 'inventory', label: 'Inventory' },
  { value: 'gap', label: 'Gap Sell-In/Sell-Out' },
]

const DIRECTIONS = [
  { value: 'increase', label: 'Naik' },
  { value: 'decrease', label: 'Turun' },
]

function formatRp(val) {
  if (!val) return '—'
  if (val >= 1_000_000_000) return `Rp ${(val / 1_000_000_000).toFixed(1)}M`
  if (val >= 1_000_000) return `Rp ${(val / 1_000_000).toFixed(0)}jt`
  if (val >= 1_000) return `Rp ${(val / 1_000).toFixed(0)}rb`
  return `Rp ${val}`
}

const TABS = ['Detail', 'Diskusi', 'Riwayat', 'Verifikasi']

export default function TacticDetailModal({ mode, tactic, user, onClose, onAction }) {
  const [activeTab, setActiveTab] = useState('Detail')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [distributors, setDistributors] = useState([])
  const [skus, setSkus] = useState([])
  const [comments, setComments] = useState([])
  const [commentText, setCommentText] = useState('')

  // Form state
  const [form, setForm] = useState({
    title: '', description: '', tactic_type: 'investigation', severity: 'medium',
    region: '', distributor_id: '', sku_id: '', financial_impact_est: '',
    reason_code: '', proposal_notes: '',
    expected_metric: '', expected_direction: '', expected_change_pct: '',
    verification_window_days: 7,
  })

  useEffect(() => {
    api('/api/distributors').then(r => r.ok ? r.json() : []).then(setDistributors).catch(() => {})
    api('/api/sales/skus').then(r => r.ok ? r.json() : []).then(setSkus).catch(() => {})
  }, [])

  useEffect(() => {
    if (mode === 'create') {
      setForm({
        title: '', description: '', tactic_type: 'investigation', severity: 'medium',
        region: '', distributor_id: '', sku_id: '', financial_impact_est: '',
        reason_code: '', proposal_notes: '',
        expected_metric: '', expected_direction: '', expected_change_pct: '',
        verification_window_days: 7,
      })
    } else if (tactic) {
      setForm({
        title: tactic.title || '',
        description: tactic.description || '',
        tactic_type: tactic.tactic_type || 'investigation',
        severity: tactic.severity || 'medium',
        region: tactic.region || '',
        distributor_id: tactic.distributor_id || '',
        sku_id: tactic.sku_id || '',
        financial_impact_est: tactic.financial_impact_est || '',
        reason_code: tactic.reason_code || '',
        proposal_notes: tactic.proposal_notes || '',
        expected_metric: tactic.expected_metric || '',
        expected_direction: tactic.expected_direction || '',
        expected_change_pct: tactic.expected_change_pct || '',
        verification_window_days: tactic.verification_window_days || 7,
      })
    }
  }, [mode, tactic])

  const handleChange = (field, value) => {
    setForm(prev => ({ ...prev, [field]: value }))
  }

  const handleSave = async () => {
    setLoading(true)
    setError('')
    try {
      const body = { ...form }
      if (body.financial_impact_est) body.financial_impact_est = parseInt(body.financial_impact_est) || 0
      if (body.expected_change_pct) body.expected_change_pct = parseFloat(body.expected_change_pct) || 0

      const res = await api('/api/tactics', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || 'Gagal menyimpan')
      }
      onAction()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleUpdate = async () => {
    if (!tactic) return
    setLoading(true)
    setError('')
    try {
      const body = { ...form }
      if (body.financial_impact_est) body.financial_impact_est = parseInt(body.financial_impact_est) || 0
      if (body.expected_change_pct) body.expected_change_pct = parseFloat(body.expected_change_pct) || 0

      const res = await api(`/api/tactics/${tactic.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(body),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || 'Gagal mengupdate')
      }
      onAction()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleQuickAction = async (action) => {
    setLoading(true)
    setError('')
    try {
      let res
      switch (action) {
        case 'submit':
          res = await api(`/api/tactics/${tactic.id}/submit`, { method: 'POST' })
          break
        case 'approve':
          res = await api(`/api/tactics/${tactic.id}/approve`, { method: 'POST' })
          break
        case 'reject': {
          const reason = prompt('Alasan penolakan:')
          if (!reason || reason.length < 5) return
          res = await api(`/api/tactics/${tactic.id}/reject`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason }),
          })
          break
        }
        case 'execute':
          res = await api(`/api/tactics/${tactic.id}/execute`, { method: 'POST' })
          break
        case 'revise':
          res = await api(`/api/tactics/${tactic.id}/revise`, { method: 'POST' })
          break
        case 'delete':
          res = await api(`/api/tactics/${tactic.id}`, { method: 'DELETE' })
          break
      }
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || 'Gagal')
      }
      onAction()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  const handleCommentSubmit = async (e) => {
    e.preventDefault()
    if (!commentText.trim() || !tactic) return
    setComments(prev => [...prev, {
      id: Date.now(),
      user_id: user?.username || 'User',
      content: commentText.trim(),
      created_at: new Date().toISOString(),
    }])
    setCommentText('')
  }

  const isEditable = mode === 'create' || (mode === 'edit' && tactic?.status === 'draft')
  const isManager = user?.role === 'manager'
  const isDirector = user?.role === 'director'
  const isOwner = tactic?.created_by === user?.id

  const renderForm = () => (
    <div className="space-y-4 max-h-[60vh] overflow-y-auto pr-2">
      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Title *</label>
        <input
          value={form.title}
          onChange={e => handleChange('title', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
          disabled={!isEditable}
          required
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Description</label>
        <textarea
          value={form.description}
          onChange={e => handleChange('description', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm"
          rows={3}
          disabled={!isEditable}
        />
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Tactic Type</label>
          <select value={form.tactic_type} onChange={e => handleChange('tactic_type', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm" disabled={!isEditable}>
            {TACTIC_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Severity</label>
          <select value={form.severity} onChange={e => handleChange('severity', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm" disabled={!isEditable}>
            {SEVERITIES.map(s => <option key={s.value} value={s.value}>{s.label}</option>)}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Region</label>
          <input value={form.region} onChange={e => handleChange('region', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm" disabled={!isEditable} />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Distributor</label>
          <select value={form.distributor_id} onChange={e => handleChange('distributor_id', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm" disabled={!isEditable}>
            <option value="">— Pilih —</option>
            {distributors.map(d => (
              <option key={d.id} value={d.id}>{d.name} ({d.region})</option>
            ))}
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">SKU</label>
          <select value={form.sku_id} onChange={e => handleChange('sku_id', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm" disabled={!isEditable}>
            <option value="">— Pilih —</option>
            {skus.map(s => (
              <option key={s.id} value={s.id}>{s.name} ({s.code})</option>
            ))}
          </select>
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-700 mb-1">Financial Impact (Rp)</label>
          <input type="number" value={form.financial_impact_est}
            onChange={e => handleChange('financial_impact_est', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm" disabled={!isEditable} />
        </div>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Reason Code</label>
        <select value={form.reason_code} onChange={e => handleChange('reason_code', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm" disabled={!isEditable}>
          <option value="">— Select —</option>
          {REASON_CODES.map(c => <option key={c} value={c}>{c}</option>)}
        </select>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-700 mb-1">Proposal Notes *</label>
        <textarea value={form.proposal_notes} onChange={e => handleChange('proposal_notes', e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded text-sm" rows={3}
          disabled={!isEditable} required />
      </div>

      <div className="border-t pt-4">
        <h4 className="text-sm font-medium text-gray-700 mb-3">Expected Outcome</h4>
        <div className="grid grid-cols-3 gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Metric</label>
            <select value={form.expected_metric} onChange={e => handleChange('expected_metric', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm" disabled={!isEditable}>
              <option value="">—</option>
              {METRICS.map(m => <option key={m.value} value={m.value}>{m.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Direction</label>
            <select value={form.expected_direction} onChange={e => handleChange('expected_direction', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm" disabled={!isEditable}>
              <option value="">—</option>
              {DIRECTIONS.map(d => <option key={d.value} value={d.value}>{d.label}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-700 mb-1">Change (%)</label>
            <input type="number" value={form.expected_change_pct}
              onChange={e => handleChange('expected_change_pct', e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded text-sm" disabled={!isEditable}
              min="0" max="100" step="5" />
          </div>
        </div>
        <div className="mt-2">
          <label className="block text-xs font-medium text-gray-700 mb-1">Verification Window (days)</label>
          <input type="number" value={form.verification_window_days}
            onChange={e => handleChange('verification_window_days', parseInt(e.target.value) || 7)}
            className="w-full px-3 py-2 border border-gray-300 rounded text-sm" disabled={!isEditable}
            min="1" max="90" />
        </div>
      </div>
    </div>
  )

  const renderDetail = () => (
    <div className="space-y-4 text-sm">
      <div>
        <p className="font-medium text-gray-900">{form.title}</p>
        <p className="text-gray-600 mt-1 whitespace-pre-wrap">{form.description || '—'}</p>
      </div>
      <div className="grid grid-cols-2 gap-4 text-xs">
        <div><span className="text-gray-500">Type:</span> <span className="font-medium">{form.tactic_type}</span></div>
        <div><span className="text-gray-500">Severity:</span> <span className="font-medium">{form.severity}</span></div>
        <div><span className="text-gray-500">Region:</span> <span className="font-medium">{form.region || '—'}</span></div>
        <div><span className="text-gray-500">Financial Impact:</span> <span className="font-medium">{formatRp(form.financial_impact_est)}</span></div>
        <div><span className="text-gray-500">Reason Code:</span> <span className="font-medium">{form.reason_code || '—'}</span></div>
        <div><span className="text-gray-500">Status:</span> <span className="font-medium capitalize">{tactic?.status}</span></div>
      </div>
      {form.proposal_notes && (
        <div>
          <p className="text-xs text-gray-500 mb-1">Proposal Notes:</p>
          <p className="text-gray-700 whitespace-pre-wrap">{form.proposal_notes}</p>
        </div>
      )}
      {(form.expected_metric) && (
        <div className="bg-blue-50 rounded p-3">
          <p className="text-xs font-medium text-blue-800 mb-1">Expected Outcome</p>
          <p className="text-xs text-blue-700">
            {form.expected_metric && METRICS.find(m => m.value === form.expected_metric)?.label} —
            {form.expected_direction === 'increase' ? ' Naik ' : ' Turun '}
            {form.expected_change_pct ? `${form.expected_change_pct}%` : '—'}
            &nbsp;· Window: {form.verification_window_days || 7} hari
          </p>
        </div>
      )}
    </div>
  )

  const renderComments = () => (
    <div>
      <div className="max-h-48 overflow-y-auto mb-3 space-y-2">
        {comments.length === 0 ? (
          <p className="text-sm text-gray-400 text-center py-4">Belum ada diskusi</p>
        ) : (
          comments.map(c => (
            <div key={c.id} className="bg-gray-50 rounded p-2 border border-gray-100">
              <div className="flex items-center justify-between mb-1">
                <span className="text-xs font-medium text-blue-600">{c.user_id}</span>
                <span className="text-xs text-gray-400">{new Date(c.created_at).toLocaleString()}</span>
              </div>
              <p className="text-sm text-gray-700 whitespace-pre-wrap">{c.content}</p>
            </div>
          ))
        )}
      </div>

      {isEditable && (
        <form onSubmit={handleCommentSubmit} className="flex gap-2">
          <input
            value={commentText}
            onChange={e => setCommentText(e.target.value)}
            className="flex-1 px-3 py-2 border border-gray-300 rounded text-sm"
            placeholder="Tulis komentar..."
          />
          <button type="submit" disabled={!commentText.trim()}
            className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
            Kirim
          </button>
        </form>
      )}
    </div>
  )

  const renderTimeline = () => {
    if (!tactic) return <p className="text-sm text-gray-400">Tidak ada data</p>
    const events = [
      { label: 'Dibuat', time: tactic.created_at, user: tactic.created_by },
      { label: 'Disubmit', time: tactic.submitted_at, user: tactic.submitted_by },
      { label: 'Disetujui', time: tactic.approved_at, user: tactic.approved_by },
      { label: 'Ditolak', time: tactic.rejected_at, user: tactic.rejected_by, note: tactic.rejected_reason },
      { label: 'Dieksekusi', time: tactic.executed_at, user: tactic.executed_by },
    ].filter(e => e.time)

    return (
      <div className="space-y-3">
        {events.length === 0 ? (
          <p className="text-sm text-gray-400">Belum ada riwayat</p>
        ) : (
          events.map((e, i) => (
            <div key={i} className="flex gap-3">
              <div className="w-2 h-2 mt-1.5 rounded-full bg-blue-500 shrink-0" />
              <div>
                <p className="text-sm font-medium text-gray-700">{e.label}</p>
                <p className="text-xs text-gray-500">
                  {new Date(e.time).toLocaleString()}
                  {e.note && <span className="text-red-500"> — {e.note}</span>}
                </p>
              </div>
            </div>
          ))
        )}
      </div>
    )
  }

  const renderVerification = () => {
    if (!tactic) return <p className="text-sm text-gray-400">Tidak ada data</p>
    if (tactic.status !== 'executed') return <p className="text-sm text-gray-400">Verifikasi dilakukan setelah tactic dieksekusi</p>

    const vStatus = tactic.verification_status
    const vStatusColor = vStatus === 'verified' ? 'text-green-700 bg-green-100' :
      vStatus === 'deviation_detected' ? 'text-orange-700 bg-orange-100' : 'text-gray-700 bg-gray-100'

    return (
      <div className="space-y-3 text-sm">
        <div className="flex items-center gap-2">
          <span className="text-gray-500">Status:</span>
          <span className={`font-medium px-2 py-0.5 rounded ${vStatusColor}`}>
            {vStatus === 'verified' ? 'Terverifikasi ✅' :
             vStatus === 'deviation_detected' ? 'Deviasi ⚠️' : 'Menunggu verifikasi'}
          </span>
        </div>
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="bg-gray-50 rounded p-2">
            <p className="text-gray-500">Baseline</p>
            <p className="font-mono font-medium">{tactic.baseline_value ?? '—'}</p>
            {tactic.baseline_recorded_at && <p className="text-gray-400">{new Date(tactic.baseline_recorded_at).toLocaleDateString()}</p>}
          </div>
          <div className="bg-gray-50 rounded p-2">
            <p className="text-gray-500">Outcome</p>
            <p className="font-mono font-medium">{tactic.outcome_value ?? '—'}</p>
            {tactic.outcome_recorded_at && <p className="text-gray-400">{new Date(tactic.outcome_recorded_at).toLocaleDateString()}</p>}
          </div>
        </div>
        {tactic.deviation_notes && (
          <div className="bg-orange-50 border border-orange-200 rounded p-2 text-xs text-orange-800">
            {tactic.deviation_notes}
          </div>
        )}
        {tactic.expected_metric && (
          <div className="bg-blue-50 rounded p-2 text-xs text-blue-700">
            Target: {tactic.expected_direction === 'increase' ? 'Naik' : 'Turun'} {tactic.expected_change_pct ? `${tactic.expected_change_pct.toFixed(0)}%` : '—'}
            &nbsp;· Window: {tactic.verification_window_days} hari
          </div>
        )}
      </div>
    )
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'Detail': return isEditable && mode !== 'view' ? renderForm() : renderDetail()
      case 'Diskusi': return renderComments()
      case 'Riwayat': return renderTimeline()
      case 'Verifikasi': return renderVerification()
      default: return null
    }
  }

  const renderFooter = () => {
    if (mode === 'create' || (mode === 'edit' && tactic?.status === 'draft')) {
      return (
        <div className="flex gap-2">
          <button onClick={onClose} className="flex-1 py-2 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200">
            Batal
          </button>
          <button onClick={mode === 'create' ? handleSave : handleUpdate}
            disabled={loading || !form.title}
            className="flex-1 py-2 bg-blue-600 text-white rounded text-sm font-medium hover:bg-blue-700 disabled:opacity-50">
            {loading ? 'Menyimpan...' : mode === 'create' ? 'Simpan sebagai Draft' : 'Simpan Perubahan'}
          </button>
          {mode === 'edit' && (
            <button onClick={() => handleQuickAction('submit')} disabled={loading}
              className="px-4 py-2 bg-gray-700 text-white rounded text-sm font-medium hover:bg-gray-800">
              Submit
            </button>
          )}
        </div>
      )
    }

    return (
      <div className="flex gap-2">
        <button onClick={onClose} className="flex-1 py-2 bg-gray-100 text-gray-700 rounded text-sm hover:bg-gray-200">
          Tutup
        </button>

        {isManager && tactic?.status === 'approved' && (
          <button onClick={() => handleQuickAction('execute')} disabled={loading}
            className="px-6 py-2 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700">
            Execute
          </button>
        )}

        {isManager && isOwner && tactic?.status === 'rejected' && (
          <button onClick={() => handleQuickAction('revise')} disabled={loading}
            className="px-6 py-2 bg-yellow-600 text-white rounded text-sm font-medium hover:bg-yellow-700">
            Revisi
          </button>
        )}

        {isDirector && tactic?.status === 'submitted' && (
          <>
            <button onClick={() => handleQuickAction('approve')} disabled={loading}
              className="px-6 py-2 bg-green-600 text-white rounded text-sm font-medium hover:bg-green-700">
              Approve
            </button>
            <button onClick={() => handleQuickAction('reject')} disabled={loading}
              className="px-6 py-2 border border-red-300 text-red-700 rounded text-sm font-medium hover:bg-red-50">
              Reject
            </button>
          </>
        )}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[85vh] flex flex-col"
        onClick={e => e.stopPropagation()}>

        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
          <h3 className="text-lg font-semibold text-gray-900">
            {mode === 'create' ? 'Buat Tactic Baru' :
             mode === 'edit' ? 'Edit Tactic' : 'Detail Tactic'}
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>

        {error && (
          <div className="mx-6 mt-3 text-red-600 text-sm bg-red-50 px-3 py-2 rounded">{error}</div>
        )}

        <div className="px-6 pt-4 pb-2 border-b border-gray-100 shrink-0">
          <div className="flex gap-4">
            {TABS.map(tab => (
              <button key={tab}
                onClick={() => setActiveTab(tab)}
                className={`text-sm pb-2 border-b-2 transition-colors ${
                  activeTab === tab
                    ? 'text-blue-600 border-blue-600 font-medium'
                    : 'text-gray-500 border-transparent hover:text-gray-700'
                }`}
              >
                {tab}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4">
          {renderTabContent()}
        </div>

        <div className="px-6 py-3 border-t border-gray-200 shrink-0">
          {renderFooter()}
        </div>
      </div>
    </div>
  )
}
