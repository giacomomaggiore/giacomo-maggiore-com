'use client'

import Link from 'next/link'
import { useMemo, useState } from 'react'
import ReactMarkdown from 'react-markdown'
import rehypeRaw from 'rehype-raw'

const PREVIEW_LENGTH = 420

type Note = {
  slug: string
  content: string
  formattedDate: string
  metadata: {
    title: string
    publishedAt: string
  }
}

type NotesListProps = {
  notes: Note[]
}

function getPreview(content: string) {
  const preview = content.slice(0, PREVIEW_LENGTH).trimEnd()
  return preview.length < content.length ? `${preview} ...` : preview
}

export function NotesList({ notes }: NotesListProps) {
  const [query, setQuery] = useState('')
  const filteredNotes = useMemo(() => {
    const normalizedQuery = query.trim().toLocaleLowerCase()

    if (!normalizedQuery) return notes

    return notes.filter(({ content, metadata }) =>
      `${metadata.title} ${content}`.toLocaleLowerCase().includes(normalizedQuery)
    )
  }, [notes, query])

  return (
    <div>
      <label className="sr-only" htmlFor="notes-search">
        Search notes
      </label>
      <input
        id="notes-search"
        type="search"
        value={query}
        onChange={(event) => setQuery(event.target.value)}
        placeholder="Search notes..."
        className="mb-12 w-full rounded border border-neutral-200 bg-transparent p-2 text-sm text-black placeholder:text-neutral-400 focus:outline-none dark:border-neutral-700 dark:text-white"
      />

      <div>
        {filteredNotes.map((note) => (
          <article key={note.slug} className="border-b border-neutral-200 pt-5 pb-4 first:pt-0 dark:border-neutral-800">
            <div className="flex items-baseline justify-between gap-6">
              <Link
                href={`/notes/${note.slug}`}
                className="text-lg font-semibold tracking-tight text-black dark:text-white"
              >
                {note.metadata.title}
              </Link>
              <time className="shrink-0 text-base font-normal tracking-tight text-black dark:text-white">
                {note.formattedDate}
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
                {getPreview(note.content)}
              </ReactMarkdown>
            </div>
          </article>
        ))}
      </div>
    </div>
  )
}
