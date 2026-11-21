import { getAllSlugs } from 'app/blog/utils'
import { getNotes } from 'app/notes/utils'

export function isPublicPageKey(pageKey: string) {
  const match = /^\/(blog|notes)\/([a-zA-Z0-9_.-]+)$/.exec(pageKey)
  if (!match) return false
  return match[1] === 'blog' ? getAllSlugs().includes(match[2]) : getNotes().some(note => note.slug === match[2])
}
