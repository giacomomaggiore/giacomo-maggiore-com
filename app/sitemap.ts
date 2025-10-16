import { getBlogPosts } from './blog/utils'
import { baseUrl } from './sitemap'

export default async function sitemap() {
  const langs = ['it', 'en']
  let blogs: { url: string; lastModified: string }[] = []

  for (const lang of langs) {
    blogs.push(
      ...getBlogPosts(lang as 'it' | 'en').map((post) => ({
        url: `${baseUrl}/blog/${lang}/${post.slug}`,
        lastModified: post.metadata.publishedAt,
      }))
    )
  }

  return blogs
}