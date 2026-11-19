import type { Metadata as NextMetadata } from 'next'
import { baseUrl } from 'lib/site'
import type { Metadata } from 'lib/wiki/frontmatter'

const socialImage = new URL('/icon.png', baseUrl).toString()

export function pageMetadata(pagePath: string, title: string, description: string): NextMetadata {
  const url = `${baseUrl}${pagePath}`
  return {
    title: pagePath ? title : { absolute: title },
    description,
    alternates: { canonical: url },
    openGraph: {
      title: pagePath ? `${title} | Giacomo Maggiore` : title,
      description,
      url,
      siteName: 'Giacomo Maggiore',
      locale: 'en_US',
      type: 'website',
      images: [{ url: socialImage, width: 1000, height: 1000, alt: 'Giacomo Maggiore' }],
    },
    twitter: { card: 'summary_large_image', images: [socialImage] },
  }
}

function plainText(value: string): string {
  return value
    .replace(/!\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/\[([^\]]+)\]\([^)]*\)/g, '$1')
    .replace(/<[^>]*>/g, ' ')
    .replace(/\$[^$]*\$/g, ' ')
    .replace(/[*_~`]/g, '')
    .replace(/\s+([,.!?;:])/g, '$1')
    .replace(/\s+/g, ' ')
    .trim()
}

export function articleDescription(meta: Metadata, content: string, isNote: boolean): string {
  // Use the author's words, not generated summaries or the unrelated note summary.
  const summary = isNote ? '' : plainText(meta.summary || '')
  if (summary && (summary.match(/"/g)?.length || 0) % 2 === 0) {
    const combined = `${meta.title.trim()} — ${summary}`
    if (combined.length >= 100 && combined.length <= 240) return combined
  }
  const paragraphs = content.split(/\r?\n\s*\r?\n/)
    .filter(paragraph => !/^\s*(?:#{1,6}\s|[-*+]\s|\||\$\$|<Image|<Table|```|!\[)/.test(paragraph))
    .map(paragraph => plainText(paragraph.replace(/^\s*[-*+]\s.*$/gm, '')))
    .filter(paragraph => paragraph.length >= 70 && !/[{}]/.test(paragraph))
  const excerpt = paragraphs[0] || ''
  const prefix = meta.title.trim()
  const description = excerpt && excerpt !== prefix ? `${prefix} — ${excerpt}` : prefix
  if (description.length <= 240) return description
  const shortened = description.slice(0, 240)
  const end = Math.max(shortened.lastIndexOf('. '), shortened.lastIndexOf('? '), shortened.lastIndexOf('! '))
  return end >= 100 ? shortened.slice(0, end + 1) : `${shortened.slice(0, shortened.lastIndexOf(' '))}…`
}

export function articleMetadata(pagePath: string, meta: Metadata, content: string, lang: 'en' | 'it', isNote = false): NextMetadata {
  const url = `${baseUrl}${pagePath}`
  const description = articleDescription(meta, content, isNote)
  return {
    title: meta.title,
    description,
    alternates: { canonical: url },
    openGraph: {
      title: meta.title,
      description,
      url,
      siteName: 'Giacomo Maggiore',
      locale: lang === 'it' ? 'it_IT' : 'en_US',
      type: 'article',
      publishedTime: meta.publishedAt,
      images: [{ url: socialImage, width: 1000, height: 1000, alt: 'Giacomo Maggiore' }],
    },
    twitter: { card: 'summary_large_image', images: [socialImage] },
  }
}
