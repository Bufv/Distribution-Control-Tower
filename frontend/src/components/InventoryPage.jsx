import { useState, useEffect } from 'react'
import { api } from '../api'

const STATUS_STYLES = {
  overstock: { label: 'Overstock', color: 'text-red-700 bg-red-100' },
  healthy: { label: 'Sehat', color: 'text-green-700 bg-green-100' },
  understock: { label: 'Understock', color: 'text-yellow-700 bg-yellow-100' },
  out_of_stock: { label: 'Out of Stock', color: 'text-gray-700 bg-gray-100' },
  no_demand: { label: 'No Demand', color: 'text-gray-700 bg-gray-100' },
}

export default function InventoryPage() {
  const [distributors, setDistributors] = useState([])
  const [selectedDistId, setSelectedDistId] = useState('')
  const [detailData, setDetailData] = useState(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  useEffect(() => {
    api('/api/distributors')
      .then(r => r.json())
      .then(d => Array.isArray(d) && setDistributors(d))
      .catch(() => {})
  }, [])

  useEffect(() => {
    if (!selectedDistId) {
      setDetailData(null)
      return
    }
    setLoading(true)
    setError('')
    api(`/api/inventory/detail?distributor_id=${selectedDistId}`)
      .then(r => {
        if (!r.ok) throw new Error('Failed to fetch inventory detail')
        return r.json()
      })
      .then(d => {
        setDetailData(d)
        setLoading(false)
      })
      .catch(err => {
        setError(err.message)
        setLoading(false)
      })
  }, [selectedDistId])

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-semibold text-gray-900">Inventory Health</h2>
        <p className="text-sm text-gray-500 mt-1">
          Detail stok per distributor — real-time DOI dan status kesehatan
        </p>
      </div>

      <div className="bg-white rounded-lg shadow p-4">
        <div className="mb-4">
          <label className="block text-sm font-medium text-gray-700 mb-1">Pilih Distributor</label>
          <select
            value={selectedDistId}
            onChange={e => setSelectedDistId(e.target.value)}
            className="w-full max-w-md px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
          >
            <option value="">-- Pilih Distributor --</option>
            {distributors.map(d => (
              <option key={d.id} value={d.id}>{d.name} — {d.region}</option>
            ))}
          </select>
        </div>

        {!selectedDistId && (
          <div className="text-center text-gray-400 text-sm py-12">
            Pilih distributor untuk melihat detail stok
          </div>
        )}

        {loading && (
          <div className="text-center text-gray-400 text-sm py-12">
            Memuat data inventory...
          </div>
        )}

        {error && (
          <div className="text-red-600 text-sm bg-red-50 px-3 py-2 rounded mb-4">
            {error}
          </div>
        )}

        {detailData && !loading && (
          <div>
            <div className="mb-4 text-sm text-gray-600">
              <span className="font-medium">{detailData.distributor_name}</span>
              {' — '}{detailData.city}, {detailData.region}
              {' — '}{detailData.items.length} SKU
            </div>

            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="bg-gray-50 border-b border-gray-200">
                    <th className="text-left px-3 py-2 font-medium text-gray-600">SKU</th>
                    <th className="text-left px-3 py-2 font-medium text-gray-600">Kategori</th>
                    <th className="text-right px-3 py-2 font-medium text-gray-600">Current Stock</th>
                    <th className="text-right px-3 py-2 font-medium text-gray-600">DOI (hari)</th>
                    <th className="text-right px-3 py-2 font-medium text-gray-600">Daily Demand</th>
                    <th className="text-center px-3 py-2 font-medium text-gray-600">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {detailData.items.map(item => {
                    const style = STATUS_STYLES[item.status] || STATUS_STYLES.out_of_stock
                    return (
                      <tr key={item.sku_id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="px-3 py-2">
                          <p className="font-medium text-gray-900">{item.sku_name}</p>
                          <p className="text-xs text-gray-400">{item.sku_code}</p>
                        </td>
                        <td className="px-3 py-2 text-gray-600">{item.category || '—'}</td>
                        <td className="px-3 py-2 text-right font-mono text-gray-900">
                          {item.current_stock.toLocaleString()}
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-gray-900">
                          {item.doi !== null ? item.doi : '—'}
                        </td>
                        <td className="px-3 py-2 text-right font-mono text-gray-900">
                          {item.daily_demand > 0 ? item.daily_demand : '—'}
                        </td>
                        <td className="px-3 py-2 text-center">
                          <span className={`text-xs font-medium px-2 py-0.5 rounded ${style.color}`}>
                            {style.label}
                          </span>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
