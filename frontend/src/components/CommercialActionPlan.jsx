import { useState, useEffect } from 'react'
import { api } from '../api'
import TacticCard from './TacticCard'
import TacticDetailModal from './TacticDetailModal'

const SWIMLANES = [
  { key: 'draft', label: 'Draft', color: 'bg-gray-500' },
  { key: 'submitted', label: 'Menunggu Approval', color: 'bg-blue-500' },
  { key: 'approved', label: 'Disetujui', color: 'bg-green-500' },
  { key: 'rejected', label: 'Ditolak', color: 'bg-red-500' },
  { key: 'executed', label: 'Tereksekusi', color: 'bg-emerald-600' },
]

export default function CommercialActionPlan({ user }) {
  const [tactics, setTactics] = useState([])
  const [loading, setLoading] = useState(true)
  const [message, setMessage] = useState('')
  const [detailTactic, setDetailTactic] = useState()
  const [modalMode, setModalMode] = useState('view')

  const fetchTactics = async () => {
    setLoading(true)
    try {
      const res = await api('/api/tactics')
      const data = await res.json()
      setTactics(Array.isArray(data) ? data : [])
    } catch {
      setMessage('Gagal memuat tactic')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchTactics() }, [])

  const showMessage = (msg) => {
    setMessage(msg)
    setTimeout(() => setMessage(''), 3000)
  }

  const getSwimlaneTactics = (status) => {
    return tactics.filter(t => t.status === status)
  }

  const handleAction = async (tactic, action) => {
    if (action === 'edit') {
      setDetailTactic(tactic)
      setModalMode('edit')
      return
    }

    try {
      let res
      switch (action) {
        case 'submit':
          res = await api(`/api/tactics/${tactic.id}/submit`, { method: 'POST' })
          break
        case 'approve':
          res = await api(`/api/tactics/${tactic.id}/approve`, { method: 'POST' })
          break
        case 'reject': {
          const reason = prompt('Alasan penolakan:')
          if (!reason || reason.length < 5) return
          res = await api(`/api/tactics/${tactic.id}/reject`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ reason }),
          })
          break
        }
        case 'execute':
          res = await api(`/api/tactics/${tactic.id}/execute`, { method: 'POST' })
          break
        case 'revise':
          res = await api(`/api/tactics/${tactic.id}/revise`, { method: 'POST' })
          break
        case 'delete':
          res = await api(`/api/tactics/${tactic.id}`, { method: 'DELETE' })
          break
        default:
          return
      }
      if (!res.ok) {
        const err = await res.json()
        throw new Error(err.detail || 'Action failed')
      }
      showMessage(`Tactic ${action} berhasil`)
      fetchTactics()
    } catch (err) {
      showMessage(`Gagal: ${err.message}`)
    }
  }

  const handleCreate = () => {
    setDetailTactic(null)
    setModalMode('create')
  }

  const handleCardClick = (tactic) => {
    setDetailTactic(tactic)
    setModalMode('view')
  }

  if (loading) {
    return (
      <div className="max-w-7xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-2xl font-semibold text-gray-900">Commercial Action Plan</h2>
        </div>
        <div className="text-center text-gray-400 py-12">Memuat tactic...</div>
      </div>
    )
  }

  return (
    <div className="max-w-7xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-2xl font-semibold text-gray-900">Commercial Action Plan</h2>
          <p className="text-sm text-gray-500 mt-1">Kelola, setujui, dan eksekusi tactic distribusi</p>
        </div>
        {user?.role === 'manager' && (
          <button
            onClick={handleCreate}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700 transition-colors"
          >
            + Create Tactic
          </button>
        )}
      </div>

      {message && (
        <div className="mb-4 bg-green-100 border border-green-300 text-green-800 text-sm px-4 py-2 rounded">
          {message}
        </div>
      )}

      <div className="flex gap-4 overflow-x-auto pb-4" style={{ minHeight: '400px' }}>
        {SWIMLANES.map(lane => {
          const laneTactics = getSwimlaneTactics(lane.key)
          return (
            <div key={lane.key} className="flex-1 min-w-[280px] bg-gray-50 rounded-lg p-3">
              <div className="flex items-center gap-2 mb-3">
                <span className={`w-2.5 h-2.5 rounded-full ${lane.color}`} />
                <h3 className="font-semibold text-sm text-gray-700">{lane.label}</h3>
                <span className="text-xs text-gray-400 bg-white px-1.5 py-0.5 rounded-full">
                  {laneTactics.length}
                </span>
              </div>

              <div className="space-y-3">
                {laneTactics.length === 0 ? (
                  <p className="text-xs text-gray-400 text-center py-6">Belum ada tactic</p>
                ) : (
                  laneTactics.map(t => (
                    <TacticCard
                      key={t.id}
                      tactic={t}
                      user={user}
                      onClick={handleCardClick}
                      onAction={handleAction}
                    />
                  ))
                )}
              </div>
            </div>
          )
        })}
      </div>

      {detailTactic !== undefined && (
        <TacticDetailModal
          mode={modalMode}
          tactic={detailTactic}
          user={user}
          onClose={() => setDetailTactic(undefined)}
          onAction={() => { setDetailTactic(undefined); fetchTactics() }}
        />
      )}
    </div>
  )
}
