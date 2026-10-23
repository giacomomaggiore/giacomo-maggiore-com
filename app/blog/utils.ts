import fs from 'fs'
import path from 'path'
import { byPublishedDesc } from 'lib/dates'
import { getMDXData, getMDXFiles, isSafeSlug, readMDXFile } from 'lib/wiki/mdx-files'
import { WIKI_PUBLIC_BLOG_DIR } from 'lib/wiki/paths'

/**
 * Blog posts live in wiki/public/blog as "<slug>.en.mdx" and "<slug>.it.mdx".
 * The reader picks the language from the `lang` cookie (see middleware.ts).
 */

export type Lang = 'it' | 'en'

const LANG_SUFFIX = /\.(en|it)$/

// "01-polimi-recap.en" -> "01-polimi-recap"
export const stripLangSuffix = (slug: string) => slug.replace(LANG_SUFFIX, '')

// every post file in every language; slugs still carry the ".en"/".it" suffix
export function getBlogPosts() {
  return getMDXData(WIKI_PUBLIC_BLOG_DIR)
}

// posts of one language, newest first, with the language suffix removed from the slug
export function getBlogPostsByLang(lang: Lang) {
  return getBlogPosts()
    .filter((post) => post.slug.endsWith(`.${lang}`))
    .map((post) => ({ ...post, slug: stripLangSuffix(post.slug) }))
    .sort(byPublishedDesc)
}

// unique slugs across languages, e.g. "slug.en.mdx" and "slug.it.mdx" count once
export function getAllSlugs(): string[] {
  const filenames = getMDXFiles(WIKI_PUBLIC_BLOG_DIR)
  return Array.from(new Set(filenames.map((file) => file.replace(/\.(en|it)\.mdx$/, ''))))
}

export function getPost(slug: string, lang?: string) {
  if (!isSafeSlug(slug)) return null

  // Only a language starting with "it" selects Italian, everything else is English
  const normalizedLang: Lang = lang?.toLowerCase().startsWith('it') ? 'it' : 'en'

  // Fall back to the English version when the requested language is missing
  for (const candidate of [normalizedLang, 'en']) {
    const filePath = path.join(WIKI_PUBLIC_BLOG_DIR, `${slug}.${candidate}.mdx`)
    if (fs.existsSync(filePath)) return readMDXFile(filePath)
  }

  return null
}
