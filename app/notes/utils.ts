import { getMDXData } from 'lib/wiki/mdx-files'
import { WIKI_PUBLIC_NOTES_DIR } from 'lib/wiki/paths'

/**
WORKFLOW:

- getNotes is called by the website
- getNotes calls getMDXData with the notes directory
- getMDXData retrieves all .mdx files in the directory
  - reads each file and parses the content with readMDXFile
  - readMDXFile uses parseFrontmatter to separate metadata and content
- getMDXData returns an array of { metadata, slug, content } objects, one per file

The MDX-reading helpers live in lib/wiki/mdx-files.ts (shared with app/blog/utils.ts).
**/

// returns every published note as { metadata, slug, content }
export function getNotes() {
  return getMDXData(WIKI_PUBLIC_NOTES_DIR)
}

export function formatDate(date: string, includeRelative = false) {
  let currentDate = new Date()
  if (!date.includes('T')) {
    date = `${date}T00:00:00`
  }
  let targetDate = new Date(date)

  let yearsAgo = currentDate.getFullYear() - targetDate.getFullYear()
  let monthsAgo = currentDate.getMonth() - targetDate.getMonth()
  let daysAgo = currentDate.getDate() - targetDate.getDate()

  let formattedDate = ''

  if (yearsAgo > 0) {
    formattedDate = `${yearsAgo}y ago`
  } else if (monthsAgo > 0) {
    formattedDate = `${monthsAgo}mo ago`
  } else if (daysAgo > 0) {
    formattedDate = `${daysAgo}d ago`
  } else {
    formattedDate = 'Today'
  }

  let fullDate = targetDate.toLocaleString('en-us', {
    month: 'long',
    day: 'numeric',
    year: 'numeric',
  })

  if (!includeRelative) {
    return fullDate
  }

  return `${fullDate} (${formattedDate})`
}
