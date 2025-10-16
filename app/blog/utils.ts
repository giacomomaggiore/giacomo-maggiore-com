import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

export function getBlogPosts(lang: 'it' | 'en') {
  const postsDir = path.join(process.cwd(), `app/blog/posts/${lang}`)
  const files = fs.readdirSync(postsDir).filter(f => f.endsWith('.mdx'))

  return files.map(filename => {
    const filePath = path.join(postsDir, filename)
    const content = fs.readFileSync(filePath, 'utf8')
    const { data, content: mdxContent } = matter(content)
    return {
      slug: filename.replace(/\.mdx$/, ''),
      metadata: data,
      content: mdxContent,
    }
  })
}

export function formatDate(date: string) {
  return new Date(date).toLocaleDateString('it-IT', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  })
}