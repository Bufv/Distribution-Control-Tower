import { useState, useEffect } from 'react'
import { api } from '../api'
import TacticDetailModal from './TacticDetailModal'

const FILTER_STATUSES = ['executed', 'rejected', 'verified', 'deviation_detected']

function formatRp(val) {
  if (!val) return '—'
  if (val >= 1_000_000_000) return `Rp ${(val / 1_000_000_000).toFixed(1)}M`
  if (val >= 1_000_000) return `Rp ${(val / 1_000_000).toFixed(0)}jt`
  if (val >= 1_000) return `Rp ${(val / 1_000).toFixed(0)}rb`
  return `Rp ${val}`
}

export default function Archive({ user }) {
  const [tactics, setTactics] = useState([])
  const [loading, setLoading] = useState(true)
  const [detailTactic, setDetailTactic] = useState(null)

  const [filters, setFilters] = useState({
    startDate: '', endDate: '', region: '', status: [], type: '', search: '',
  })

  const [regions, setRegions] = useState([])
  const [sortField, setSortField] = useState('created_at')
  const [sortDir, setSortDir] = useState('desc')

  useEffect(() => {
    setLoading(true)
    api('/api/tactics')
      .then(r => r.ok ? r.json() : [])
      .then(data => {
        const resolved = Array.isArray(data) ? data : []
        setTactics(resolved)
        const uniqueRegions = [...new Set(resolved.map(t => t.region).filter(Boolean))]
        setRegions(uniqueRegions)
      })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDir(prev => prev === 'asc' ? 'desc' : 'asc')
    } else {
      setSortField(field)
      setSortDir('asc')
    }
  }

  const filtered = tactics.filter(t => {
    if (t.status !== 'executed' && t.status !== 'rejected') return false

    if (filters.startDate && new Date(t.created_at) < new Date(filters.startDate)) return false
    if (filters.endDate && new Date(t.created_at) > new Date(filters.endDate + 'T23:59:59')) return false
    if (filters.region && t.region !== filters.region) return false
    if (filters.status.length > 0) {
      if (t.verification_status) {
        if (!filters.status.includes(t.verification_status)) return false
      } else {
        if (!filters.status.includes(t.status)) return false
      }
    }
    if (filters.type && t.tactic_type !== filters.type) return false
    if (filters.search && !t.title.toLowerCase().includes(filters.search.toLowerCase())) return false
    return true
  }).sort((a, b) => {
    const aVal = a[sortField] || ''
    const bVal = b[sortField] || ''
    const cmp = typeof aVal === 'string' ? aVal.localeCompare(bVal) : aVal - bVal
    return sortDir === 'asc' ? cmp : -cmp
  })

  const SortHeader = ({ field, label }) => (
    <th className="text-left px-3 py-2 font-medium text-gray-600 cursor-pointer hover:text-gray-900 select-none"
      onClick={() => handleSort(field)}>
      <div className="flex items-center gap-1">
        {label}
        {sortField === field && (
          <span className="text-xs">{sortDir === 'asc' ? '▲' : '▼'}</span>
        )}
      </div>
    </th>
  )

  if (loading) {
    return <div className="max-w-7xl mx-auto"><div className="text-center text-gray-400 py-12">Memuat arsip...</div></div>
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="mb-6">
        <h2 className="text-2xl font-semibold text-gray-900">Archive</h2>
        <p className="text-sm text-gray-500 mt-1">Riwayat tactic yang sudah tereksekusi atau ditolak</p>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 p-4 mb-4">
        <div className="flex flex-wrap gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Start Date</label>
            <input type="date" value={filters.startDate}
              onChange={e => setFilters(prev => ({ ...prev, startDate: e.target.value }))}
              className="px-2 py-1.5 border border-gray-300 rounded text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">End Date</label>
            <input type="date" value={filters.endDate}
              onChange={e => setFilters(prev => ({ ...prev, endDate: e.target.value }))}
              className="px-2 py-1.5 border border-gray-300 rounded text-sm" />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Region</label>
            <select value={filters.region}
              onChange={e => setFilters(prev => ({ ...prev, region: e.target.value }))}
              className="px-2 py-1.5 border border-gray-300 rounded text-sm">
              <option value="">Semua</option>
              {regions.map(r => <option key={r} value={r}>{r}</option>)}
            </select>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Status</label>
            <div className="flex gap-2">
              {FILTER_STATUSES.map(s => (
                <label key={s} className="flex items-center gap-1 text-xs">
                  <input type="checkbox" checked={filters.status.includes(s)}
                    onChange={e => {
                      if (e.target.checked) {
                        setFilters(prev => ({ ...prev, status: [...prev.status, s] }))
                      } else {
                        setFilters(prev => ({ ...prev, status: prev.status.filter(x => x !== s) }))
                      }
                    }} />
                  {s === 'verified' ? 'Terverifikasi' :
                   s === 'deviation_detected' ? 'Deviasi' :
                   s === 'executed' ? 'Tereksekusi' : 'Ditolak'}
                </label>
              ))}
            </div>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">Tipe</label>
            <select value={filters.type}
              onChange={e => setFilters(prev => ({ ...prev, type: e.target.value }))}
              className="px-2 py-1.5 border border-gray-300 rounded text-sm">
              <option value="">Semua</option>
              <option value="overstock">Overstock</option>
              <option value="stockout">Stockout</option>
              <option value="redistribution">Redistribusi</option>
              <option value="investigation">Investigasi</option>
            </select>
          </div>
          <div className="flex-1 min-w-[200px]">
            <label className="block text-xs font-medium text-gray-600 mb-1">Cari</label>
            <input type="text" value={filters.search}
              onChange={e => setFilters(prev => ({ ...prev, search: e.target.value }))}
              placeholder="Cari judul tactic..."
              className="w-full px-2 py-1.5 border border-gray-300 rounded text-sm" />
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead className="bg-gray-50 border-b">
              <tr>
                <SortHeader field="title" label="Judul" />
                <SortHeader field="tactic_type" label="Tipe" />
                <th className="text-left px-3 py-2 font-medium text-gray-600">Status</th>
                <SortHeader field="region" label="Region" />
                <SortHeader field="financial_impact_est" label="Impact" />
                <SortHeader field="created_at" label="Dibuat" />
                <SortHeader field="approved_at" label="Disetujui" />
                <SortHeader field="verification_status" label="Verifikasi" />
              </tr>
            </thead>
            <tbody>
              {filtered.length === 0 ? (
                <tr><td colSpan={8} className="text-center text-gray-400 py-8">Tidak ada data</td></tr>
              ) : (
                filtered.map(t => (
                  <tr key={t.id} className="border-b border-gray-100 hover:bg-gray-50 cursor-pointer"
                    onClick={() => setDetailTactic(t)}>
                    <td className="px-3 py-2 font-medium text-gray-900 max-w-[250px] truncate">{t.title}</td>
                    <td className="px-3 py-2 capitalize">{t.tactic_type}</td>
                    <td className="px-3 py-2">
                      <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                        t.status === 'executed' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                      }`}>
                        {t.status === 'executed' ? 'Tereksekusi' : 'Ditolak'}
                      </span>
                    </td>
                    <td className="px-3 py-2 text-gray-600">{t.region || '—'}</td>
                    <td className="px-3 py-2 font-mono text-gray-700">{formatRp(t.financial_impact_est)}</td>
                    <td className="px-3 py-2 text-gray-600">{t.created_at ? new Date(t.created_at).toLocaleDateString() : '—'}</td>
                    <td className="px-3 py-2 text-gray-600">{t.approved_at ? new Date(t.approved_at).toLocaleDateString() : '—'}</td>
                    <td className="px-3 py-2">
                      {t.verification_status ? (
                        <span className={`text-xs font-medium px-1.5 py-0.5 rounded ${
                          t.verification_status === 'verified' ? 'bg-green-100 text-green-700' : 'bg-orange-100 text-orange-700'
                        }`}>
                          {t.verification_status === 'verified' ? '✅' : '⚠️'}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-400">—</span>
                      )}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
        <div className="px-3 py-2 text-xs text-gray-400 bg-gray-50 border-t">
          {filtered.length} item
        </div>
      </div>

      {detailTactic && (
        <TacticDetailModal
          mode="view"
          tactic={detailTactic}
          user={user}
          onClose={() => setDetailTactic(null)}
          onAction={() => setDetailTactic(null)}
        />
      )}
    </div>
  )
}
