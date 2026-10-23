'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'

const PREVIEW_LENGTH = 420

type Item = {
  slug: string
  content: string
  formattedDate: string
  metadata: {
    title: string
    publishedAt: string
  }
}

type ContentListProps = {
  items: Item[]
  // URL prefix of each item page, e.g. "/blog"
  basePath: string
  searchId: string
  searchLabel: string
  placeholder: string
}

function getPreview(content: string) {
  const preview = content.slice(0, PREVIEW_LENGTH).trimEnd()
  return preview.length < content.length ? `${preview} ...` : preview
}

// Searchable list of posts or notes, shared by /blog and /notes
export function ContentList({ items, basePath, searchId, searchLabel, placeholder }: ContentListProps) {
  const [query, setQuery] = useState('')
  const filteredItems = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase()

    if (!normalizedQuery) return items

    return items.filter(({ content, metadata }) =>
      `${metadata.title} ${content}`.toLocaleLowerCase().includes(normalizedQuery)
    )
  }, [items, query])

  return (
    <div>
      <label className="sr-only" htmlFor={searchId}>
        {searchLabel}
      </label>
      <input
        id={searchId}
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder={placeholder}
        className="mb-12 w-full rounded border border-neutral-200 bg-transparent p-2 text-sm text-black placeholder:text-neutral-400 focus:outline-none dark:border-neutral-700 dark:text-white"
      />

      <div>
        {filteredItems.map((item) => (
          <article key={item.slug} className="border-b border-neutral-200 pt-5 pb-4 first:pt-0 dark:border-neutral-800">
            <div className="flex items-baseline justify-between gap-6">
              <Link
                href={`${basePath}/${item.slug}`}
                className="text-lg font-semibold tracking-tight text-black dark:text-white"
              >
                {item.metadata.title}
              </Link>
              <time className="shrink-0 text-base font-normal tracking-tight text-black dark:text-white">
                {item.formattedDate}
              </time>
            </div>
            <div
              className="mt-2 text-xs leading-4 text-neutral-500 dark:text-neutral-400"
              style={{
                display: '-webkit-box',
                WebkitBoxOrient: 'vertical',
                WebkitLineClamp: 2,
                overflow: 'hidden',
              }}
            >
              <ReactMarkdown
                rehypePlugins={[rehypeRaw]}
                components={{ p: ({ children }) => <>{children} </> }}
              >
                {getPreview(item.content)}
              </ReactMarkdown>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
