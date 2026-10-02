import { cookies } from 'next/headers'
import { BlogList } from './BlogList'
import { formatDate, getBlogPosts, type Lang } from './utils'

export const metadata = {
  title: 'Blog',
  description: 'Read my blog.',
}

export default async function Page() {
  const cookieStore = await cookies()
  const lang = (cookieStore.get('lang')?.value || 'en') as Lang
  const posts = getBlogPosts()
    .filter((post) => post.slug.endsWith(`.${lang}`))
    .map((post) => ({
      ...post,
      slug: post.slug.replace(/\.(en|it)$/, ''),
      formattedDate: formatDate(post.metadata.publishedAt),
    }))
    .sort(
      (a, b) =>
        +new Date(b.metadata.publishedAt) - +new Date(a.metadata.publishedAt)
    )

  return (
    <section>
      <BlogList posts={posts} />
    </section>
  )
}
