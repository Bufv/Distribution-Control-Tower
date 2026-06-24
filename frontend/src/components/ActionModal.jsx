import { useState } from 'react'
import { api } from '../api'

const REASON_CODES = [
  'Logistics / Force Majeure',
  'Commercial Strategy',
  'Market Shock',
  'Data Accuracy Doubt',
]

export default function ActionModal({ card, action, onClose, onDone }) {
  const [reasonCode, setReasonCode] = useState('')
  const [notes, setNotes] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)

  const actionLabel = action === 'modify' ? 'Modify' : 'Reject'
  const actionColor = action === 'modify' ? 'bg-blue-600 hover:bg-blue-700' : 'bg-red-600 hover:bg-red-700'

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!reasonCode) {
      setError('Please select a reason code')
      return
    }
    if (notes.trim().length < 10) {
      setError('Notes must be at least 10 characters')
      return
    }
    setError('')
    setLoading(true)
    try {
      const res = await api(`/api/recommendations/${card.id}/action`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action, reason_code: reasonCode, notes: notes.trim() }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || 'Action failed')
      }
      setSuccess(true)
      onDone()
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
              <h3 className="text-lg font-semibold text-gray-900">Card {actionLabel}ed</h3>
              <p className="text-sm text-gray-500 mt-1">
                {actionLabel} action has been recorded with audit trail
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
            <h3 className="text-lg font-semibold text-gray-900 mb-1">{actionLabel} Recommendation</h3>
            <p className="text-sm text-gray-500 mb-4">
              Card: <span className="font-medium text-gray-700">{card.title}</span>
            </p>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Reason Code <span className="text-red-500">*</span>
              </label>
              <select
                value={reasonCode}
                onChange={e => setReasonCode(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                required
              >
                <option value="">-- Select a reason --</option>
                {REASON_CODES.map(code => (
                  <option key={code} value={code}>{code}</option>
                ))}
              </select>
            </div>

            <div className="mb-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Notes <span className="text-red-500">*</span>
              </label>
              <textarea
                value={notes}
                onChange={e => setNotes(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                rows={4}
                placeholder="Describe your reasoning (min 10 characters)..."
                required
              />
              <p className="text-xs text-gray-400 mt-1">
                {notes.length}/10 minimum characters
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
                className={`flex-1 py-2 text-white rounded-md disabled:opacity-50 text-sm font-medium ${actionColor}`}
              >
                {loading ? 'Processing...' : `Confirm ${actionLabel}`}
              </button>
            </div>
          </form>
        )}
      </div>
    </div>
  )
}
