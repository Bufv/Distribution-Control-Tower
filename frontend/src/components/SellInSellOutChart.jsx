import { useState, useEffect } from 'react'
import { api } from '../api'
import {
  LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer,
} from 'recharts'

export default function SellInSellOutChart() {
  const [data, setData] = useState([])
  const [skus, setSkus] = useState([])
  const [selectedSku, setSelectedSku] = useState('')
  const [period, setPeriod] = useState('monthly')

  useEffect(() => {
    api('/api/sales/skus')
      .then(r => r.json())
      .then(setSkus)
      .catch(() => {})
  }, [])

  useEffect(() => {
    const params = new URLSearchParams({ period })
    if (selectedSku) params.set('sku_id', selectedSku)

    api(`/api/sales?${params}`)
      .then(r => r.json())
      .then(setData)
      .catch(() => {})
  }, [period, selectedSku])

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-gray-800">
          Sell-In vs Sell-Out Gap
        </h3>
        <div className="flex gap-2">
          <select
            value={period}
            onChange={e => setPeriod(e.target.value)}
            className="text-sm border rounded px-2 py-1"
          >
            <option value="monthly">Bulanan</option>
            <option value="quarterly">Kuartal</option>
          </select>
          <select
            value={selectedSku}
            onChange={e => setSelectedSku(e.target.value)}
            className="text-sm border rounded px-2 py-1"
          >
            <option value="">Semua SKU</option>
            {skus.map(s => (
              <option key={s.id} value={s.id}>{s.name}</option>
            ))}
          </select>
        </div>
      </div>

      {data.length === 0 ? (
        <div className="h-64 flex items-center justify-center text-gray-400 text-sm">
          Memuat data...
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={280}>
          <LineChart data={data}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="period" tick={{ fontSize: 12 }} />
            <YAxis tick={{ fontSize: 12 }} />
            <Tooltip />
            <Legend />
            <Line
              type="monotone"
              dataKey="sell_in"
              stroke="#3b82f6"
              strokeWidth={2}
              name="Sell-In (ke Distributor)"
            />
            <Line
              type="monotone"
              dataKey="sell_out"
              stroke="#22c55e"
              strokeWidth={2}
              name="Sell-Out (ke Toko)"
            />
          </LineChart>
        </ResponsiveContainer>
      )}
    </div>
  )
}
