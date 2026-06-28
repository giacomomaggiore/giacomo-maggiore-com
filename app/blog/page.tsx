import 'katex/dist/katex.min.css';
import Link from 'next/link'
import { formatDate, getBlogPosts, type Lang } from './utils'
import { cookies } from 'next/headers'
import { getAllSlugs, getPost } from './utils'

export const metadata = {
  title: 'Blog',
  description: 'Read my blog.',
}




export default async function Page() {
  const cookieStore = await cookies()
  const lang = (cookieStore.get('lang')?.value || 'en') as Lang

  const allPosts = getBlogPosts()
  
  // Filtra per lingua e rimuovi suffissi
  const posts = allPosts
    .filter(post => post.slug.endsWith(`.${lang}`))
    .map(post => ({
      ...post,
      slug: post.slug.replace(/\.(en|it)$/, '')
    }))
    .sort((a, b) => +new Date(b.metadata.publishedAt) - +new Date(a.metadata.publishedAt))

  return (
    <section>
      <h1 className="font-semibold text-2xl mb-8 tracking-tighter">Giacomo's Blog</h1>
      
      <div>
        {posts.map(post => (
          <Link
            key={post.slug}
            className="flex flex-col space-y-1 mb-4"
            href={`/blog/${post.slug}`}
          >
            <div className="w-full flex flex-col md:flex-row space-x-0 md:space-x-2">
              <p className="text-neutral-600 dark:text-neutral-400 w-[180px] tabular-nums">
                {formatDate(post.metadata.publishedAt)}
              </p>
              <p className="text-neutral-900 dark:text-neutral-100 tracking-tight">
                {post.metadata.title}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}

