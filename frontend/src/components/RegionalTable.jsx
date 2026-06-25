import { useState, useEffect } from 'react'
import { api } from '../api'
import useStaleness from '../hooks/useStaleness'

export default function RegionalTable() {
  const [data, setData] = useState([])
  const { stalenessMap } = useStaleness()

  useEffect(() => {
    api('/api/regions/ranking')
      .then(r => r.json())
      .then(d => Array.isArray(d) && setData(d))
      .catch(() => {})
  }, [])

  const staleRegions = new Set()
  for (const item of Object.values(stalenessMap)) {
    if (item.is_stale && item.region) {
      staleRegions.add(item.region)
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-4">
      <h3 className="text-lg font-semibold text-gray-800 mb-4">
        Regional Ranking
      </h3>
      {data.length === 0 ? (
        <div className="h-24 flex items-center justify-center text-gray-400 text-sm">
          Memuat data...
        </div>
      ) : (
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b text-left text-gray-500">
              <th className="pb-2">Peringkat</th>
              <th className="pb-2">Region</th>
              <th className="pb-2 text-right">Total Sell-Out</th>
            </tr>
          </thead>
          <tbody>
            {data.map((row, i) => {
              const regionStale = staleRegions.has(row.region)
              return (
                <tr
                  key={row.region}
                  className={`border-b last:border-0 ${regionStale ? 'bg-yellow-50' : ''}`}
                  title={regionStale ? `Peringatan: Data Sell-Out ${row.region} menggunakan estimasi proyeksi H-1. Keputusan logistik harap memperhitungkan margin of error.` : ''}
                >
                  <td className="py-2 text-gray-400">#{i + 1}</td>
                  <td className="py-2 font-medium">{row.region}</td>
                  <td className="py-2 text-right font-mono">
                    {row.total_sell_out.toLocaleString()}
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      )}
    </div>
  )
}
