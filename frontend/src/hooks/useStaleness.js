import { useState, useEffect } from 'react'
import { api } from '../api'

export default function useStaleness() {
  const [stalenessMap, setStalenessMap] = useState({})
  const [loading, setLoading] = useState(true)

  const fetchStaleness = async () => {
    try {
      const res = await api('/api/staleness')
      if (res.ok) {
        const data = await res.json()
        const map = {}
        for (const item of data) {
          map[item.distributor_id] = item
        }
        setStalenessMap(map)
      }
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchStaleness()
    const interval = setInterval(fetchStaleness, 60000)
    return () => clearInterval(interval)
  }, [])

  return { stalenessMap, loading }
}
