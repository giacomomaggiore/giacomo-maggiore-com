'use client'
import React, { useEffect, useState } from 'react'

export default function TotalTime() {
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [totalHours, setTotalHours] = useState<number | null>(null)
  const [isMounted, setIsMounted] = useState(false)

  useEffect(() => {
    // assicuriamoci di non mostrare nulla prima del mount per evitare mismatch di hydration
    setIsMounted(true)

    const controller = new AbortController()
    async function fetchTotalTime() {
      try {
        const res = await fetch(`/api/posthog?t=${Date.now()}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type: 'totalTime' }),
          signal: controller.signal,
          cache: 'no-store',
        })
        if (!res.ok) {
          const text = await res.text()
          throw new Error(text || `Request failed with status ${res.status}`)
        }
        const data = await res.json()
        // tenta leggere il valore da result.total_time_seconds, altrimenti fallback alla raw results
        const seconds =
          data?.result?.total_time_seconds ??
          data?.raw?.results?.[0]?.[0] ??
          null

        setTotalHours(seconds !== null ? Number(seconds) / 3600 : null)
      } catch (err: any) {
        if (err.name === 'AbortError') return
        setError(err?.message ?? 'Errore sconosciuto')
      } finally {
        setLoading(false)
      }
    }

    fetchTotalTime()
    const id = setInterval(fetchTotalTime, 60_000) // re-fetch ogni 60s
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
      total time: {totalHours !== null ? totalHours.toLocaleString(undefined, { maximumFractionDigits: 0}) : '...'} hours
    </div>
  )
}
