/** @type {import('next').NextConfig} */
const nextConfig = {
  // PostHog reverse proxy (EU). Currently unused: the browser calls NEXT_PUBLIC_POSTHOG_HOST (US) directly.
  async rewrites() {
    return [
      {
        source: '/ingest/static/:path*',
        destination: 'https://eu-assets.i.posthog.com/static/:path*',
      },
      {
        source: '/ingest/:path*',
        destination: 'https://eu.i.posthog.com/:path*',
      },
      {
        source: '/ingest/decide',
        destination: 'https://eu.i.posthog.com/decide',
      },
    ];
  },
  // Needed by PostHog trailing-slash requests; also keeps current trailing-slash URL behavior
  skipTrailingSlashRedirect: true,
};

module.exports = nextConfig;
