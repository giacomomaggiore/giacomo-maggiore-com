import 'katex/dist/katex.min.css';
import fetch from "node-fetch";
import Link from 'next/link'
import { getAllSlugs, getPost, formatDate, type Lang } from './utils'
import { cookies } from 'next/headers'
import { View } from 'lucide-react';


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
    <section>
      <h1 className="font-semibold text-2xl mb-8 tracking-tighter">Giacomo's Diaries</h1>
      
      <div>
        {posts.map(post => (
          <Link
            key={post!.slug}
            className="flex flex-col space-y-1 mb-4"
            href={`/blog/${post!.slug}`}
          >
            <div className="w-full flex flex-col md:flex-row space-x-0 md:space-x-2">
              <p className="text-neutral-600 dark:text-neutral-400 w-[140px] tabular-nums">
                {formatDate(post!.metadata.publishedAt)}
              </p>
              <p className="text-neutral-900 dark:text-neutral-100 tracking-tight">
                {post!.metadata.title}
              </p>
            </div>
          </Link>
        ))}
      </div>
    </section>
  )
}
