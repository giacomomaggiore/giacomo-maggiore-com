import { NotesList } from './NotesList'
import { formatDate, getNotes } from './utils'

export const metadata = {
  title: 'Notes',
  description: 'Read my notes.',
}

export default function Page() {
  const notes = getNotes()
    .map((note) => ({
      ...note,
      formattedDate: formatDate(note.metadata.publishedAt),
    }))
    .sort(
      (a, b) =>
        +new Date(b.metadata.publishedAt) - +new Date(a.metadata.publishedAt)
    )

  return (
    <section>
      <NotesList notes={notes} />
    </section>
  )
}
