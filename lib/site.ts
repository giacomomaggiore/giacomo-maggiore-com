// Site-wide URLs shared by pages, metadata, feeds, and API routes.

// Canonical public origin of the website
export const PRODUCTION_URL = 'https://giacomomaggiore.com'

// Origin used for canonical URLs: production in builds, localhost in `next dev`
export const baseUrl =
  process.env.NODE_ENV === 'production' ? PRODUCTION_URL : 'http://localhost:3000'
