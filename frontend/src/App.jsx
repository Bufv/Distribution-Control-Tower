import { useEffect, useState } from 'react'
import { AuthProvider, useAuth } from './AuthContext'
import { api } from './api'
import LoginPage from './LoginPage'
import SellInSellOutChart from './components/SellInSellOutChart'
import StockHealthCards from './components/StockHealthCards'
import RegionalTable from './components/RegionalTable'
import MITLCards from './components/MITLCards'
import PromoForm from './components/PromoForm'
import EscalationPanel from './components/EscalationPanel'
import NotificationsDropdown from './components/NotificationsDropdown'
import InventoryPage from './components/InventoryPage'
import MITLDetailModal from './components/MITLDetailModal'

function Dashboard() {
  const { user, logout } = useAuth()
  const [activeTab, setActiveTab] = useState('dashboard')
  const [backendStatus, setBackendStatus] = useState('checking...')
  const [showPromoForm, setShowPromoForm] = useState(false)
  const [detailCard, setDetailCard] = useState(null)

  const isDirector = user?.role === 'director'

  const navItems = [
    { id: 'dashboard', label: 'Dashboard' },
    { id: 'inventory', label: 'Inventory Health' },
    { id: 'mitl', label: 'MITL Action Center' },
    { id: 'regional', label: 'Regional Reports' },
  ]

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
          {navItems.map(item => (
            <button
              key={item.id}
              onClick={() => item.id !== 'mitl' && item.id !== 'regional' && setActiveTab(item.id)}
              className={`block w-full text-left px-3 py-2 rounded ${
                activeTab === item.id ? 'bg-gray-700' : 'hover:bg-gray-700'
              } ${item.id === 'mitl' || item.id === 'regional' ? 'opacity-50 cursor-not-allowed' : ''}`}
              disabled={item.id === 'mitl' || item.id === 'regional'}
            >
              {item.label}
            </button>
          ))}
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
        {activeTab === 'dashboard' && (
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
        )}

        {activeTab === 'inventory' && (
          <InventoryPage />
        )}
      </main>

      <aside className="w-80 bg-white border-l p-4 hidden lg:flex flex-col shrink-0">
        <h3 className="font-semibold text-sm uppercase tracking-wide text-gray-500 mb-4">
          {isDirector ? 'Escalation Panel' : 'Tactic Panel'}
        </h3>
        <div className="flex-1 overflow-y-auto">
          {isDirector ? (
            <EscalationPanel user={user} />
          ) : (
            <MITLCards onDetail={setDetailCard} />
          )}
        </div>
      </aside>

      {showPromoForm && <PromoForm onClose={() => setShowPromoForm(false)} />}
      {detailCard && <MITLDetailModal card={detailCard} onClose={() => setDetailCard(null)} />}
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
