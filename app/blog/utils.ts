import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

export type Lang = 'it' | 'en'

export function getAllSlugs(): string[] {
  const dir = path.join(process.cwd(), 'app/blog/posts')
  const files = fs.readdirSync(dir)
  const slugs = new Set<string>()

  for (const file of files) {
    const match = file.match(/^(.*)\.(it|en)\.mdx$/)
    if (match) slugs.add(match[1])
  }
  return Array.from(slugs)
}

export function getPost(slug: string, lang: Lang): { metadata: any; content: string } | null {
  const dir = path.join(process.cwd(), 'app/blog/posts')
  const preferred = path.join(dir, `${slug}.${lang}.mdx`)
  const fallback = path.join(dir, `${slug}.it.mdx`)
  const filePath = fs.existsSync(preferred) ? preferred : fallback
  if (!fs.existsSync(filePath)) return null

  const file = fs.readFileSync(filePath, 'utf8')
  const { data, content } = matter(file)
  return { metadata: data, content }
}

export function formatDate(date: string) {
  return new Date(date).toLocaleDateString('it-IT', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}

export function getBlogPosts() {
  const slugs = getAllSlugs()
  // Prendi solo la versione italiana per la sitemap
  return slugs
    .map(slug => {
      const post = getPost(slug, 'it')
      return post
        ? {
            slug,
            ...post.metadata,
          }
        : null
    })
    .filter(Boolean)
}