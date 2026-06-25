import { api } from '../api'

const SEVERITY_STYLES = {
  high: { border: 'border-red-400', bg: 'bg-red-50', badge: 'bg-red-600', label: 'High' },
  medium: { border: 'border-yellow-400', bg: 'bg-yellow-50', badge: 'bg-yellow-600', label: 'Medium' },
  low: { border: 'border-blue-400', bg: 'bg-blue-50', badge: 'bg-blue-600', label: 'Low' },
}

function formatRp(val) {
  if (!val) return null
  if (val >= 1_000_000_000) return `Rp ${(val / 1_000_000_000).toFixed(1)}M`
  if (val >= 1_000_000) return `Rp ${(val / 1_000_000).toFixed(0)}jt`
  if (val >= 1_000) return `Rp ${(val / 1_000).toFixed(0)}rb`
  return `Rp ${val}`
}

export default function RecommendationCardSimple({ card, onApprove, onModify, onReject, disabled }) {
  const style = SEVERITY_STYLES[card.severity] || SEVERITY_STYLES.low
  const impact = formatRp(card.financial_impact)

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

      <div className="mt-1 flex items-center gap-2 text-xs text-gray-500">
        <span>{card.region}</span>
        {impact && <span className="font-medium">{impact}</span>}
      </div>

      {card.promo_nearby && (
        <div className="mt-2 bg-purple-100 border border-purple-300 text-purple-800 text-xs rounded px-2 py-1">
          ⚠️ {card.promo_tag}
        </div>
      )}

      {card.suggest_escalate && (
        <div className="mt-2 bg-orange-100 border border-orange-300 text-orange-800 text-xs rounded px-2 py-1">
          ⚠️ Rekomendasi Eskalasi — Dampak Finansial Signifikan
        </div>
      )}

      <div className="mt-3 flex gap-1.5">
        <button
          onClick={() => onApprove(card.id)}
          disabled={disabled}
          className="flex-1 text-xs py-1.5 rounded font-medium bg-green-600 text-white hover:bg-green-700 disabled:opacity-50"
        >
          ✓ Approve
        </button>
        <button
          onClick={() => onModify(card)}
          disabled={disabled || !card.sell_in_cuttable}
          className={`flex-1 text-xs py-1.5 rounded font-medium disabled:opacity-50 ${
            card.sell_in_cuttable
              ? 'bg-blue-600 text-white hover:bg-blue-700'
              : 'bg-gray-300 text-gray-500 cursor-not-allowed'
          }`}
          title={!card.sell_in_cuttable ? 'Disabled due to upcoming promo' : ''}
        >
          ✎ Modify
        </button>
        <button
          onClick={() => onReject(card.id)}
          disabled={disabled}
          className="flex-1 text-xs py-1.5 rounded font-medium bg-red-600 text-white hover:bg-red-700 disabled:opacity-50"
        >
          ✕ Reject
        </button>
      </div>
    </div>
  )
}
