import { notFound } from 'next/navigation'
import { CustomMDX } from 'app/components/mdx'
import { formatDate, getNotes } from 'app/notes/utils'
import ViewsClientOnly from 'app/components/ViewsClientOnly'
import { baseUrl } from 'app/sitemap'
import type { Metadata } from 'next'

export async function generateStaticParams() {
  let posts = getNotes()

  return posts.map((post) => ({
    slug: post.slug,
  }))
}

export async function generateMetadata({
  params,
}: {
  params: { slug: string }
}): Promise<Metadata> {
  const post = getNotes().find((note) => note.slug === params.slug)

  if (!post) return {}

  const url = `${baseUrl}/notes/${post.slug}`
  const image = new URL('/icon.png', baseUrl).toString()

  return {
    title: post.metadata.title,
    description: post.metadata.summary,
    alternates: { canonical: url },
    openGraph: {
      title: post.metadata.title,
      description: post.metadata.summary,
      url,
      type: 'article',
      publishedTime: post.metadata.publishedAt,
      images: [{ url: image }],
    },
  }
}

export default function NotePage({ params }: { params: { slug: string } }) {
  const post = getNotes().find((note) => note.slug === params.slug)

  if (!post) notFound()

  const url = `${baseUrl}/notes/${post.slug}`

  return (
    <section>
      <h1 className="title font-semibold text-2xl tracking-tighter">
        {post.metadata.title}
      </h1>
      <div className="flex justify-between items-center mt-2 mb-8 text-sm">
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          {formatDate(post.metadata.publishedAt)}
          <br />
          Page views: <ViewsClientOnly url={url} />
        </p>
      </div>
      <article className="prose">
        <CustomMDX source={post.content} />
      </article>
    </section>
  )
}
