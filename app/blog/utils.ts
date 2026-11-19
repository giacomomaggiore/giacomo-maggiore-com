import fs from 'fs'
import path from 'path'
import { byPublishedDesc } from 'lib/dates'
import { getMDXData, isSafeSlug, readMDXFile } from 'lib/wiki/mdx-files'
import { isPublished } from 'lib/wiki/frontmatter'
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
  return getMDXData(WIKI_PUBLIC_BLOG_DIR).filter(post => isPublished(post.metadata))
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
  return Array.from(new Set(getBlogPosts().map(post => stripLangSuffix(post.slug))))
}

export function getPost(slug: string, lang?: string) {
  if (!isSafeSlug(slug)) return null

  // Only a language starting with "it" selects Italian, everything else is English
  const normalizedLang: Lang = lang?.toLowerCase().startsWith('it') ? 'it' : 'en'

  // Keep single-language articles reachable for either language preference.
  const candidates: Lang[] = normalizedLang === 'it' ? ['it', 'en'] : ['en', 'it']
  for (const candidate of candidates) {
    const filePath = path.join(WIKI_PUBLIC_BLOG_DIR, `${slug}.${candidate}.mdx`)
    if (fs.existsSync(filePath)) {
      const post = readMDXFile(filePath)
      if (isPublished(post.metadata)) return { ...post, lang: candidate }
    }
  }

  return null
}
