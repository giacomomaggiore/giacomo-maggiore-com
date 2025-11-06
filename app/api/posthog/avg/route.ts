import { NextResponse } from 'next/server'

export async function GET(req: Request) {
  const apiKey = process.env.POST_HOG_API_KEY
  const projectId = "197048"

  const url = `https://us.posthog.com/api/projects/${projectId}/query/`
  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${apiKey}`,
  }

  const payload = {
    query: {
      kind: "HogQLQuery",
      query: `
        SELECT
          count(*) / count(DISTINCT distinct_id) as avg_pageviews_per_visitor,
          count(DISTINCT distinct_id) as total_visitors,
          count(*) as total_pageviews
        FROM events
        WHERE event = '$pageview'
      `
    },
    name: "avg pageviews per visitor"
  }

  try {
    const response = await fetch(url, {
      method: "POST",
      headers,
      body: JSON.stringify(payload),
    })

    if (!response.ok) {
      const text = await response.text()
      return NextResponse.json({ error: "PostHog request failed", details: text }, { status: response.status })
    }

    const data = await response.json()
    const row = data?.results?.[0] ?? null

    const result = row
      ? {
          avg_pageviews_per_visitor: Number(row[0]),
          total_visitors: Number(row[1]),
          total_pageviews: Number(row[2]),
        }
      : null

    return NextResponse.json({ raw: data, result })
  } catch (err) {
    return NextResponse.json({ error: "Request error", details: String(err) }, { status: 500 })
  }
}