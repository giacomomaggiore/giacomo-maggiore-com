import { baseUrl } from 'lib/site'
import { getBlogPosts, stripLangSuffix } from './blog/utils'
import { getNotes } from './notes/utils'

export default async function sitemap() {
  // One entry per post (not per language), dated with its most recent version
  const postDates = new Map<string, string>()
  getBlogPosts().forEach(post => {
    const slug = stripLangSuffix(post.slug)
    if (!postDates.has(slug) || post.metadata.publishedAt > postDates.get(slug)!) {
      postDates.set(slug, post.metadata.publishedAt)
    }
  })

  const blogs = Array.from(postDates, ([slug, lastModified]) => ({
    url: `${baseUrl}/blog/${slug}`,
    lastModified,
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
