import fs from 'fs'
import path from 'path'
import { parseFrontmatter } from './frontmatter'

/**
 * Shared MDX directory readers.
 *
 * Extracted from the previously-duplicated implementations in
 * app/notes/utils.ts and app/blog/utils.ts so there is a single set of
 * helpers used by both collections.
 */

// returns list of .mdx file names in the given dir
export function getMDXFiles(dir: string) {
  return fs.readdirSync(dir).filter((file) => path.extname(file) === '.mdx')
}

// reads a single MDX file and returns its parsed { metadata, content }
export function readMDXFile(filePath: string) {
  let rawContent = fs.readFileSync(filePath, 'utf-8')
  return parseFrontmatter(rawContent)
}

// reads all MDX files in a dir, returning { metadata, slug, content } per file
export function getMDXData(dir: string) {
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
