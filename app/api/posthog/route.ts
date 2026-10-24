import { NextResponse } from 'next/server'
import { getAverageViews, getTotalTime, getUrlViews, PostHogError } from 'lib/posthog'
import { getClientIp, rateLimit, tooManyRequests } from 'lib/rate-limit'
import { PRODUCTION_URL, baseUrl } from 'lib/site'

export const dynamic = 'force-dynamic'
export const revalidate = 0
// PostHog may queue a query for up to 30 s; the default Vercel limit can be as low as 10 s
export const maxDuration = 30

const NO_STORE = { 'Cache-Control': 'no-store' }
const MAX_REQUESTS_PER_MINUTE = 60

// Only our own blog/notes URLs may be queried (the URL is only compared in code, never put in HogQL)
const TRACKED_URL = /^(https?:\/\/[^/\s'"\\]+)\/(?:blog|notes)\/[\w.-]{1,120}$/
const ALLOWED_ORIGINS = new Set([PRODUCTION_URL, baseUrl])

function isTrackedUrl(url: unknown): url is string {
  const match = typeof url === 'string' ? TRACKED_URL.exec(url) : null
  return !!match && ALLOWED_ORIGINS.has(match[1])
}

export async function POST(req: Request) {
  const limit = rateLimit(`posthog:${getClientIp(req)}`, MAX_REQUESTS_PER_MINUTE, 60_000)
  if (!limit.ok) return tooManyRequests(limit.retryAfterSec)

  const body = await req.json().catch(() => null)
  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid JSON body' }, { status: 400, headers: NO_STORE })
  }

  try {
    // Response shapes are read by app/components/stats.tsx
    if (body.type === 'totalTime') {
      return NextResponse.json({ result: await getTotalTime() }, { headers: NO_STORE })
    }
    if (body.type === 'avg') {
      return NextResponse.json({ result: await getAverageViews() }, { headers: NO_STORE })
    }

    // Default: views of a single page URL
    if (!isTrackedUrl(body.urlToCheck)) {
      return NextResponse.json({ error: 'Invalid urlToCheck' }, { status: 400, headers: NO_STORE })
    }
    return NextResponse.json({ results: await getUrlViews(body.urlToCheck) }, { headers: NO_STORE })
  } catch (err) {
    const status = err instanceof PostHogError ? err.status : 500
    const message = err instanceof PostHogError ? err.message : 'Unexpected error'
    return NextResponse.json({ error: message }, { status, headers: NO_STORE })
  }
}
