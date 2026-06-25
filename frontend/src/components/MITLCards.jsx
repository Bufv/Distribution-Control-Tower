import { useState, useEffect } from 'react'
import { api } from '../api'

const SEVERITY_STYLES = {
  high: { border: 'border-red-400', bg: 'bg-red-50', badge: 'bg-red-600', label: 'High' },
  medium: { border: 'border-yellow-400', bg: 'bg-yellow-50', badge: 'bg-yellow-600', label: 'Medium' },
  low: { border: 'border-blue-400', bg: 'bg-blue-50', badge: 'bg-blue-600', label: 'Low' },
}

function RecommendationCard({ card, onEscalate, onAction, onViewHistory, onComment }) {
  const style = SEVERITY_STYLES[card.severity] || SEVERITY_STYLES.low
  const hasHistory = card.action_taken || card.reason_code || card.notes

  return (
    <div className={`rounded-lg border-l-4 ${style.border} ${style.bg} p-3`}>
      <div className="flex items-start justify-between gap-2">
        <div className="flex-1 min-w-0">
          <p className="font-semibold text-sm text-gray-900 truncate">{card.title}</p>
          <p className="text-xs text-gray-600 mt-1 line-clamp-2">{card.description}</p>
        </div>
        <span className={`shrink-0 text-xs font-medium text-white px-2 py-0.5 rounded ${style.badge}`}>
          {style.label}
        </span>
      </div>

      {card.promo_nearby && (
        <div className="mt-2 bg-purple-100 border border-purple-300 text-purple-800 text-xs rounded px-2 py-1">
          ⚠️ {card.promo_tag}
        </div>
      )}

      {card.action_taken && (
        <div className="mt-2 bg-gray-100 border border-gray-200 text-gray-700 text-xs rounded px-2 py-1">
          {card.action_taken === 'modify' ? 'Modified' : 'Rejected'} —
          <span className="font-medium"> {card.reason_code}</span>
        </div>
      )}

      <div className="mt-2 flex items-center justify-between text-xs text-gray-500">
        <span>{card.region || '—'}</span>
        <span className="capitalize">{card.recommendation_type}</span>
      </div>

      <div className="mt-3 flex gap-2">
        {!card.action_taken && (
          <>
            <button
              onClick={() => onAction(card, 'modify')}
              disabled={!card.sell_in_cuttable}
              className={`flex-1 text-xs py-1.5 rounded font-medium ${
                card.sell_in_cuttable
                  ? 'bg-blue-600 text-white hover:bg-blue-700'
                  : 'bg-gray-300 text-gray-500 cursor-not-allowed'
              }`}
              title={!card.sell_in_cuttable ? 'Disabled due to upcoming promo' : ''}
            >
              Modify
            </button>
            <button
              onClick={() => onAction(card, 'reject')}
              className="flex-1 text-xs py-1.5 rounded font-medium bg-red-600 text-white hover:bg-red-700"
            >
              Reject
            </button>
          </>
        )}
        <button
          onClick={() => onEscalate(card)}
          className="flex-1 text-xs py-1.5 rounded font-medium border border-gray-300 text-gray-700 hover:bg-gray-100"
        >
          Escalate
        </button>
        <button
          onClick={() => onComment(card)}
          className="flex-1 text-xs py-1.5 rounded font-medium border border-gray-300 text-gray-700 hover:bg-gray-100"
        >
          Comment
        </button>
      </div>

      {hasHistory && (
        <button
          onClick={() => onViewHistory(card)}
          className="mt-2 w-full text-xs py-1 rounded font-medium text-gray-500 hover:text-gray-700 border border-dashed border-gray-300 hover:border-gray-400"
        >
          View History
        </button>
      )}
    </div>
  )
}

export default function MITLCards({ onEscalate, onAction, onViewHistory, onComment }) {
  const [cards, setCards] = useState([])
  const [loading, setLoading] = useState(true)

  const fetchCards = () => {
    setLoading(true)
    api('/api/recommendations')
      .then(r => r.json())
      .then(d => {
        if (Array.isArray(d)) setCards(d)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }

  useEffect(() => {
    fetchCards()
  }, [])

  if (loading) {
    return (
      <div className="text-center text-gray-400 text-sm py-8">
        Memuat rekomendasi...
      </div>
    )
  }

  if (cards.length === 0) {
    return (
      <div className="text-center text-gray-400 text-sm py-8">
        Tidak ada rekomendasi saat ini.
      </div>
    )
  }

  return (
    <div className="space-y-3">
      {cards.map(card => (
        <RecommendationCard
          key={card.id}
          card={card}
          onEscalate={onEscalate}
          onAction={onAction}
          onViewHistory={onViewHistory}
          onComment={onComment}
        />
      ))}
    </div>
  )
}
