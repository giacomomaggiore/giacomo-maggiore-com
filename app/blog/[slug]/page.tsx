import { getAllSlugs, getPost, formatDate, type Lang } from '../utils'
import { CustomMDX } from '../../components/mdx'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import ViewsClientOnly from '../../components/ViewsClientOnly'



export async function generateStaticParams() {
  return getAllSlugs().map(slug => ({ slug }))
}

export default async function BlogPage({ params }: { params: { slug: string } }) {
  const cookieStore = await cookies()
  const lang = (cookieStore.get('lang')?.value || 'it') as Lang

  const post = getPost(params.slug, lang)
  if (!post) notFound()

  const url = `https://giacomomaggiore.com/blog/${params.slug}`

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
