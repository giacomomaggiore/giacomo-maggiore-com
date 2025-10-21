import { getBlogPosts } from './blog/utils'

export const baseUrl =
  process.env.NODE_ENV === "production"
    ? "https://giacomomaggiore.com"
    : "http://localhost:3000"

export default async function sitemap() {
  let blogs = getBlogPosts().map((post) => {
    const lang = post.slug.endsWith('.en') ? 'en' : 'it'
    const cleanSlug = post.slug.replace(/\.(en|it)$/, '')
    
    return {
      url: `${baseUrl}/blog/${cleanSlug}`,
      lastModified: post.metadata.publishedAt,
    }
  })

  let routes = ['', '/blog', '/resources'].map((route) => ({
    url: `${baseUrl}${route}`,
    lastModified: new Date().toISOString().split('T')[0],
  }))

  return [...routes, ...blogs]
}