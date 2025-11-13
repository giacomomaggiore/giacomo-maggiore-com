'use client'
import React, { useEffect, useState } from 'react'

export default function CumulativeViews() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalViews, setTotalViews] = useState<number | null>(null)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    // assicuriamoci di non mostrare nulla prima del mount per evitare mismatch di hydration
    setIsMounted(true)

    const controller = new AbortController()
    async function fetchTotalViews() {
      try {
        const res = await fetch(`/api/posthog?t=${Date.now()}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'avg' }),
          signal: controller.signal,
          cache: 'no-store',
        })
        if (!res.ok) {
          const text = await res.text()
          throw new Error(text || `Request failed with status ${res.status}`)
        }
        const data = await res.json()
        // tenta leggere il valore da result.total_pageviews, altrimenti fallback alla raw results
        const val =
          data?.result?.total_pageviews ??
          data?.raw?.results?.[0]?.[2] ??
          null

        setTotalViews(val !== null ? Number(val) : null)
      } catch (err: any) {
        if (err.name === 'AbortError') return
        setError(err?.message ?? 'Errore sconosciuto')
      } finally {
        setLoading(false)
      }
    }

    fetchTotalViews()
    const id = setInterval(fetchTotalViews, 60_000) // re-fetch ogni 60s
    return () => {
      controller.abort()
      clearInterval(id)
    }
  }, [])

  // non renderizzare nulla sul client fino a quando non siamo montati (evita hydration mismatch)
  if (!isMounted) return null

  if (loading) return <div>...</div>
  if (error) return <div>Errore: {error}</div>

  return (
    <div>
      
      {totalViews !== null ? totalViews.toLocaleString() : '...'}
    </div>
  )
}

