import { api } from '../api'

const STATUS_STYLES = {
  draft: { bg: 'bg-gray-100', text: 'text-gray-700', label: 'Draft' },
  submitted: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Menunggu Approval' },
  approved: { bg: 'bg-green-100', text: 'text-green-700', label: 'Disetujui' },
  rejected: { bg: 'bg-red-100', text: 'text-red-700', label: 'Ditolak' },
  executed: { bg: 'bg-green-100', text: 'text-green-700', label: 'Tereksekusi' },
}

const TYPE_STYLES = {
  overstock: { bg: 'bg-red-100', text: 'text-red-700', label: 'Overstock' },
  stockout: { bg: 'bg-orange-100', text: 'text-orange-700', label: 'Stockout' },
  redistribution: { bg: 'bg-purple-100', text: 'text-purple-700', label: 'Redistribusi' },
  investigation: { bg: 'bg-blue-100', text: 'text-blue-700', label: 'Investigasi' },
}

function formatRp(val) {
  if (!val) return null
  if (val >= 1_000_000_000) return `Rp ${(val / 1_000_000_000).toFixed(1)}M`
  if (val >= 1_000_000) return `Rp ${(val / 1_000_000).toFixed(0)}jt`
  if (val >= 1_000) return `Rp ${(val / 1_000).toFixed(0)}rb`
  return `Rp ${val}`
}

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const d = new Date(dateStr)
  const now = new Date()
  const diff = Math.floor((now - d) / 86400000)
  if (diff === 0) return 'hari ini'
  if (diff === 1) return 'kemarin'
  if (diff < 30) return `${diff} hari lalu`
  return d.toLocaleDateString()
}

export default function TacticCard({ tactic, user, onClick, onAction }) {
  const sStyle = STATUS_STYLES[tactic.status] || STATUS_STYLES.draft
  const tStyle = TYPE_STYLES[tactic.tactic_type] || TYPE_STYLES.investigation
  const isManager = user?.role === 'manager'
  const isDirector = user?.role === 'director'
  const isOwner = tactic.created_by === user?.id
  const impact = formatRp(tactic.financial_impact_est)
  const verificationBadge = tactic.verification_status === 'verified' ? 'Terverifikasi' :
    tactic.verification_status === 'deviation_detected' ? 'Deviasi' :
    tactic.verification_status === 'overdue' ? 'Terlambat' : null

  const verificationColor = tactic.verification_status === 'verified' ? 'bg-green-100 text-green-700' :
    tactic.verification_status === 'deviation_detected' ? 'bg-orange-100 text-orange-700' :
    'bg-red-100 text-red-700'

  return (
    <div
      className="w-64 shrink-0 bg-white rounded-lg border border-gray-200 shadow-sm hover:shadow-md transition-shadow cursor-pointer"
      onClick={() => onClick(tactic)}
    >
      <div className="p-3">
        <div className="flex items-start justify-between gap-1 mb-1">
          <p className="font-semibold text-sm text-gray-900 truncate flex-1">{tactic.title}</p>
          <span className={`shrink-0 text-xs font-medium px-1.5 py-0.5 rounded ${tStyle.bg} ${tStyle.text}`}>
            {tStyle.label}
          </span>
        </div>

        <div className="flex items-center gap-2 mb-1">
          <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${sStyle.bg} ${sStyle.text}`}>
            {sStyle.label}
          </span>
          {(tactic.status === 'executed' && verificationBadge) && (
            <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${verificationColor}`}>
              {verificationBadge}
            </span>
          )}
        </div>

        <div className="text-xs text-gray-500 space-y-0.5">
          <div className="flex justify-between">
            <span>{tactic.region || '—'}</span>
            {impact && <span className="font-medium text-gray-700">{impact}</span>}
          </div>
          <span>{timeAgo(tactic.created_at)}</span>
        </div>
      </div>

      <div className="border-t border-gray-100 p-2 flex gap-1">
        {isManager && isOwner && tactic.status === 'draft' && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); onAction(tactic, 'edit') }}
              className="flex-1 text-xs py-1 rounded bg-blue-600 text-white hover:bg-blue-700"
            >
              Edit
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onAction(tactic, 'submit') }}
              className="flex-1 text-xs py-1 rounded bg-gray-700 text-white hover:bg-gray-800"
            >
              Submit
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); if (confirm('Hapus tactic ini?')) onAction(tactic, 'delete') }}
              className="text-xs py-1 px-2 rounded bg-red-600 text-white hover:bg-red-700"
            >
              ✕
            </button>
          </>
        )}

        {isManager && tactic.status === 'approved' && (
          <button
            onClick={(e) => { e.stopPropagation(); onAction(tactic, 'execute') }}
            className="flex-1 text-xs py-1 rounded bg-green-600 text-white hover:bg-green-700"
          >
            Execute
          </button>
        )}

        {isManager && isOwner && tactic.status === 'rejected' && (
          <button
            onClick={(e) => { e.stopPropagation(); onAction(tactic, 'revise') }}
            className="flex-1 text-xs py-1 rounded bg-yellow-600 text-white hover:bg-yellow-700"
          >
            Revisi
          </button>
        )}

        {isDirector && tactic.status === 'submitted' && (
          <>
            <button
              onClick={(e) => { e.stopPropagation(); onAction(tactic, 'approve') }}
              className="flex-1 text-xs py-1 rounded bg-green-600 text-white hover:bg-green-700"
            >
              Approve
            </button>
            <button
              onClick={(e) => { e.stopPropagation(); onAction(tactic, 'reject') }}
              className="flex-1 text-xs py-1 rounded border border-red-300 text-red-700 hover:bg-red-50"
            >
              Reject
            </button>
          </>
        )}
      </div>
    </div>
  )
}
