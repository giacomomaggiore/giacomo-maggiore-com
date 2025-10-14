import { NextResponse } from 'next/server'
import fs from 'fs'
import path from 'path'
import matter from 'gray-matter'

export const dynamic = "force-dynamic";

export async function GET() {
  const postsDir = path.join(process.cwd(), 'app/blog/posts')
  const files = fs.readdirSync(postsDir).filter(f => f.endsWith('.mdx'))

  const posts = files.map(filename => {
    const filePath = path.join(postsDir, filename)
    const content = fs.readFileSync(filePath, 'utf8')
    const { data } = matter(content)
    return {
      title: data.title,
      date: data.publishedAt,
      summary: data.summary,
      slug: filename.replace('.mdx', ''),
    }
  })

  const siteUrl = 'https://giacomomaggiore.com'
  const rssItems = posts.map(post => `
    <item>
      <title>${post.title}</title>
      <link>${siteUrl}/blog/${post.slug}</link>
      <pubDate>${new Date(post.date).toUTCString()}</pubDate>
      <description>${post.summary}</description>
    </item>
  `).join('')

  const rss = `
    <rss version="2.0">
      <channel>
        <title>Giacomo Maggiore's Blog</title>
        <link>${siteUrl}/blog</link>
        <description>Last thoughts and insights from my life</description>
        ${rssItems}
      </channel>
    </rss>
  `.trim()

  return new NextResponse(rss, {
    headers: {
      'Content-Type': 'application/xml',
    },
  })
}