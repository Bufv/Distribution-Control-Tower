import { useState, useEffect, useRef } from 'react'
import { api } from '../api'

const SEVERITY_STYLES = {
  high: { badge: 'bg-red-600', label: 'High' },
  medium: { badge: 'bg-yellow-600', label: 'Medium' },
  low: { badge: 'bg-blue-600', label: 'Low' },
}

const STATUS_STYLES = {
  overstock: { label: 'Overstock', color: 'text-red-700 bg-red-100' },
  healthy: { label: 'Sehat', color: 'text-green-700 bg-green-100' },
  understock: { label: 'Understock', color: 'text-yellow-700 bg-yellow-100' },
  out_of_stock: { label: 'Out of Stock', color: 'text-gray-700 bg-gray-100' },
  no_demand: { label: 'No Demand', color: 'text-gray-700 bg-gray-100' },
}

const REASON_CODES = [
  'Logistics / Force Majeure',
  'Commercial Strategy',
  'Market Shock',
  'Data Accuracy Doubt',
]

function CollapsibleSection({ title, defaultOpen, children }) {
  const [open, setOpen] = useState(defaultOpen)
  return (
    <div className="border border-gray-200 rounded-lg">
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center justify-between px-3 py-2 text-sm font-medium text-gray-700 hover:bg-gray-50 rounded-lg"
      >
        {title}
        <span className={`transform transition-transform ${open ? 'rotate-180' : ''}`}>▼</span>
      </button>
      {open && <div className="px-3 pb-3">{children}</div>}
    </div>
  )
}

