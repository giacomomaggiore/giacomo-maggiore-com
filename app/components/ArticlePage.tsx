import { formatDate } from 'lib/dates'
import type { Metadata } from 'lib/wiki/frontmatter'
import { CustomMDX } from './mdx'
import { PageViews } from './stats'

type ArticlePageProps = {
  post: { metadata: Metadata; content: string }
  // Page URL whose PostHog events are counted as "Page views"
  viewsUrl: string
}

// Page body shared by /blog/[slug] and /notes/[slug]
export function ArticlePage({ post, viewsUrl }: ArticlePageProps) {
  return (
    <section>
      <h1 className="title font-semibold text-2xl tracking-tighter">
        {post.metadata.title}
      </h1>
      <div className="flex justify-between items-center mt-2 mb-8 text-sm">
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          {formatDate(post.metadata.publishedAt)}
          <br />
          Page views: <PageViews url={viewsUrl} />
        </p>
      </div>
      <article className="prose">
        <CustomMDX source={post.content} />
      </article>
    </section>
  )
}
