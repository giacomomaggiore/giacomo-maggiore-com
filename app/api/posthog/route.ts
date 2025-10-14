import { NextResponse } from 'next/server'

export async function POST() {
  const url = "https://us.posthog.com/api/projects/197048/query/"
  const headers = {
    "Content-Type": "application/json",
    "Authorization": `Bearer ${process.env.POST_HOG_API_KEY}`,
  }

  const payload = {
    query: {
      kind: "HogQLQuery",
      query: "SELECT properties.$current_url AS url, count() AS views FROM events WHERE properties.$current_url LIKE '%/blog%' GROUP BY url ORDER BY views DESC"
    },
    name: "get blog views"
  }

  const response = await fetch(url, {
    method: "POST",
    headers,
    body: JSON.stringify(payload),
  })

  const data = await response.json()
  console.log("Response from PostHog API:", data)
  return NextResponse.json(data)
}