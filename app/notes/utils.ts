import fs from 'fs'
import path from 'path'
import { parseFrontmatter } from 'lib/wiki/frontmatter'
import { WIKI_PUBLIC_NOTES_DIR } from 'lib/wiki/paths'

/**
WORKFLOW:

- getBlogPosts is called by website 
- getBlogPosts calls getMDXData with the directory of the notes
- getMDXData retrieves all .mdx files in the directory
  - then it read each file and parses the content with readMDXFile
  - readMDXFile uses parseFrontmatter to separate the metadata and content of the MDX file
- getMDXData returns an array of objects containing the metadata, slug, and content for each MDX file

Finally
- getBlogPosts returns this array to the website, which can then render the blog posts accordingly
**/


// returns list of file names with .mdx 
// in the given dir
function getMDXFiles(dir) {
  return fs.readdirSync(dir).filter((file) => path.extname(file) === '.mdx')
}

// parse the content into the formatter 
// and returns the result
function readMDXFile(filePath) {
  let rawContent = fs.readFileSync(filePath, 'utf-8')
  return parseFrontmatter(rawContent)
}

//  retrieve all .mdx files in the directory, them 
// calls readMDXFile to parse the content 
// and metadata of each file, and returns an array of objects containing the metadata, slug, and content for each MDX file.
function getMDXData(dir) {
  let mdxFiles = getMDXFiles(dir)
  return mdxFiles.map((file) => {
    let { metadata, content } = readMDXFile(path.join(dir, file))
    let slug = path.basename(file, path.extname(file))

    return {
      metadata,
      slug,
      content,
    }
  })
}

// just formats date
export function getBlogPosts() {
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
