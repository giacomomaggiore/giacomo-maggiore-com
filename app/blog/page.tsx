import { BlogPosts } from 'app/components/posts'
import 'katex/dist/katex.min.css';
import fetch from "node-fetch";
import Link from 'next/link'
import { getAllSlugs, getPost, formatDate, type Lang } from './utils'
import { cookies } from 'next/headers'


export const metadata = {
  title: 'Blog',
  description: 'Read my blog.',
}




export default async function Page() {
  const cookieStore = await cookies()
  const lang = (cookieStore.get('lang')?.value || 'it') as Lang

  const slugs = getAllSlugs()
  const posts = slugs
    .map(slug => {
      const post = getPost(slug, lang)
      return post ? { ...post, slug } : null
    })
    .filter(Boolean)
    .sort((a, b) => +new Date(b!.metadata.publishedAt) - +new Date(a!.metadata.publishedAt))

  return (
    <section className="max-w-3xl mx-auto">
      <h1>Giacomo's Blog</h1>
      <ul>
        {posts.map(p => (
          <li key={p!.slug}>
            <Link href={`/blog/${p!.slug}`}>
              <h2>{p!.metadata.title}</h2>
              <p>{p!.metadata.summary}</p>
              <p className="text-sm text-gray-500">{formatDate(p!.metadata.publishedAt)}</p>
            </Link>
          </li>
        ))}
      </ul>
    </section>
  )
}
