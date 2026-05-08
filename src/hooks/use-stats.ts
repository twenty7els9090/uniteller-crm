'use client'

import { useState, useEffect, useCallback } from 'react'
import type { StatsData } from '@/lib/types'

let statsCache: StatsData | null = null
let fetchPromise: Promise<StatsData | null> | null = null

async function fetchStats(): Promise<StatsData | null> {
  if (fetchPromise) return fetchPromise

  fetchPromise = fetch('/api/stats')
    .then((r) => {
      if (r.ok) return r.json()
      throw new Error('Failed')
    })
    .then((data) => {
      statsCache = data
      fetchPromise = null
      return data
    })
    .catch(() => {
      fetchPromise = null
      return null
    })

  return fetchPromise
}

export function useStats() {
  const [stats, setStats] = useState<StatsData | null>(statsCache)
  const [loading, setLoading] = useState(!statsCache)
  const [error, setError] = useState(false)

  useEffect(() => {
    if (statsCache) return

    let cancelled = false
    fetchStats().then((data) => {
      if (cancelled) return
      if (data) {
        setStats(data)
      } else {
        setError(true)
      }
      setLoading(false)
    })

    return () => { cancelled = true }
  }, [])

  const refreshStats = useCallback(() => {
    statsCache = null
    fetchPromise = null
    setLoading(true)
    setError(false)
    fetchStats().then((data) => {
      if (data) {
        setStats(data)
      } else {
        setError(true)
      }
      setLoading(false)
    })
  }, [])

  return { stats, loading, error, refreshStats }
}