export default function MITLDetailModal({ card, onClose }) {
  const style = SEVERITY_STYLES[card.severity] || SEVERITY_STYLES.low
  const [inventory, setInventory] = useState(null)
  const [invLoading, setInvLoading] = useState(false)
  const [invError, setInvError] = useState('')
  const [comments, setComments] = useState([])
  const [commentText, setCommentText] = useState('')
  const [commentLoading, setCommentLoading] = useState(false)
  const [commentError, setCommentError] = useState('')
  const [commentSuccess, setCommentSuccess] = useState(false)
  const [auditEntries, setAuditEntries] = useState([])
  const [auditLoading, setAuditLoading] = useState(false)
  const [actionMode, setActionMode] = useState(null)
  const [reasonCode, setReasonCode] = useState('')
  const [notes, setNotes] = useState('')
  const [escReason, setEscReason] = useState('')
  const [actionError, setActionError] = useState('')
  const [actionLoading, setActionLoading] = useState(false)
  const [actionSuccess, setActionSuccess] = useState(false)
  const bottomRef = useRef(null)

  useEffect(() => {
    if (card.distributor_id) {
      setInvLoading(true)
      api(`/api/inventory/detail?distributor_id=${card.distributor_id}`)
        .then(r => r.ok ? r.json() : null)
        .then(d => { setInventory(d); setInvLoading(false) })
        .catch(() => { setInvError('Gagal memuat data inventory'); setInvLoading(false) })
    }

    api(`/api/recommendations/${card.id}/comments`)
      .then(r => r.ok ? r.json() : [])
      .then(setComments)
      .catch(() => {})

    api(`/api/audit-trail?recommendation_card_id=${card.id}`)
      .then(r => r.ok ? r.json() : [])
      .then(setAuditLoading)
      .catch(() => {})
  }, [card.id, card.distributor_id])

  useEffect(() => {
    setAuditLoading(true)
    api(`/api/audit-trail?recommendation_card_id=${card.id}`)
      .then(r => r.ok ? r.json() : [])
      .then(d => { setAuditEntries(d); setAuditLoading(false) })
      .catch(() => { setAuditEntries([]); setAuditLoading(false) })
  }, [card.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [comments])

  const loadComments = async () => {
    try {
      const res = await api(`/api/recommendations/${card.id}/comments`)
      if (res.ok) setComments(await res.json())
    } catch {}
  }

  const handleActionSubmit = async (e) => {
    e.preventDefault()
    if (actionMode === 'escalate') {
      if (escReason.trim().length < 10) {
        setActionError('Reason must be at least 10 characters')
        return
      }
      setActionError('')
      setActionLoading(true)
      try {
        const res = await api(`/api/recommendations/${card.id}/escalate?reason=${encodeURIComponent(escReason.trim())}`, { method: 'POST' })
        if (!res.ok) { const err = await res.json(); throw new Error(err.detail || 'Failed to escalate') }
        setActionSuccess(true)
        setTimeout(() => onClose(), 2000)
      } catch (err) { setActionError(err.message) }
      finally { setActionLoading(false) }
      return
    }

    if (!reasonCode) { setActionError('Please select a reason code'); return }
    if (notes.trim().length < 10) { setActionError('Notes must be at least 10 characters'); return }
    setActionError('')
    setActionLoading(true)
    try {
      const res = await api(`/api/recommendations/${card.id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: actionMode, reason_code: reasonCode, notes: notes.trim() }),
      })
      if (!res.ok) { const err = await res.json(); throw new Error(err.detail || 'Action failed') }
      setActionSuccess(true)
      setTimeout(() => onClose(), 2000)
    } catch (err) { setActionError(err.message) }
    finally { setActionLoading(false) }
  }

  const handleCommentSubmit = async (e) => {
    e.preventDefault()
    if (!commentText.trim()) { setCommentError('Comment cannot be empty'); return }
    setCommentError('')
    setCommentLoading(true)
    try {
      const res = await api(`/api/recommendations/${card.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: commentText.trim() }),
      })
      if (!res.ok) { const err = await res.json(); throw new Error(err.detail || 'Failed to post') }
      setCommentText('')
      setCommentSuccess(true)
      setTimeout(() => setCommentSuccess(false), 2000)
      await loadComments()
    } catch (err) { setCommentError(err.message) }
    finally { setCommentLoading(false) }
  }

  const renderInventory = () => {
    if (invLoading) return <p className="text-sm text-gray-400 py-2">Memuat data inventory...</p>
    if (invError) return <p className="text-sm text-red-500 py-2">{invError}</p>
    if (!inventory) return <p className="text-sm text-gray-400 py-2">Data inventory tidak tersedia</p>
    return (
      <div className="overflow-x-auto">
        <p className="text-xs text-gray-500 mb-2">{inventory.distributor_name} — {inventory.items.length} SKU</p>
        <table className="w-full text-xs">
          <thead>
            <tr className="bg-gray-50 border-b">
              <th className="text-left px-2 py-1 font-medium text-gray-600">SKU</th>
              <th className="text-right px-2 py-1 font-medium text-gray-600">Stok</th>
              <th className="text-right px-2 py-1 font-medium text-gray-600">DOI</th>
              <th className="text-right px-2 py-1 font-medium text-gray-600">Demand</th>
              <th className="text-center px-2 py-1 font-medium text-gray-600">Status</th>
            </tr>
          </thead>
          <tbody>
            {inventory.items.map(item => {
              const s = STATUS_STYLES[item.status] || STATUS_STYLES.out_of_stock
              return (
                <tr key={item.sku_id} className="border-b border-gray-100">
                  <td className="px-2 py-1 text-gray-900">{item.sku_name}</td>
                  <td className="px-2 py-1 text-right font-mono">{item.current_stock.toLocaleString()}</td>
                  <td className="px-2 py-1 text-right font-mono">{item.doi !== null ? item.doi : '—'}</td>
                  <td className="px-2 py-1 text-right font-mono">{item.daily_demand > 0 ? item.daily_demand : '—'}</td>
                  <td className="px-2 py-1 text-center">
                    <span className={`px-1.5 py-0.5 rounded font-medium ${s.color}`}>{s.label}</span>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>
    )
  }

  const renderActions = () => {
    if (!actionMode) {
      return (
        <div className="flex gap-2">
          <button
            onClick={() => setActionMode('modify')}
            disabled={!card.sell_in_cuttable}
            className={`flex-1 text-sm py-2 rounded font-medium ${
              card.sell_in_cuttable
                ? 'bg-blue-600 text-white hover:bg-blue-700'
                : 'bg-gray-300 text-gray-500 cursor-not-allowed'
            }`}
            title={!card.sell_in_cuttable ? 'Disabled due to upcoming promo' : ''}
          >
            Modify
          </button>
          <button
            onClick={() => setActionMode('reject')}
            className="flex-1 text-sm py-2 rounded font-medium bg-red-600 text-white hover:bg-red-700"
          >
            Reject
          </button>
          <button
            onClick={() => setActionMode('escalate')}
            className="flex-1 text-sm py-2 rounded font-medium border border-gray-300 text-gray-700 hover:bg-gray-100"
          >
            Escalate
          </button>
        </div>
      )
    }

    return (
      <form onSubmit={handleActionSubmit}>
        <div className="flex items-center justify-between mb-3">
          <p className="text-sm font-medium text-gray-700 capitalize">
            {actionMode === 'escalate' ? 'Escalate to Commercial/Legal' : `${actionMode} Recommendation`}
          </p>
          <button type="button" onClick={() => { setActionMode(null); setActionError('') }} className="text-xs text-gray-500 hover:text-gray-700">
            Batal
          </button>
        </div>

        {actionMode !== 'escalate' && (
          <div className="mb-3">
            <label className="block text-xs font-medium text-gray-700 mb-1">Reason Code</label>
            <select
              value={reasonCode}
              onChange={e => setReasonCode(e.target.value)}
              className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
            >
              <option value="">-- Select --</option>
              {REASON_CODES.map(c => <option key={c} value={c}>{c}</option>)}
            </select>
          </div>
        )}

        <div className="mb-3">
          <label className="block text-xs font-medium text-gray-700 mb-1">
            {actionMode === 'escalate' ? 'Reason' : 'Notes'}
          </label>
          <textarea
            value={actionMode === 'escalate' ? escReason : notes}
            onChange={e => actionMode === 'escalate' ? setEscReason(e.target.value) : setNotes(e.target.value)}
            className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
            rows={3}
            placeholder={actionMode === 'escalate' ? 'Describe why this needs attention (min 10 chars)...' : 'Describe your reasoning (min 10 chars)...'}
          />
          <p className="text-xs text-gray-400 mt-1">
            {(actionMode === 'escalate' ? escReason.length : notes.length)}/10 minimum
          </p>
        </div>

        {actionError && <div className="mb-3 text-red-600 text-xs bg-red-50 px-2 py-1 rounded">{actionError}</div>}
        {actionSuccess && <div className="mb-3 text-green-600 text-xs bg-green-50 px-2 py-1 rounded">Action recorded! Menutup...</div>}

        <button
          type="submit"
          disabled={actionLoading || actionSuccess}
          className="w-full text-sm py-2 rounded font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
        >
          {actionLoading ? 'Processing...' : actionSuccess ? 'Done' : actionMode === 'modify' ? 'Confirm Modify' : actionMode === 'reject' ? 'Confirm Reject' : 'Send Escalation'}
        </button>
      </form>
    )
  }

  const renderComments = () => {
    return (
      <div>
        <div className="max-h-48 overflow-y-auto mb-3 space-y-2">
          {comments.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">Belum ada diskusi. Mulai diskusi!</p>
          ) : (
            comments.map(c => (
              <div key={c.id} className="bg-gray-50 rounded p-2 border border-gray-100">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-blue-600">{c.user_id || 'Unknown'}</span>
                  <span className="text-xs text-gray-400">{new Date(c.created_at).toLocaleString()}</span>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{c.content}</p>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={handleCommentSubmit}>
          <textarea
            value={commentText}
            onChange={e => setCommentText(e.target.value)}
            className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm"
            rows={2}
            placeholder="Write a comment... Use @username to notify someone"
          />
          {commentError && <p className="text-xs text-red-600 mt-1">{commentError}</p>}
          {commentSuccess && <p className="text-xs text-green-600 mt-1">Comment posted!</p>}
          <button
            type="submit"
            disabled={commentLoading || !commentText.trim()}
            className="mt-2 text-sm py-1.5 px-4 rounded font-medium bg-blue-600 text-white hover:bg-blue-700 disabled:opacity-50"
          >
            {commentLoading ? 'Posting...' : 'Post Comment'}
          </button>
        </form>
      </div>
    )
  }

  const renderAuditTrail = () => {
    if (auditLoading) return <p className="text-sm text-gray-400 py-2">Loading...</p>
    if (auditEntries.length === 0) return <p className="text-sm text-gray-400 py-2">Belum ada riwayat aksi.</p>
    return (
      <div className="space-y-2">
        {auditEntries.map(entry => (
          <div key={entry.id} className="border border-gray-200 rounded p-2">
            <div className="flex items-center gap-2 mb-1">
              <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                entry.action === 'modify' ? 'text-blue-700 bg-blue-50' : 'text-red-700 bg-red-50'
              }`}>
                {entry.action === 'modify' ? 'Modified' : 'Rejected'}
              </span>
              <span className="text-xs text-gray-400">by {entry.acted_by || 'Unknown'}</span>
              <span className="text-xs text-gray-400 ml-auto">
                {entry.acted_at ? new Date(entry.acted_at).toLocaleString() : '—'}
              </span>
            </div>
            <p className="text-xs text-gray-700"><span className="font-medium">Reason:</span> {entry.reason_code}</p>
            <p className="text-xs text-gray-600"><span className="font-medium">Notes:</span> {entry.notes}</p>
          </div>
        ))}
      </div>
    )
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-2xl mx-4 max-h-[85vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <h3 className="text-lg font-semibold text-gray-900 truncate">{card.title}</h3>
            <span className={`shrink-0 text-xs font-medium text-white px-2 py-0.5 rounded ${style.badge}`}>
              {style.label}
            </span>
            {card.status && (
              <span className="shrink-0 text-xs font-medium text-gray-600 bg-gray-100 px-2 py-0.5 rounded capitalize">
                {card.status}
              </span>
            )}
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none shrink-0 ml-2">&times;</button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-4 space-y-4">
          <div>
            <p className="text-sm text-gray-600 whitespace-pre-wrap">{card.description}</p>
            <div className="mt-2 flex items-center gap-4 text-xs text-gray-500">
              <span>Region: <span className="font-medium">{card.region || '—'}</span></span>
              <span>Type: <span className="font-medium capitalize">{card.recommendation_type}</span></span>
              <span>{card.created_at ? new Date(card.created_at).toLocaleDateString() : '—'}</span>
            </div>
          </div>

          {card.promo_nearby && (
            <div className="bg-purple-100 border border-purple-300 text-purple-800 text-xs rounded px-3 py-2">
              ⚠️ {card.promo_tag}
            </div>
          )}

          {card.action_taken && (
            <div className="bg-gray-100 border border-gray-200 text-gray-700 text-sm rounded px-3 py-2">
              <span className="font-medium capitalize">{card.action_taken}</span> —
              <span className="font-medium"> {card.reason_code}</span>
              {card.notes && <p className="text-xs text-gray-500 mt-1">{card.notes}</p>}
            </div>
          )}

          <CollapsibleSection title="Terkait Inventory" defaultOpen={true}>
            {renderInventory()}
          </CollapsibleSection>

          {!card.action_taken && (
            <CollapsibleSection title="Actions" defaultOpen={true}>
              {renderActions()}
            </CollapsibleSection>
          )}

          <CollapsibleSection title={`Diskusi (${comments.length})`} defaultOpen={false}>
            {renderComments()}
          </CollapsibleSection>

          <CollapsibleSection title={`Riwayat Aksi (${auditEntries.length})`} defaultOpen={false}>
            {renderAuditTrail()}
          </CollapsibleSection>
        </div>

        <div className="px-6 py-3 border-t border-gray-200 shrink-0">
          <button onClick={onClose} className="w-full py-2 bg-gray-100 text-gray-700 rounded-md hover:bg-gray-200 text-sm font-medium">
            Close
          </button>
        </div>
      </div>
    </div>
  )
}
