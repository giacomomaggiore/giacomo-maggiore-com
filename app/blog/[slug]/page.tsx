import { getAllSlugs, getPost, formatDate, type Lang } from '../utils'
import { CustomMDX } from '../../components/mdx'
import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'

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
    <section className="max-w-3xl mx-auto">
      <h1>{post.metadata.title}</h1>
      <p className="text-gray-500">{formatDate(post.metadata.publishedAt)}</p>
      {/* <ViewsClientOnly url={url} /> */}
      <article className="prose">
        <CustomMDX source={post.content} />
      </article>
    </section>
  )
}
