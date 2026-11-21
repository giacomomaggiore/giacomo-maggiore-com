import { notFound } from 'next/navigation'
import type { Metadata } from 'next'
import { ArticlePage } from 'app/components/ArticlePage'
import { getNote, getNotes } from 'app/notes/utils'
import { articleMetadata } from 'lib/seo'
import { baseUrl } from 'lib/site'

export async function generateStaticParams() {
  return getNotes().map((note) => ({ slug: note.slug }))
}

export function generateMetadata({ params }: { params: { slug: string } }): Metadata {
  const post = getNote(params.slug)
  return post ? articleMetadata(`/notes/${post.slug}`, post.metadata, post.content, post.slug === '01-math-finance' ? 'it' : 'en', true) : {}
}

export default function NotePage({ params }: { params: { slug: string } }) {
  const post = getNote(params.slug)
  if (!post) notFound()

  return <ArticlePage post={post} lang={post.slug === '01-math-finance' ? 'it' : 'en'} pageKey={`/notes/${post.slug}`} viewsUrl={`${baseUrl}/notes/${post.slug}`} />
}
