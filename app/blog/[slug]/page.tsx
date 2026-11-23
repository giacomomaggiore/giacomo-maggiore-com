import { cookies } from 'next/headers'
import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { articleMetadata } from 'lib/seo'
import { PRODUCTION_URL } from 'lib/site'
import { ArticlePage } from '../../components/ArticlePage'
import { getAllSlugs, getPost, type Lang } from '../utils'

export async function generateStaticParams() {
  return getAllSlugs().map(slug => ({ slug }))
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const lang = cookies().get('lang')?.value || 'en'
  const post = getPost(params.slug, lang)
  return post ? articleMetadata(`/blog/${params.slug}`, post.metadata, post.content, post.lang) : {}
}

export default async function BlogPage({ params }: { params: { slug: string } }) {
  // Language comes from the cookie set in middleware.ts (English if missing)
  const cookieStore = await cookies()
  const lang = (cookieStore.get('lang')?.value || 'en') as Lang

  const post = getPost(params.slug, lang)
  if (!post) notFound()

  // Views are always counted on the production URL, also when running locally
  return <ArticlePage post={post} lang={post.lang} pageKey={`/blog/${params.slug}`} viewsUrl={`${PRODUCTION_URL}/blog/${params.slug}`} />
}
