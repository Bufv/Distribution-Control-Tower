import { useEffect, useState } from 'react'
import SellInSellOutChart from './components/SellInSellOutChart'
import StockHealthCards from './components/StockHealthCards'
import RegionalTable from './components/RegionalTable'
import MITLCards from './components/MITLCards'
import PromoForm from './components/PromoForm'

function App() {
  const [backendStatus, setBackendStatus] = useState('checking...')
  const [showPromoForm, setShowPromoForm] = useState(false)

  useEffect(() => {
    fetch('/api/health')
      .then(res => res.json())
      .then(data => setBackendStatus(data.status))
      .catch(() => setBackendStatus('unreachable'))
  }, [])

  return (
    <div className="flex h-screen bg-gray-50">
      {/* Bilah Kiri — Sidebar */}
      <aside className="w-64 bg-gray-900 text-white p-4 hidden md:flex flex-col shrink-0">
        <h1 className="text-lg font-bold mb-6">Distro Control Tower</h1>
        <nav className="space-y-2">
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
          <div>
            Backend: <span className="font-mono">{backendStatus}</span>
          </div>
        </div>
      </aside>

      {/* Bilah Tengah — Main Workspace */}
      <main className="flex-1 p-6 overflow-y-auto">
        <div className="max-w-6xl mx-auto space-y-6">
          {/* Header */}
          <div>
            <h2 className="text-2xl font-semibold text-gray-900">Executive Dashboard</h2>
            <p className="text-sm text-gray-500 mt-1">
              Pusat komando distribusi nasional — real-time sell-in vs sell-out
            </p>
          </div>

          {/* Story 1.1 — Gap Chart */}
          <SellInSellOutChart />

          {/* Story 1.2 + 1.3 — Stock Health & Regional Ranking */}
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

      {/* Bilah Kanan — Tactic Panel */}
      <aside className="w-80 bg-white border-l p-4 hidden lg:flex flex-col shrink-0">
        <h3 className="font-semibold text-sm uppercase tracking-wide text-gray-500 mb-4">
          Tactic Panel
        </h3>
        <div className="flex-1 overflow-y-auto">
          <MITLCards />
        </div>
      </aside>

      {showPromoForm && <PromoForm onClose={() => setShowPromoForm(false)} />}
    </div>
  )
}

export default App
