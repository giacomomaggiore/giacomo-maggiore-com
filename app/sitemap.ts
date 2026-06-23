import { getBlogPosts } from './blog/utils'
import { getNotes } from './notes/utils'

export const baseUrl =
  process.env.NODE_ENV === "production"
    ? "https://giacomomaggiore.com"
    : "http://localhost:3000"

export default async function sitemap() {
  // Ottieni solo slug unici (senza duplicati per lingua)
  const uniqueSlugs = new Set<string>()
  const postsWithDates = new Map<string, string>()
  
  getBlogPosts().forEach(post => {
    const cleanSlug = post.slug.replace(/\.(en|it)$/, '')
    uniqueSlugs.add(cleanSlug)
    // Mantieni la data più recente per ogni slug
    if (!postsWithDates.has(cleanSlug) || 
        post.metadata.publishedAt > postsWithDates.get(cleanSlug)!) {
      postsWithDates.set(cleanSlug, post.metadata.publishedAt)
    }
  })

  const blogs = Array.from(uniqueSlugs).map(slug => ({
    url: `${baseUrl}/blog/${slug}`,
    lastModified: postsWithDates.get(slug)!,
  }))

  // Notes: single-language, slug == filename (no .en/.it suffix to strip)
  const notes = getNotes().map(note => ({
    url: `${baseUrl}/notes/${note.slug}`,
    lastModified: note.metadata.publishedAt,
  }))

  const routes = ['', '/blog', '/notes', '/resources'].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString().split('T')[0],
  }))

  return [...routes, ...blogs, ...notes]
}