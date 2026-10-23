'use client'

import { useEffect, useState } from 'react'

// Visitor stats shown on the site, read from PostHog through /api/posthog

const POLL_MS = 60_000

// True after the first client render, so server HTML never differs from the client
function useMounted() {
  const [mounted, setMounted] = useState(false)
  useEffect(() => setMounted(true), [])
  return mounted
}

// Views of one page URL; fetched once, shows 0 on any failure
export function PageViews({ url }: { url: string }) {
  const mounted = useMounted()
  const [views, setViews] = useState<number | null>(null)

  useEffect(() => {
    let cancelled = false
    const controller = new AbortController()

    async function load() {
      try {
        const res = await fetch('/api/posthog', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ urlToCheck: url }),
          signal: controller.signal,
        })
        const data = res.ok ? await res.json() : null
        // rows look like [url, count]
        const row = data?.results?.find(([u]: [string, number]) => u === url)
        if (!cancelled) setViews(row ? row[1] : 0)
      } catch {
        if (!cancelled) setViews(0)
      }
    }

    load()
    return () => {
      cancelled = true
      controller.abort()
    }
  }, [url])

  if (!mounted) return <span>...</span>
  return <span>{views !== null ? views : '...'}</span>
}

// Re-fetches a site-wide stat every minute (skipped while the tab is hidden)
function usePolledStat(type: 'avg' | 'totalTime', pick: (result: any) => number | null) {
  const [state, setState] = useState<{ loading: boolean; error: string | null; value: number | null }>({
    loading: true,
    error: null,
    value: null,
  })

  useEffect(() => {
    const controller = new AbortController()

    async function load() {
      try {
        const res = await fetch('/api/posthog', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ type }),
          signal: controller.signal,
        })
        if (!res.ok) {
          const text = await res.text()
          throw new Error(text || `Request failed with status ${res.status}`)
        }
        const data = await res.json()
        setState({ loading: false, error: null, value: pick(data?.result) })
      } catch (err: any) {
        if (err.name === 'AbortError') return
        setState((prev) => ({ ...prev, loading: false, error: err?.message ?? 'Unknown error' }))
      }
    }

    load()
    const id = setInterval(() => {
      if (!document.hidden) load()
    }, POLL_MS)
    return () => {
      controller.abort()
      clearInterval(id)
    }
  }, [type, pick])

  return state
}

const pickTotalPageviews = (result: any) => result?.total_pageviews ?? null
const pickTotalSeconds = (result: any) => result?.total_time_seconds ?? null

// Total pageviews across the whole site (home page footer line)
export function SiteViews() {
  const mounted = useMounted()
  const { loading, error, value } = usePolledStat('avg', pickTotalPageviews)

  if (!mounted) return <span>...</span>
  if (loading) return <div>...</div>
  if (error) return <div>Error: {error}</div>

  return (
    <div>
      page views: {value !== null ? Number(value).toLocaleString() : '...'}
    </div>
  )
}

// Total time visitors spent on the site, in hours (home page footer line)
export function SiteTime() {
  const mounted = useMounted()
  const { loading, error, value } = usePolledStat('totalTime', pickTotalSeconds)

  // Renders nothing on the server and on the first client render
  if (!mounted) return null
  if (loading) return <div>...</div>
  if (error) return <div>Error: {error}</div>

  const totalHours = value !== null ? Number(value) / 3600 : null
  return (
    <div>
      total time: {totalHours !== null ? totalHours.toLocaleString(undefined, { maximumFractionDigits: 2}) : '...'} hours
    </div>
  )
}
