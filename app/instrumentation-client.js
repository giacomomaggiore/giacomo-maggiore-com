'use client'

import posthog from 'posthog-js'

if (typeof window !== 'undefined' && process.env.NEXT_PUBLIC_POSTHOG_KEY) {
  posthog.init(process.env.NEXT_PUBLIC_POSTHOG_KEY, {
    api_host: process.env.NEXT_PUBLIC_POSTHOG_HOST,
    // puoi aggiungere opzioni come autocapture, persistence, ecc.
    loaded: (ph) => {
      console.log('PostHog loaded', ph);
    },
  })

  posthog.capture('test_event', { origin: 'init client' })
}