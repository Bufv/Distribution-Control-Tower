import { useState, useEffect } from 'react'
import { api } from '../api'

const ACTION_LABELS = {
  modify: { label: 'Modified', color: 'text-blue-700 bg-blue-50' },
  reject: { label: 'Rejected', color: 'text-red-700 bg-red-50' },
}

export default function AuditTrailModal({ card, onClose }) {
  const [entries, setEntries] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    api(`/api/audit-trail?recommendation_card_id=${card.id}`)
      .then(r => r.json())
      .then(data => {
        setEntries(data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [card.id])

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 p-6 max-h-[80vh] flex flex-col" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900">Audit Trail</h3>
            <p className="text-sm text-gray-500">{card.title}</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading && (
            <p className="text-center text-gray-400 text-sm py-8">Loading...</p>
          )}

          {!loading && entries.length === 0 && (
            <p className="text-center text-gray-400 text-sm py-8">No audit trail entries yet.</p>
          )}

          <div className="space-y-3">
            {entries.map(entry => {
              const style = ACTION_LABELS[entry.action] || ACTION_LABELS.modify
              return (
                <div key={entry.id} className="border border-gray-200 rounded-lg p-3">
                  <div className="flex items-center gap-2 mb-2">
                    <span className={`text-xs font-medium px-2 py-0.5 rounded ${style.color}`}>
                      {style.label}
                    </span>
                    <span className="text-xs text-gray-400">
                      by {entry.acted_by || 'Unknown'}
                    </span>
                    <span className="text-xs text-gray-400 ml-auto">
                      {entry.acted_at ? new Date(entry.acted_at).toLocaleString() : '—'}
                    </span>
                  </div>
                  <div className="text-sm text-gray-700 mb-1">
                    <span className="font-medium">Reason:</span> {entry.reason_code}
                  </div>
                  <div className="text-sm text-gray-600">
                    <span className="font-medium">Notes:</span> {entry.notes}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      </div>
    </div>
  )
}
