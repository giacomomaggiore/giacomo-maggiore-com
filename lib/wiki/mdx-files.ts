import fs from 'fs'
import path from 'path'
import { parseFrontmatter } from './frontmatter'

/**
 * Shared MDX directory readers used by both the blog and the notes collections.
 */

type MDXEntry = ReturnType<typeof readMDXFile> & { slug: string }

// Slugs come from URLs: no slashes, so a request can never escape the content directory
const SAFE_SLUG = /^[\w.-]+$/
export const isSafeSlug = (slug: string) => SAFE_SLUG.test(slug)

// Content only changes between deploys, so production can keep parsed files in memory
const cache = new Map<string, MDXEntry[]>()
const useCache = process.env.NODE_ENV === 'production'

// returns list of .mdx file names in the given dir
export function getMDXFiles(dir: string) {
  return fs.readdirSync(dir).filter((file) => path.extname(file) === '.mdx')
}

// reads a single MDX file and returns its parsed { metadata, content }
export function readMDXFile(filePath: string) {
  const rawContent = fs.readFileSync(filePath, 'utf-8')
  return parseFrontmatter(rawContent)
}

// reads all MDX files in a dir, returning { metadata, slug, content } per file
export function getMDXData(dir: string): MDXEntry[] {
  const cached = useCache ? cache.get(dir) : undefined
  // Hand out a copy so callers can sort without corrupting the cache
  if (cached) return [...cached]

  const entries = getMDXFiles(dir).map((file) => ({
    ...readMDXFile(path.join(dir, file)),
    slug: path.basename(file, path.extname(file)),
  }))
  if (useCache) cache.set(dir, entries)
  return [...entries]
}
