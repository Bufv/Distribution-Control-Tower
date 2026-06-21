import { useState, useEffect } from 'react'
import { api } from '../api'

const STATUS_STYLES = {
  pending: { dot: 'bg-yellow-400', label: 'Pending' },
  approved: { dot: 'bg-green-500', label: 'Approved' },
  rejected: { dot: 'bg-red-500', label: 'Rejected' },
}

export default function EscalationPanel({ user }) {
  const [tickets, setTickets] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const fetchTickets = async () => {
    try {
      const res = await api('/api/escalations')
      const data = await res.json()
      setTickets(data)
    } catch {
      setError('Failed to load escalations')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchTickets()
  }, [])

  const handleAction = async (ticketId, action) => {
    try {
      const res = await api(`/api/escalations/${ticketId}/${action}`, { method: 'POST' })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || 'Action failed')
      }
      fetchTickets()
    } catch (err) {
      setError(err.message)
    }
  }

  const isDirector = user?.role === 'director'

  return (
    <div>
      <h3 className="font-semibold text-sm uppercase tracking-wide text-gray-500 mb-4">
        Escalations
      </h3>

      {loading && (
        <p className="text-center text-gray-400 text-sm py-4">Loading...</p>
      )}

      {error && (
        <div className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded mb-4">{error}</div>
      )}

      {!loading && tickets.length === 0 && (
        <p className="text-center text-gray-400 text-sm py-4">No escalations</p>
      )}

      <div className="space-y-3">
        {tickets.map(ticket => {
          const style = STATUS_STYLES[ticket.status] || STATUS_STYLES.pending
          return (
            <div key={ticket.id} className="border border-gray-200 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-1">
                <span className={`w-2 h-2 rounded-full ${style.dot}`} />
                <span className="text-xs font-medium text-gray-500 uppercase">{style.label}</span>
              </div>
              <p className="text-sm text-gray-800 line-clamp-3 mb-1">{ticket.reason}</p>
              <p className="text-xs text-gray-400">
                {ticket.card_title || 'Recommendation'} · {new Date(ticket.created_at).toLocaleDateString()}
              </p>

              {isDirector && ticket.status === 'pending' && (
                <div className="flex gap-2 mt-3">
                  <button
                    onClick={() => handleAction(ticket.id, 'approve')}
                    className="flex-1 text-xs py-1.5 rounded font-medium bg-green-600 text-white hover:bg-green-700"
                  >
                    Approve
                  </button>
                  <button
                    onClick={() => handleAction(ticket.id, 'reject')}
                    className="flex-1 text-xs py-1.5 rounded font-medium border border-red-300 text-red-700 hover:bg-red-50"
                  >
                    Reject
                  </button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
