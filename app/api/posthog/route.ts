import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'
export const revalidate = 0

export async function POST(req: Request) {
  const body = await req.json()
  const apiKey = process.env.POST_HOG_API_KEY
  const projectId = process.env.POST_HOG_PROJECT_ID ?? '197048'
  if (!apiKey) {
    return NextResponse.json({ error: 'Missing POST_HOG_API_KEY' }, { status: 500, headers: { 'Cache-Control': 'no-store' } })
  }

  const url = `https://us.posthog.com/api/projects/${projectId}/query/`
  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${apiKey}`,
  }

  const escapeSingle = (s: string) => String(s ?? '').replace(/'/g, "\\'")
  let payload: any
  if (body?.type === 'avg') {
    payload = {
      query: {
        kind: 'HogQLQuery',
        query: `
          SELECT
            count(*) / count(DISTINCT distinct_id) as avg_pageviews_per_visitor,
            count(DISTINCT distinct_id) as total_visitors,
            count(*) as total_pageviews
          FROM events
          WHERE event = '$pageview'
        `
      },
      name: 'avg pageviews per visitor'
    }
  } else {
    const urlToCheck = escapeSingle(body?.urlToCheck)
    payload = {
      query: {
        kind: "HogQLQuery",
        query: `SELECT properties.$current_url AS url, count() AS views FROM events WHERE properties.$current_url = '${urlToCheck}' GROUP BY url ORDER BY views DESC`
      },
      name: "get blog views"
    }
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
    cache: 'no-store',
  })

  const data = await response.json()

  if (!response.ok) {
    return NextResponse.json({ error: 'PostHog request failed', details: data }, { status: response.status, headers: { 'Cache-Control': 'no-store' } })
  }

  if (body?.type === 'avg') {
    const row = data?.results?.[0] ?? null
    const result = row
      ? {
          avg_pageviews_per_visitor: Number(row[0]),
          total_visitors: Number(row[1]),
          total_pageviews: Number(row[2]),
        }
      : null
    return NextResponse.json({ raw: data, result }, { headers: { 'Cache-Control': 'no-store' } })
  }

  return NextResponse.json(data, { headers: { 'Cache-Control': 'no-store' } })
}