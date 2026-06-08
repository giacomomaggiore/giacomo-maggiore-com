import fs from 'fs'
import path from 'path'
import { parseFrontmatter } from 'lib/wiki/frontmatter'
import { WIKI_PUBLIC_BLOG_DIR } from 'lib/wiki/paths'


/**

 typical flow (short):

Site list page → calls getBlogPosts() 
→ render list (filter by language / strip .en/.it from slug).

User opens /blog/:slug
 → page loader calls getPost(slug, lang) 
 → returns single post content →
 render full post.

 */

export type Lang = 'it' | 'en'

// returns list of .mdx files in a directory
function getMDXFiles(dir: string) {
  return fs.readdirSync(dir).filter((file) => path.extname(file) === '.mdx')
}

// Helper per leggere un singolo file MDX
// e restituire un oggetto con metadata e content
function readMDXFile(filePath: string) {
  let rawContent = fs.readFileSync(filePath, 'utf-8')
  return parseFrontmatter(rawContent)
}

// Helper per leggere tutti i file MDX in una directory e
//  restituire un array di oggetti con metadata, slug e content
function getMDXData(dir: string) {
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

export function getBlogPosts() {
  return getMDXData(WIKI_PUBLIC_BLOG_DIR)
}

// Estrae tutti gli slug unici dai file MDX nella directory del blog
// Considera che i file possono essere del tipo "slug.en.mdx" 
// o "slug.it.mdx", ma vogliamo solo "slug"
export function getAllSlugs(): string[] {
  const postsDirectory = WIKI_PUBLIC_BLOG_DIR
  const filenames = fs.readdirSync(postsDirectory)
  
  // Rimuovi duplicati e estensioni lingua
  const slugs = new Set<string>()
  filenames.forEach(filename => {
    const slug = filename.replace(/\.(en|it)\.mdx$/, '')
    slugs.add(slug)
  })
  
  return Array.from(slugs)
}

export function getPost(slug: string, lang?: string) {
  const postsDirectory = WIKI_PUBLIC_BLOG_DIR

  // Normalizza la lingua: solo se inizia per "it" → it, in tutti gli altri casi → en
  const normalizedLang: Lang = (typeof lang === 'string' && lang.toLowerCase().startsWith('it')) ? 'it' : 'en'

  console.log(`Looking for file: ${slug}.${normalizedLang}.mdx`)
  const filePath = path.join(postsDirectory, `${slug}.${normalizedLang}.mdx`)
  if (fs.existsSync(filePath)) {
    return readMDXFile(filePath)
  }

  // Fallback: prova sempre la versione inglese
  const altFilePath = path.join(postsDirectory, `${slug}.en.mdx`)
  if (fs.existsSync(altFilePath)) {
    return readMDXFile(altFilePath)
  }

  return null
}

export function formatDate(date: string): string {
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  }
  return new Date(date).toLocaleDateString('en-US', options)
}