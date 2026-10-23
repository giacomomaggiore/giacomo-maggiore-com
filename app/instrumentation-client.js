'use client'

import posthog from 'posthog-js'

// Browser analytics; does nothing when the PostHog key is not configured
if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    // Next.js navigates without reloading, so also count in-site link clicks as page views
    capture_pageview: 'history_change',
  })
}
