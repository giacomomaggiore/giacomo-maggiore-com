import fs from 'fs'
import path from 'path'

export type Lang = 'it' | 'en'

type Metadata = {
  title: string
  publishedAt: string
  summary: string
  image?: string
}

function parseFrontmatter(fileContent: string) {
  let frontmatterRegex = /---\s*([\s\S]*?)\s*---/
  let match = frontmatterRegex.exec(fileContent)
  let frontMatterBlock = match![1]
  let content = fileContent.replace(frontmatterRegex, '').trim()
  let frontMatterLines = frontMatterBlock.trim().split('\n')
  let metadata: Partial<Metadata> = {}

  frontMatterLines.forEach((line) => {
    let [key, ...valueArr] = line.split(': ')
    let value = valueArr.join(': ').trim()
    value = value.replace(/^['"](.*)['"]$/, '$1')
    metadata[key.trim() as keyof Metadata] = value
  })

  return { metadata: metadata as Metadata, content }
}

function getMDXFiles(dir: string) {
  return fs.readdirSync(dir).filter((file) => path.extname(file) === '.mdx')
}

function readMDXFile(filePath: string) {
  let rawContent = fs.readFileSync(filePath, 'utf-8')
  return parseFrontmatter(rawContent)
}

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
  return getMDXData(path.join(process.cwd(), 'app', 'blog', 'posts'))
}

export function getAllSlugs(): string[] {
  const postsDirectory = path.join(process.cwd(), 'app', 'blog', 'posts')
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
  const postsDirectory = path.join(process.cwd(), 'app', 'blog', 'posts')

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