export default function StaleTooltip({ stale, region, children }) {
  if (!stale) return children

  return (
    <div
      className="relative border-l-4 border-yellow-400 bg-yellow-50 rounded"
      title={`Peringatan: Data Sell-Out ${region || 'wilayah ini'} menggunakan estimasi proyeksi H-1. Keputusan logistik harap memperhitungkan margin of error.`}
    >
      {children}
    </div>
  )
}
