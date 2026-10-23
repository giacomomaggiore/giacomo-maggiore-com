type HasPublishedAt = { metadata: { publishedAt: string } }

const DATE_ONLY = /^(\d{4})-(\d{1,2})-(\d{1,2})$/

// Date-only strings ("2025-7-1" or "2025-07-01") are read as local time so the day never shifts
function parseDate(date: string): Date {
  const match = DATE_ONLY.exec(date)
  return match ? new Date(+match[1], +match[2] - 1, +match[3]) : new Date(date)
}

// Formats "2025-07-10" (or an ISO date) as "July 10, 2025"
export function formatDate(date: string): string {
  if (!date) return ''
  return parseDate(date).toLocaleString('en-us', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })
}

// Sort comparator: newest post first
export function byPublishedDesc(a: HasPublishedAt, b: HasPublishedAt): number {
  return +new Date(b.metadata.publishedAt) - +new Date(a.metadata.publishedAt)
}
