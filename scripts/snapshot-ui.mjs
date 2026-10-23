// Saves the normalized HTML of every public route of a running server, to diff before/after a refactor.
// Usage: node scripts/snapshot-ui.mjs <baseUrl> <outDir>   (run from the repo root)
import fs from 'node:fs'
import path from 'node:path'

const [base, outDir] = process.argv.slice(2)
if (!base || !outDir) {
  console.error('Usage: node scripts/snapshot-ui.mjs <baseUrl> <outDir>')
  process.exit(1)
}
fs.rmSync(outDir, { recursive: true, force: true })
fs.mkdirSync(outDir, { recursive: true })

// Slugs come from the content folders, so new posts are covered automatically
const blogFiles = fs.readdirSync('wiki/public/blog')
const blogSlugs = [...new Set(blogFiles.map((f) => f.replace(/\.(en|it)\.mdx$/, '')))]
const noteSlugs = fs.readdirSync('wiki/public/notes').filter((f) => f.endsWith('.mdx')).map((f) => f.replace(/\.mdx$/, ''))

const routes = [
  '/', '/blog', '/notes', '/books', '/resources', '/privacy', '/newsletter', '/newsletter/check-inbox', '/newsletter/confirmed', '/newsletter/expired', '/ask', '/cv',
  '/does-not-exist', '/robots.txt', '/sitemap.xml', '/feed.xml', '/og?title=hello',
  ...blogSlugs.map((s) => `/blog/${s}`),
  ...noteSlugs.map((s) => `/notes/${s}`),
]

// Blog pages depend on the `lang` cookie, so they are fetched once per language
const cookies = { none: undefined, en: 'lang=en', it: 'lang=it' }
const isBlogRoute = (route) => route === '/blog' || route.startsWith('/blog/')

// Removes everything that legitimately changes between builds (hashes, runtime scripts, build date)
function normalize(html) {
  return html
    .replace(/<script\b[^>]*>(?:(?!<\/script>)[\s\S])*<\/script>/g, (tag) =>
      /src="\/_next\/|__next_f|\$RC|\$RS|\$RR/.test(tag) ? '' : tag,
    )
    .replace(/<link rel="preload"[^>]*as="script"[^>]*\/>/g, '')
    .replace(/\/_next\/static\/[^"' )]+/g, '/_next/static/*')
    .replace(/<meta name="next-size-adjust"[^>]*\/>/g, '')
    .replace(/<lastBuildDate>[^<]*<\/lastBuildDate>/g, '<lastBuildDate>*</lastBuildDate>')
    .replace(/<noscript[^>]*><\/noscript>/g, '')
}

let count = 0
for (const route of routes) {
  for (const variant of isBlogRoute(route) ? Object.keys(cookies) : ['none']) {
    const res = await fetch(base + route, {
      redirect: 'manual',
      headers: cookies[variant] ? { cookie: cookies[variant] } : {},
    })
    const type = res.headers.get('content-type') || ''
    const body = type.startsWith('image/') ? `[image ${(await res.arrayBuffer()).byteLength} bytes]` : await res.text()
    const head = [
      `status: ${res.status}`,
      `location: ${res.headers.get('location') ?? ''}`,
      `content-type: ${type}`,
      `set-cookie: ${res.headers.get('set-cookie') ?? ''}`,
    ].join('\n')
    const file = `${route.replace(/[^a-zA-Z0-9._-]+/g, '_') || 'root'}__${variant}.txt`
    fs.writeFileSync(path.join(outDir, file), `${head}\n---\n${normalize(body)}`)
    count++
  }
}
console.log(`snapshotted ${count} responses into ${outDir}`)
