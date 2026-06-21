import { useState } from 'react'
import { api } from '../api'

export default function EscalateModal({ card, onClose }) {
  const [reason, setReason] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (reason.trim().length < 10) {
      setError('Reason must be at least 10 characters')
      return
    }
    setError('')
    setLoading(true)
    try {
      const res = await api(`/api/recommendations/${card.id}/escalate?reason=${encodeURIComponent(reason.trim())}`, {
        method: 'POST',
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || 'Failed to escalate')
      }
      setSuccess(true)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-md mx-4 p-6" onClick={e => e.stopPropagation()}>
        {success ? (
          <div>
            <div className="text-center">
              <div className="text-green-600 text-4xl mb-2">✓</div>
              <h3 className="text-lg font-semibold text-gray-900">Escalation Sent</h3>
              <p className="text-sm text-gray-500 mt-1">
                Commercial Director has been notified
              </p>
            </div>
            <button
              onClick={onClose}
              className="mt-4 w-full py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 text-sm font-medium"
            >
              Close
            </button>
          </div>
        ) : (
          <form onSubmit={handleSubmit}>
            <h3 className="text-lg font-semibold text-gray-900 mb-1">Escalate to Commercial/Legal</h3>
            <p className="text-sm text-gray-500 mb-4">
              Card: <span className="font-medium text-gray-700">{card.title}</span>
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason for escalation
              </label>
              <textarea
                value={reason}
                onChange={e => setReason(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                rows={4}
                placeholder="Describe why this needs Commercial/Legal attention (min 10 characters)..."
                required
              />
              <p className="text-xs text-gray-400 mt-1">
                {reason.length}/10 minimum characters
              </p>
            </div>

            {error && (
              <div className="mb-4 text-red-600 text-sm bg-red-50 px-3 py-2 rounded">{error}</div>
            )}

            <div className="flex gap-2">
              <button
                type="button"
                onClick={onClose}
                className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="flex-1 py-2 bg-orange-600 text-white rounded-md hover:bg-orange-700 disabled:opacity-50 text-sm font-medium"
              >
                {loading ? 'Sending...' : 'Send Escalation'}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
