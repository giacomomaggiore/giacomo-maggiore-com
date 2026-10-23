import { ContentList } from 'app/components/ContentList'
import { byPublishedDesc, formatDate } from 'lib/dates'
import { getNotes } from './utils'

export const metadata = {
  title: 'Notes',
  description: 'Read my notes.',
}

export default function Page() {
  const notes = getNotes()
    .sort(byPublishedDesc)
    .map((note) => ({
      ...note,
      formattedDate: formatDate(note.metadata.publishedAt),
    }))

  return (
    <section>
      <ContentList
        items={notes}
        basePath="/notes"
        searchId="notes-search"
        searchLabel="Search notes"
        placeholder="Search notes..."
      />
    </section>
  )
}
