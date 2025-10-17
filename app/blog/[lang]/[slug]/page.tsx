import { notFound } from 'next/navigation'
import { CustomMDX } from 'app/components/mdx'
import { formatDate, getBlogPosts } from 'app/blog/utils'
import { baseUrl } from 'app/sitemap'
import 'katex/dist/katex.min.css'
import ViewsClientOnly from 'app/components/ViewsClientOnly'

export async function generateStaticParams() {
  const langs = ['it', 'en']
  let params: { lang: string; slug: string }[] = []
  for (const lang of langs) {
    const posts = getBlogPosts(lang as 'it' | 'en')
    params.push(...posts.map(post => ({ lang, slug: post.slug })))
  }
  return params
}

export async function generateMetadata({ params }: { params: { lang: string; slug: string } }) {
  const { lang, slug } = params
  const post = getBlogPosts(lang as 'it' | 'en').find(p => p.slug === slug)
  if (!post) return

  const {
    title,
    publishedAt: publishedTime,
    summary: description,
    image,
  } = post.metadata

  const ogImage = image
    ? `${baseUrl}${image}`
    : `${baseUrl}/og?title=${encodeURIComponent(title)}`

  return {
    title,
    description,
    openGraph: {
      title,
      description,
      type: 'article',
      publishedTime,
      url: `${baseUrl}/blog/${lang}/${slug}`,
      images: [{ url: ogImage }],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [ogImage],
    },
  }
}

export default function Blog({ params }: { params: { lang: string; slug: string } }) {
  const { lang, slug } = params
  const posts = getBlogPosts(lang as 'it' | 'en')
  const post = posts.find(p => p.slug === slug)

  if (!post) notFound()

  const url = `https://giacomomaggiore.com/blog/${lang}/${slug}`

  return (
    <section>
      <script
        type="application/ld+json"
        suppressHydrationWarning
        dangerouslySetInnerHTML={{
          __html: JSON.stringify({
            '@context': 'https://schema.org',
            '@type': 'BlogPosting',
            headline: post.metadata.title,
            datePublished: post.metadata.publishedAt,
            dateModified: post.metadata.publishedAt,
            description: post.metadata.summary,
            image: post.metadata.image
              ? `${baseUrl}${post.metadata.image}`
              : `/og?title=${encodeURIComponent(post.metadata.title)}`,
            url: `${baseUrl}/blog/${lang}/${slug}`,
            author: {
              '@type': 'Person',
              name: 'Giacomo Maggiore',
            },
          }),
        }}
      />
      <h1 className="title font-semibold text-2xl tracking-tighter">
        {post.metadata.title} 
      </h1>
      <div className="flex justify-between items-center mt-2 mb-8 text-sm">
        <p className="text-sm text-neutral-600 dark:text-neutral-400">
          {formatDate(post.metadata.publishedAt, lang)}
          <br />
          Page views: <ViewsClientOnly url={url} />
        </p>
      </div>
      <article className="prose">
        <CustomMDX source={post.content} />
      </article>
      <hr />
      <div className="mt-4 greetings text-gray-600">
        <small>
          <p>Thanks for reading.</p>
          <p className="mt-1 mb-1">
            If you enjoy this article, please share it with a friend.<br />
            If you didn’t… well, share it anyway — maybe they have better taste.
          </p>
          <p>Giacomo</p>
        </small>
      </div>
    </section>
  )
}