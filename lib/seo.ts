import type { Metadata as NextMetadata } from 'next'
import { baseUrl } from 'lib/site'
import type { Metadata } from 'lib/wiki/frontmatter'

// Page metadata (title, canonical URL, Open Graph) shared by blog posts and notes
export function articleMetadata(pagePath: string, meta: Metadata): NextMetadata {
  const url = `${baseUrl}${pagePath}`
  const image = new URL('/icon.png', baseUrl).toString()

  return {
    title: meta.title,
    description: meta.summary,
    alternates: { canonical: url },
    openGraph: {
      title: meta.title,
      description: meta.summary,
      url,
      type: 'article',
      publishedTime: meta.publishedAt,
      images: [{ url: image }],
    },
  }
}
