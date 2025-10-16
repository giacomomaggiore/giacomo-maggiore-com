import { getBlogPosts } from './blog/utils'

export const baseUrl =
  process.env.NODE_ENV === "production"
    ? "https://giacomomaggiore.com"
    : "http://localhost:3000"

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