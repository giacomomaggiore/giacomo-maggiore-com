import { NextResponse } from 'next/server'

// Best-effort fixed-window limiter. State lives in memory, so on serverless each
// instance counts separately: it stops casual abuse, not a distributed attack.
type Bucket = { count: number; resetAt: number }

const buckets = new Map<string, Bucket>()
const MAX_BUCKETS = 5_000

export function rateLimit(key: string, limit: number, windowMs: number) {
  const now = Date.now()

  // Keep memory bounded: drop expired buckets, then reset if still too large
  if (buckets.size > MAX_BUCKETS) {
    for (const [k, b] of buckets) if (b.resetAt <= now) buckets.delete(k)
    if (buckets.size > MAX_BUCKETS) buckets.clear()
  }

  const bucket = buckets.get(key)
  if (!bucket || bucket.resetAt <= now) {
    buckets.set(key, { count: 1, resetAt: now + windowMs })
    return { ok: true, retryAfterSec: 0 }
  }

  bucket.count += 1
  if (bucket.count > limit) {
    return { ok: false, retryAfterSec: Math.ceil((bucket.resetAt - now) / 1000) }
  }
  return { ok: true, retryAfterSec: 0 }
}

// Client IP as set by the Vercel proxy (first hop of x-forwarded-for)
export function getClientIp(req: Request): string {
  const forwarded = req.headers.get('x-forwarded-for')
  return forwarded?.split(',')[0].trim() || req.headers.get('x-real-ip') || 'unknown'
}

export function tooManyRequests(retryAfterSec: number) {
  return NextResponse.json(
    { error: 'Too many requests, please slow down.' },
    { status: 429, headers: { 'Retry-After': String(retryAfterSec) } },
  )
}
