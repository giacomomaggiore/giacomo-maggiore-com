import fs from 'fs'
import path from 'path'
import { parseFrontmatter } from 'lib/wiki/frontmatter'
import {
  WIKI_PUBLIC_NOTES_DIR,
  WIKI_PUBLIC_BLOG_DIR,
  WIKI_PRIVATE_DIR,
} from 'lib/wiki/paths'
import { tokenize, WikiNote, WikiIndex } from 'lib/wiki/retrieve'

const OUTPUT_PATH = path.join(process.cwd(), 'lib', 'wiki-index.generated.json')
const MAX_FULL_TEXT = 50_000
// OpenAI recommends staying well under the 8192-token limit per input
const MAX_EMBED_CHARS = 20_000

function cleanText(raw: string): string {
  return raw
    .replace(/^---[\s\S]*?---\s*/m, '')   // strip frontmatter
    .replace(/<[^>]+>/g, ' ')              // strip JSX/HTML tags
    .replace(/^#{1,6}\s+/gm, '')           // strip heading markers
    .replace(/\[([^\]]+)\]\([^)]+\)/g, '$1') // collapse markdown links
    .replace(/\[\[([^\]]+)\]\]/g, '$1')    // collapse wikilinks
    .replace(/\s+/g, ' ')
    .trim()
}

function buildNote(
  filePath: string,
  collection: WikiNote['collection'],
  visibility: WikiNote['visibility'],
  slug: string,
  url: string | null,
): WikiNote {
  const raw = fs.readFileSync(filePath, 'utf-8')
  let title = slug
  let content = raw
  try {
    const parsed = parseFrontmatter(raw)
    title = parsed.metadata.title || slug
    content = parsed.content
  } catch {
    // file has no frontmatter — cleanText will strip any stray --- blocks
  }
  const fullText = cleanText(content).slice(0, MAX_FULL_TEXT)
  const tokens = tokenize(fullText)
  const termFreq: Record<string, number> = {}
  for (const t of tokens) termFreq[t] = (termFreq[t] ?? 0) + 1
  return { slug, collection, visibility, title, url, fullText, termFreq }
}

function collectNotes(): WikiNote[] {
  return fs
    .readdirSync(WIKI_PUBLIC_NOTES_DIR)
    .filter(f => f.endsWith('.mdx'))
    .map(f => {
      const slug = path.basename(f, '.mdx')
      return buildNote(path.join(WIKI_PUBLIC_NOTES_DIR, f), 'notes', 'public', slug, `/notes/${slug}`)
    })
}

function collectBlog(): WikiNote[] {
  return fs
    .readdirSync(WIKI_PUBLIC_BLOG_DIR)
    .filter(f => f.endsWith('.en.mdx'))
    .map(f => {
      const slug = path.basename(f, '.en.mdx')
      return buildNote(path.join(WIKI_PUBLIC_BLOG_DIR, f), 'blog', 'public', slug, `/blog/${slug}`)
    })
}

const SKIP_STEMS = new Set(['index', 'log', '_lint-report'])

function walkPrivate(dir: string, base: string): WikiNote[] {
  const notes: WikiNote[] = []
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name)
    if (entry.isDirectory()) {
      if (entry.name === 'images') continue
      notes.push(...walkPrivate(full, base))
    } else if (entry.name.endsWith('.md') || entry.name.endsWith('.mdx')) {
      const ext = entry.name.endsWith('.mdx') ? '.mdx' : '.md'
      const stem = path.basename(entry.name, ext)
      if (stem.startsWith('_') || SKIP_STEMS.has(stem)) continue
      const rel = path.relative(base, dir)
      const slug = rel ? `${rel}/${stem}` : stem
      notes.push(buildNote(full, 'private', 'private', slug, null))
    }
  }
  return notes
}

function collectPrivate(): WikiNote[] {
  return walkPrivate(WIKI_PRIVATE_DIR, WIKI_PRIVATE_DIR)
}

// Batch-embed all notes in a single OpenAI request (supports up to 2048 inputs).
// Attaches the embedding array directly onto each WikiNote in-place.
// Silently skips if OPENAI_API_KEY is not set — retrieve() falls back to BM25-only.
async function embedNotes(notes: WikiNote[]): Promise<void> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) {
    console.log('  OPENAI_API_KEY not set — skipping embeddings (BM25-only mode)')
    return
  }

  const { default: OpenAI } = await import('openai')
  const client = new OpenAI({ apiKey })

  const inputs = notes.map(n => n.fullText.slice(0, MAX_EMBED_CHARS))

  const res = await client.embeddings.create({
    model: 'text-embedding-3-small',
    input: inputs,
  })

  for (const { index, embedding } of res.data) {
    notes[index].embedding = embedding
  }

  console.log(`  embedded ${notes.length} notes (text-embedding-3-small)`)
}

async function main() {
  const notesNotes = collectNotes()
  const blogNotes = collectBlog()
  const privateNotes = collectPrivate()
  const notes = [...notesNotes, ...blogNotes, ...privateNotes]

  await embedNotes(notes)

  const df: Record<string, number> = {}
  for (const note of notes) {
    for (const t of Object.keys(note.termFreq)) {
      df[t] = (df[t] ?? 0) + 1
    }
  }

  const totalTokens = notes.reduce(
    (acc, n) => acc + Object.values(n.termFreq).reduce((a, b) => a + b, 0),
    0,
  )
  const avgNoteLen = notes.length > 0 ? totalTokens / notes.length : 1

  const index: WikiIndex = {
    generatedAt: new Date().toISOString(),
    noteCount: notes.length,
    avgNoteLen,
    df,
    notes,
  }

  fs.writeFileSync(OUTPUT_PATH, JSON.stringify(index))
  console.log(
    `wiki index: ${notes.length} notes` +
    ` (${notesNotes.length} notes, ${blogNotes.length} blog, ${privateNotes.length} private)` +
    ` → lib/wiki-index.generated.json`,
  )
}

main().catch(err => { console.error(err); process.exit(1) })
