import { useState, useEffect } from 'react'
import { api } from '../api'
import useStaleness from '../hooks/useStaleness'
import StaleTooltip from './StaleTooltip'

const INDICATORS = {
  overstock: { label: 'Overstock', color: 'bg-red-100 border-red-400 text-red-800', dot: '🔴' },
  healthy: { label: 'Sehat', color: 'bg-green-100 border-green-400 text-green-800', dot: '🟢' },
  understock: { label: 'Understock / OOS Risk', color: 'bg-yellow-100 border-yellow-400 text-yellow-800', dot: '🟡' },
}

function HealthCard({ distributor, stale }) {
  const h = INDICATORS[distributor.health] || INDICATORS.healthy

  const card = (
    <div className={`rounded-lg border-l-4 p-3 ${h.color}`}>
      <div className="flex items-center justify-between">
        <div>
          <p className="font-semibold text-sm">{distributor.distributor_name}</p>
          <p className="text-xs opacity-75">{distributor.city}, {distributor.region}</p>
        </div>
        <span className="text-lg">{h.dot}</span>
      </div>
      <p className="mt-1 text-xs text-gray-500">Stok: {distributor.total_stock.toLocaleString()} unit</p>
      <div className="mt-1 text-xs flex gap-3">
        <span>🔴 {distributor.details.overstock}</span>
        <span>🟢 {distributor.details.healthy}</span>
        <span>🟡 {distributor.details.understock}</span>
      </div>
    </div>
  )

  return (
    <StaleTooltip stale={stale} region={distributor.region}>
      {card}
    </StaleTooltip>
  )
}

export default function StockHealthCards() {
  const [data, setData] = useState([])
  const { stalenessMap } = useStaleness()

  useEffect(() => {
    api('/api/inventory')
      .then(r => r.json())
      .then(d => Array.isArray(d) && setData(d))
      .catch(() => {})
  }, [])

  if (data.length === 0) {
    return (
      <div className="bg-white rounded-lg shadow p-4">
        <h3 className="text-lg font-semibold text-gray-800 mb-4">Stock Health</h3>
        <div className="h-32 flex items-center justify-center text-gray-400 text-sm">
          Memuat data...
        </div>
      </div>
    )
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">Stock Health</h3>
      <div className="space-y-3">
        {data.map(d => (
          <HealthCard key={d.distributor_id} distributor={d} stale={stalenessMap[d.distributor_id]?.is_stale} />
        ))}
      </div>
    </div>
  )
}
