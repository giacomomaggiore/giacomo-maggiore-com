/**
 * Shared frontmatter parser for wiki markdown/MDX files.
 *
 * Extracted verbatim from the previously-duplicated implementations in
 * app/notes/utils.ts and app/blog/utils.ts so there is a single parser used
 * everywhere (website readers + build-time indexer).
 */

export type Metadata = {
  title: string
  publishedAt: string
  summary: string
  image?: string
}

export function parseFrontmatter(fileContent: string) {
  let frontmatterRegex = /---\s*([\s\S]*?)\s*---/
  let match = frontmatterRegex.exec(fileContent)

  // No frontmatter block: return the whole file as content with empty metadata
  // instead of throwing on a non-null assertion.
  if (!match) {
    return { metadata: {} as Metadata, content: fileContent.trim() }
  }

  let frontMatterBlock = match[1]
  let content = fileContent.replace(frontmatterRegex, '').trim()
  let frontMatterLines = frontMatterBlock.trim().split('\n')
  let metadata: Partial<Metadata> = {}

  frontMatterLines.forEach((line) => {
    let [key, ...valueArr] = line.split(': ')
    let value = valueArr.join(': ').trim()
    value = value.replace(/^['"](.*)['"]$/, '$1') // Remove quotes
    metadata[key.trim() as keyof Metadata] = value
  })

  return { metadata: metadata as Metadata, content }
}