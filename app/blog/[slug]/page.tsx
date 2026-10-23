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
  const post = getPost(params.slug, 'en')
  return post ? articleMetadata(`/blog/${params.slug}`, post.metadata) : {}
}

export default async function BlogPage({ params }: { params: { slug: string } }) {
  // Language comes from the cookie set in middleware.ts (Italian if missing)
  const cookieStore = await cookies()
  const lang = (cookieStore.get('lang')?.value || 'it') as Lang

  const post = getPost(params.slug, lang)
  if (!post) notFound()

  // Views are always counted on the production URL, also when running locally
  return <ArticlePage post={post} viewsUrl={`${PRODUCTION_URL}/blog/${params.slug}`} />
}
