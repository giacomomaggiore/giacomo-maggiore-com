import fs from 'fs'
import path from 'path'
import { getMDXData, isSafeSlug, readMDXFile } from 'lib/wiki/mdx-files'
import { WIKI_PUBLIC_NOTES_DIR } from 'lib/wiki/paths'

// returns every published note as { metadata, slug, content }
export function getNotes() {
  return getMDXData(WIKI_PUBLIC_NOTES_DIR)
}

// returns one published note by slug, or null if it does not exist
export function getNote(slug: string) {
  if (!isSafeSlug(slug)) return null
  const filePath = path.join(WIKI_PUBLIC_NOTES_DIR, `${slug}.mdx`)
  if (!fs.existsSync(filePath)) return null
  return { slug, ...readMDXFile(filePath) }
}
