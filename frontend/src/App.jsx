import { useEffect, useState } from 'react'
import { AuthProvider, useAuth } from './AuthContext'
import { api } from './api'
import LoginPage from './LoginPage'
import SellInSellOutChart from './components/SellInSellOutChart'
import StockHealthCards from './components/StockHealthCards'
import RegionalTable from './components/RegionalTable'
import MITLCards from './components/MITLCards'
import PromoForm from './components/PromoForm'
import EscalateModal from './components/EscalateModal'
import ActionModal from './components/ActionModal'
import AuditTrailModal from './components/AuditTrailModal'
import CommentModal from './components/CommentModal'
import EscalationPanel from './components/EscalationPanel'
import NotificationsDropdown from './components/NotificationsDropdown'

function Dashboard() {
  const { user, logout } = useAuth()
  const [backendStatus, setBackendStatus] = useState('checking...')
  const [showPromoForm, setShowPromoForm] = useState(false)
  const [escalateCard, setEscalateCard] = useState(null)
  const [actionCard, setActionCard] = useState(null)
  const [auditCard, setAuditCard] = useState(null)
  const [commentCard, setCommentCard] = useState(null)
  const [refreshKey, setRefreshKey] = useState(0)

  const isDirector = user?.role === 'director'

  const handleAction = (card, action) => setActionCard({ card, action })
  const handleViewHistory = (card) => setAuditCard(card)
  const handleComment = (card) => setCommentCard(card)
  const handleActionDone = () => setRefreshKey(k => k + 1)

  useEffect(() => {
    api('/api/health')
      .then(r => r.json())
      .then(data => setBackendStatus(data.status))
      .catch(() => setBackendStatus('unreachable'))
  }, [])

  return (
    <div className="flex h-screen bg-gray-50">
      <aside className="w-64 bg-gray-900 text-white p-4 hidden md:flex flex-col shrink-0">
        <h1 className="text-lg font-bold mb-6">Distro Control Tower</h1>

        <div className="mb-4 px-3 py-2 bg-gray-800 rounded text-sm">
          <p className="text-gray-300">{user?.full_name || user?.username}</p>
          <p className="text-xs uppercase tracking-wide text-blue-400">{user?.role}</p>
        </div>

        <nav className="space-y-2 flex-1">
          <a href="#" className="block px-3 py-2 rounded bg-gray-700">Dashboard</a>
          <a href="#" className="block px-3 py-2 rounded hover:bg-gray-700">Inventory Health</a>
          <a href="#" className="block px-3 py-2 rounded hover:bg-gray-700">MITL Action Center</a>
          <a href="#" className="block px-3 py-2 rounded hover:bg-gray-700">Regional Reports</a>
        </nav>

        <div className="mt-auto pt-4 border-t border-gray-700 text-xs text-gray-400 space-y-2">
          <button
            onClick={() => setShowPromoForm(true)}
            className="block w-full text-left px-3 py-2 rounded hover:bg-gray-700 text-gray-300 hover:text-white"
          >
            Promo Calendar
          </button>
          <div className="flex items-center justify-between">
            <span>Backend: <span className="font-mono">{backendStatus}</span></span>
            <NotificationsDropdown user={user} />
          </div>
          <button
            onClick={logout}
            className="block w-full text-left px-3 py-2 rounded hover:bg-red-800 text-red-400 hover:text-white"
          >
            Logout
          </button>
        </div>
      </aside>

      <main className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-6">
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Executive Dashboard</h2>
            <p className="text-sm text-gray-500 mt-1">
              Pusat komando distribusi nasional — real-time sell-in vs sell-out
            </p>
          </div>

          <SellInSellOutChart />

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2">
              <StockHealthCards />
            </div>
            <div>
              <RegionalTable />
            </div>
          </div>
        </div>
      </main>

      <aside className="w-80 bg-white border-l p-4 hidden lg:flex flex-col shrink-0">
        <h3 className="font-semibold text-sm uppercase tracking-wide text-gray-500 mb-4">
          {isDirector ? 'Escalation Panel' : 'Tactic Panel'}
        </h3>
        <div className="flex-1 overflow-y-auto">
          {isDirector ? (
            <EscalationPanel user={user} />
          ) : (
            <MITLCards
              key={refreshKey}
              onEscalate={setEscalateCard}
              onAction={handleAction}
              onViewHistory={handleViewHistory}
              onComment={handleComment}
            />
          )}
        </div>
      </aside>

      {showPromoForm && <PromoForm onClose={() => setShowPromoForm(false)} />}
      {escalateCard && (
        <EscalateModal card={escalateCard} onClose={() => setEscalateCard(null)} />
      )}
      {actionCard && (
        <ActionModal
          card={actionCard.card}
          action={actionCard.action}
          onClose={() => setActionCard(null)}
          onDone={handleActionDone}
        />
      )}
      {auditCard && (
        <AuditTrailModal card={auditCard} onClose={() => setAuditCard(null)} />
      )}
      {commentCard && (
        <CommentModal card={commentCard} onClose={() => setCommentCard(null)} />
      )}
    </div>
  )
}

function AppContent() {
  const { user, loading } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-100">
        <p className="text-gray-500">Loading...</p>
      </div>
    )
  }

  if (!user) {
    return <LoginPage />
  }

  return <Dashboard />
}

export default function App() {
  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  )
}
