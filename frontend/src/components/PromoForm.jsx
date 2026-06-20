import { useState, useEffect } from 'react'

export default function PromoForm({ onClose }) {
  const [distributors, setDistributors] = useState([])
  const [skus, setSkus] = useState([])
  const [promos, setPromos] = useState([])
  const [form, setForm] = useState({
    distributor_id: '',
    sku_id: '',
    promo_name: '',
    start_date: '',
    end_date: '',
    discount_rate: '',
  })
  const [message, setMessage] = useState('')

  useEffect(() => {
    fetch('/api/distributors')
      .then(r => r.json())
      .then(setDistributors)
    fetch('/api/sales/skus')
      .then(r => r.json())
      .then(setSkus)
    fetchPromos()
  }, [])

  function fetchPromos() {
    fetch('/api/promos')
      .then(r => r.json())
      .then(setPromos)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setMessage('')

    const params = new URLSearchParams({
      distributor_id: form.distributor_id,
      sku_id: form.sku_id,
      promo_name: form.promo_name,
      start_date: form.start_date,
      end_date: form.end_date,
    })
    if (form.discount_rate) params.set('discount_rate', form.discount_rate)

    const res = await fetch(`/api/promos?${params}`, { method: 'POST' })
    const data = await res.json()

    if (res.ok) {
      setMessage(`✅ ${data.message}`)
      setForm({ distributor_id: '', sku_id: '', promo_name: '', start_date: '', end_date: '', discount_rate: '' })
      fetchPromos()
    } else {
      setMessage(`❌ ${data.detail || 'Error'}`)
    }
  }

  async function handleDelete(id) {
    const res = await fetch(`/api/promos/${id}`, { method: 'DELETE' })
    if (res.ok) {
      fetchPromos()
    }
  }

  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50">
      <div className="bg-white rounded-lg shadow-xl w-full max-w-lg max-h-[90vh] overflow-y-auto p-6">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-lg font-semibold">Promo Calendar</h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600 text-xl leading-none">&times;</button>
        </div>

        {message && (
          <div className="mb-4 text-sm p-2 rounded bg-gray-100">{message}</div>
        )}

        <form onSubmit={handleSubmit} className="space-y-3 mb-6">
          <h4 className="font-medium text-sm text-gray-700">Tambah Promo Baru</h4>

          <div className="grid grid-cols-2 gap-3">
            <select
              required
              value={form.distributor_id}
              onChange={e => setForm(f => ({ ...f, distributor_id: e.target.value }))}
              className="text-sm border rounded px-2 py-1.5"
            >
              <option value="">Pilih Distributor</option>
              {distributors.map(d => (
                <option key={d.id} value={d.id}>{d.name}</option>
              ))}
            </select>

            <select
              required
              value={form.sku_id}
              onChange={e => setForm(f => ({ ...f, sku_id: e.target.value }))}
              className="text-sm border rounded px-2 py-1.5"
            >
              <option value="">Pilih SKU</option>
              {skus.map(s => (
                <option key={s.id} value={s.id}>{s.name}</option>
              ))}
            </select>
          </div>

          <input
            required
            placeholder="Nama Promo"
            value={form.promo_name}
            onChange={e => setForm(f => ({ ...f, promo_name: e.target.value }))}
            className="text-sm border rounded px-2 py-1.5 w-full"
          />

          <div className="grid grid-cols-2 gap-3">
            <div>
              <label className="text-xs text-gray-500">Mulai</label>
              <input
                type="date"
                required
                value={form.start_date}
                onChange={e => setForm(f => ({ ...f, start_date: e.target.value }))}
                className="text-sm border rounded px-2 py-1.5 w-full"
              />
            </div>
            <div>
              <label className="text-xs text-gray-500">Selesai</label>
              <input
                type="date"
                required
                value={form.end_date}
                onChange={e => setForm(f => ({ ...f, end_date: e.target.value }))}
                className="text-sm border rounded px-2 py-1.5 w-full"
              />
            </div>
          </div>

          <input
            type="number"
            step="0.01"
            placeholder="Diskon (%)"
            value={form.discount_rate}
            onChange={e => setForm(f => ({ ...f, discount_rate: e.target.value }))}
            className="text-sm border rounded px-2 py-1.5 w-full"
          />

          <button type="submit" className="w-full bg-blue-600 text-white text-sm py-2 rounded font-medium hover:bg-blue-700">
            Simpan Promo
          </button>
        </form>

        {promos.length > 0 && (
          <div>
            <h4 className="font-medium text-sm text-gray-700 mb-2">Promo Aktif</h4>
            <div className="space-y-2">
              {promos.map(p => (
                <div key={p.id} className="flex items-center justify-between text-xs bg-gray-50 rounded p-2">
                  <div>
                    <p className="font-medium">{p.promo_name}</p>
                    <p className="text-gray-500">{p.distributor_name} — {p.start_date} s.d. {p.end_date}</p>
                  </div>
                  <button
                    onClick={() => handleDelete(p.id)}
                    className="text-red-500 hover:text-red-700 ml-2"
                  >
                    Hapus
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
