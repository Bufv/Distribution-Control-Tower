import { useState, useEffect } from 'react'
import { api } from '../api'
import RecommendationCardSimple from './RecommendationCardSimple'

export default function SystemRecommendations({ onModifyCard }) {
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [actioning, setActioning] = useState(null)
  const [message, setMessage] = useState('')

  const fetchCards = async () => {
    setLoading(true)
    setError('')
    try {
      const res = await api('/api/recommendations')
      if (!res.ok) throw new Error('Failed to fetch')
      const data = await res.json()
      setCards(Array.isArray(data) ? data : [])
    } catch {
      setError('Gagal memuat rekomendasi')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchCards() }, [])

  const showMessage = (msg) => {
    setMessage(msg)
    setTimeout(() => setMessage(''), 3000)
  }

  const handleApprove = async (cardId) => {
    setActioning(cardId)
    try {
      const res = await api(`/api/recommendations/${cardId}/approve`, { method: 'POST' })
      if (!res.ok) throw new Error('Approve failed')
      const data = await res.json()
      showMessage(data.message || 'Tactic dibuat di Action Plan')
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
        body: JSON.stringify({ action: 'reject', reason_code: 'Commercial Strategy', notes: 'Rejected from System Recommendations panel' }),
      })
      if (!res.ok) throw new Error('Reject failed')
      showMessage('Rekomendasi ditolak')
      fetchCards()
    } catch {
      setError('Gagal reject')
    } finally {
      setActioning(null)
    }
  }

  const handleModify = (card) => {
    onModifyCard(card)
  }

  if (loading) {
    return <div className="text-center text-gray-400 text-sm py-8">Memuat rekomendasi...</div>
  }

  if (error) {
    return (
      <div className="text-center">
        <p className="text-red-500 text-sm mb-2">{error}</p>
        <button onClick={fetchCards} className="text-xs text-blue-600 hover:underline">Coba lagi</button>
      </div>
    )
  }

  if (cards.length === 0) {
    return <div className="text-center text-gray-400 text-sm py-8">Tidak ada rekomendasi baru</div>
  }

  return (
    <div className="space-y-3">
      <div className="flex items-center justify-between text-xs text-gray-400 mb-2">
        <span className="font-medium">{cards.length} rekomendasi</span>
        <button onClick={fetchCards} className="hover:text-gray-600 transition-colors" title="Refresh">↻</button>
      </div>

      {message && (
        <div className="bg-green-100 border border-green-300 text-green-800 text-xs px-3 py-2 rounded">
          {message}
        </div>
      )}

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
