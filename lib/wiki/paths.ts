import path from 'path'

/**
 * Single source of truth for where wiki content lives on disk.
 *
 * The repo doubles as an Obsidian vault. Content is split into:
 *   - wiki/public  -> published on the website (browsable pages under /notes and /blog)
 *   - wiki/private -> local-only notes; queryable by the LLM, but NEVER a website page
 *
 * INVARIANT: website page routes import ONLY the PUBLIC constants below.
 * WIKI_PRIVATE_DIR is read solely by the build-time indexer and the local ingestion pipeline.
 */

export const WIKI_DIR = path.join(process.cwd(), 'wiki')

export const WIKI_PUBLIC_DIR = path.join(WIKI_DIR, 'public')
export const WIKI_PRIVATE_DIR = path.join(WIKI_DIR, 'private')

// Published collections (the website reads these)
export const WIKI_PUBLIC_NOTES_DIR = path.join(WIKI_PUBLIC_DIR, 'notes')
export const WIKI_PUBLIC_BLOG_DIR = path.join(WIKI_PUBLIC_DIR, 'blog')