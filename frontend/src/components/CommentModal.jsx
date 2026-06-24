import { useState, useEffect, useRef } from 'react'
import { api } from '../api'

export default function CommentModal({ card, onClose }) {
  const [comments, setComments] = useState([])
  const [content, setContent] = useState('')
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [success, setSuccess] = useState(false)
  const bottomRef = useRef(null)

  const loadComments = async () => {
    try {
      const res = await api(`/api/recommendations/${card.id}/comments`)
      if (res.ok) {
        setComments(await res.json())
      }
    } catch {
      // silent
    }
  }

  useEffect(() => {
    loadComments()
  }, [card.id])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [comments])

  const handleSubmit = async (e) => {
    e.preventDefault()
    if (!content.trim()) {
      setError('Comment cannot be empty')
      return
    }
    setError('')
    setLoading(true)
    try {
      const res = await api(`/api/recommendations/${card.id}/comments`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ content: content.trim() }),
      })
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || 'Failed to post comment')
      }
      setContent('')
      setSuccess(true)
      setTimeout(() => setSuccess(false), 2000)
      await loadComments()
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={onClose}>
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg mx-4 p-6" onClick={e => e.stopPropagation()}>
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold text-gray-900">Discussion</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>

        <p className="text-sm text-gray-500 mb-4">
          Card: <span className="font-medium text-gray-700">{card.title}</span>
        </p>

        <div className="max-h-64 overflow-y-auto mb-4 space-y-3 border border-gray-200 rounded-lg p-3 bg-gray-50">
          {comments.length === 0 ? (
            <p className="text-sm text-gray-400 text-center py-4">No comments yet. Start the discussion!</p>
          ) : (
            comments.map(c => (
              <div key={c.id} className="bg-white rounded-md p-3 shadow-sm border border-gray-100">
                <div className="flex items-center justify-between mb-1">
                  <span className="text-xs font-medium text-blue-600">{c.user_id || 'Unknown'}</span>
                  <span className="text-xs text-gray-400">
                    {new Date(c.created_at).toLocaleString()}
                  </span>
                </div>
                <p className="text-sm text-gray-700 whitespace-pre-wrap">{c.content}</p>
              </div>
            ))
          )}
          <div ref={bottomRef} />
        </div>

        <form onSubmit={handleSubmit}>
          <textarea
            value={content}
            onChange={e => setContent(e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            rows={3}
            placeholder="Write a comment... Use @username to notify someone"
          />

          {error && (
            <div className="mt-2 text-red-600 text-sm bg-red-50 px-3 py-2 rounded">{error}</div>
          )}

          {success && (
            <div className="mt-2 text-green-600 text-sm bg-green-50 px-3 py-2 rounded">Comment posted!</div>
          )}

          <div className="flex gap-2 mt-3">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 py-2 border border-gray-300 text-gray-700 rounded-md hover:bg-gray-50 text-sm font-medium"
            >
              Close
            </button>
            <button
              type="submit"
              disabled={loading || !content.trim()}
              className="flex-1 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
            >
              {loading ? 'Posting...' : 'Post Comment'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}
