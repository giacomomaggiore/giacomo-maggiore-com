// Server-side PostHog HogQL queries behind /api/posthog (page views, visitor stats).
// Results are cached in memory so open tabs polling every minute don't each hit PostHog.
// PostHog runs at most 3 queries at once per project and queues the rest for up to 30 s,
// so there are only a few fixed queries (never one per page URL).

const DEFAULT_PROJECT_ID = '197048'
const CACHE_TTL_MS = 60_000
const ERROR_TTL_MS = 15_000
// Queue wait plus execution time; keep below maxDuration in app/api/posthog/route.ts
const REQUEST_TIMEOUT_MS = 25_000

export class PostHogError extends Error {
  constructor(
    public status: number,
    message: string,
  ) {
    super(message)
  }
}

type CacheEntry = { expires: number; value: Promise<unknown[][]> }
const cache = new Map<string, CacheEntry>()
// Last successful result per query, served if a refresh fails so counters don't drop to 0
const lastGood = new Map<string, unknown[][]>()

// Sends one HogQL query and returns its result rows
async function runHogQL(name: string, query: string): Promise<unknown[][]> {
  const apiKey = process.env.POST_HOG_API_KEY
  if (!apiKey) throw new PostHogError(500, 'Missing POST_HOG_API_KEY')

  const host = process.env.POSTHOG_API_HOST ?? 'https://us.posthog.com'
  const projectId = process.env.POST_HOG_PROJECT_ID ?? DEFAULT_PROJECT_ID

  let response: Response
  try {
    response = await fetch(`${host}/api/projects/${projectId}/query/`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${apiKey}` },
      body: JSON.stringify({ query: { kind: 'HogQLQuery', query }, name }),
      cache: 'no-store',
      signal: AbortSignal.timeout(REQUEST_TIMEOUT_MS),
    })
  } catch (err) {
    console.error('[posthog] request failed:', err)
    throw new PostHogError(502, 'PostHog request failed')
  }

  if (!response.ok) {
    // Log upstream details server-side only; they are not for the browser
    console.error('[posthog] upstream error', response.status, await response.text().catch(() => ''))
    throw new PostHogError(response.status, 'PostHog request failed')
  }

  const data = await response.json()
  return Array.isArray(data?.results) ? data.results : []
}

// Memoizes a query for CACHE_TTL_MS; concurrent callers share one in-flight request
function cachedQuery(key: string, name: string, query: string): Promise<unknown[][]> {
  const hit = cache.get(key)
  if (hit && hit.expires > Date.now()) return hit.value

  const entry: CacheEntry = {
    expires: Date.now() + CACHE_TTL_MS,
    value: runHogQL(name, query).then(
      (rows) => {
        lastGood.set(key, rows)
        return rows
      },
      (err) => {
        // Failures are only remembered briefly so PostHog is retried soon but not hammered
        entry.expires = Date.now() + ERROR_TTL_MS
        const stale = lastGood.get(key)
        if (stale) return stale
        throw err
      },
    ),
  }
  cache.set(key, entry)
  return entry.value
}

export async function getTotalTime() {
  const rows = await cachedQuery(
    'totalTime',
    'total time spent',
    `SELECT sum(duration) AS total_time_seconds
     FROM (
       SELECT DISTINCT $session_id, session.duration AS duration
       FROM events
       WHERE session.duration IS NOT NULL
     )`,
  )
  const row = rows[0]
  return row ? { total_time_seconds: Number(row[0]) } : null
}

export async function getAverageViews() {
  const rows = await cachedQuery(
    'avg',
    'avg pageviews per visitor',
    `SELECT
       count(*) / count(DISTINCT distinct_id) as avg_pageviews_per_visitor,
       count(DISTINCT distinct_id) as total_visitors,
       count(*) as total_pageviews
     FROM events
     WHERE event = '$pageview'`,
  )
  const row = rows[0]
  return row
    ? {
        avg_pageviews_per_visitor: Number(row[0]),
        total_visitors: Number(row[1]),
        total_pageviews: Number(row[2]),
      }
    : null
}

// Page views (only $pageview events, not clicks or page leaves) of every blog/notes URL in one
// query, so a burst of different pages costs PostHog one query. Explicit LIMIT: HogQL defaults to 100 rows.
function getPageViews() {
  return cachedQuery(
    'pageViews',
    'get blog views',
    `SELECT properties.$current_url AS url, count() AS views
     FROM events
     WHERE event = '$pageview'
       AND (properties.$current_url LIKE '%/blog/%' OR properties.$current_url LIKE '%/notes/%')
     GROUP BY url
     ORDER BY views DESC
     LIMIT 5000`,
  )
}

// Rows `[url, views]` for one exact URL (empty when it has no views)
export async function getUrlViews(url: string) {
  const rows = await getPageViews()
  return rows.filter((row) => row[0] === url)
}
