import { cookies } from 'next/headers'
import { ContentList } from 'app/components/ContentList'
import { formatDate } from 'lib/dates'
import { getBlogPostsByLang, type Lang } from './utils'

export const metadata = {
  title: 'Blog',
  description: 'Read my blog.',
}

export default async function Page() {
  // Language comes from the cookie set in middleware.ts (English if missing)
  const cookieStore = await cookies()
  const lang = (cookieStore.get('lang')?.value || 'en') as Lang
  const posts = getBlogPostsByLang(lang).map((post) => ({
    ...post,
    formattedDate: formatDate(post.metadata.publishedAt),
  }))

  return (
    <section>
      <ContentList
        items={posts}
        basePath="/blog"
        searchId="blog-search"
        searchLabel="Search journal entries"
        placeholder="Search blog posts..."
      />
    </section>
  )
}
