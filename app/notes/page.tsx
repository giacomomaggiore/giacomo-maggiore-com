import { ContentList } from 'app/components/ContentList'
import { byPublishedDesc, formatDate } from 'lib/dates'
import { getNotes } from './utils'
import { pageMetadata } from 'lib/seo'

export const metadata = pageMetadata('/notes', 'Notes', 'Mathematical Foundations for Finance, Financial Risk Management, Economic Dynamics and Complexity, Principles of Econometrics.')

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
        heading="Notes"
        items={notes}
        basePath="/notes"
        searchId="notes-search"
        searchLabel="Search notes"
        placeholder="Search notes..."
      />
    </section>
  )
}
