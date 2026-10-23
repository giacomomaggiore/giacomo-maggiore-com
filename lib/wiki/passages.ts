import { tokenize, type WikiNote } from './retrieve'

// Sends the model the relevant passages of each retrieved note instead of whole notes (much cheaper).

const CHUNK_SIZE = 1_500 // target characters per passage
export const CONTEXT_BUDGET = 30_000 // max note characters sent per question (~7.5k tokens)
const MAX_CHUNKS_PER_NOTE = 6
const RANK_PENALTY = 0.05 // notes ranked lower by retrieval score slightly less
const K1 = 1.5 // same term-frequency saturation as the BM25 note ranking

type Chunk = { text: string; termFreq: Map<string, number> }
export type ContextNote = { note: WikiNote; text: string }

// Cut text into ~CHUNK_SIZE pieces, preferably at the end of a sentence
function splitIntoChunks(text: string): string[] {
  const chunks: string[] = []
  let start = 0
  while (start < text.length) {
    let end = Math.min(start + CHUNK_SIZE, text.length)
    if (end < text.length) {
      const sentenceEnd = text.lastIndexOf('. ', end)
      const wordEnd = text.lastIndexOf(' ', end)
      if (sentenceEnd > start + CHUNK_SIZE * 0.7) end = sentenceEnd + 1
      else if (wordEnd > start) end = wordEnd
    }
    const chunk = text.slice(start, end).trim()
    if (chunk) chunks.push(chunk)
    start = end
  }
  return chunks
}

// Chunking a note is deterministic, so do it once per process
const chunkCache = new WeakMap<WikiNote, Chunk[]>()
function getChunks(note: WikiNote): Chunk[] {
  let chunks = chunkCache.get(note)
  if (!chunks) {
    chunks = splitIntoChunks(note.fullText).map((text) => {
      const termFreq = new Map<string, number>()
      for (const term of tokenize(text)) termFreq.set(term, (termFreq.get(term) ?? 0) + 1)
      return { text, termFreq }
    })
    chunkCache.set(note, chunks)
  }
  return chunks
}

// Picks passages from the retrieved notes (given in rank order) for the model to read.
// Every note keeps at least one passage so the cited sources match what the model saw.
export function selectContext(question: string, notes: WikiNote[], budget = CONTEXT_BUDGET): ContextNote[] {
  const queryTerms = [...new Set(tokenize(question))]
  const chunksByNote = notes.map(getChunks)

  // Rare query terms (across these notes' passages) weigh more, like BM25's idf
  const totalChunks = chunksByNote.reduce((sum, chunks) => sum + chunks.length, 0)
  const idf = new Map<string, number>()
  for (const term of queryTerms) {
    const withTerm = chunksByNote.reduce((sum, chunks) => sum + chunks.filter((c) => c.termFreq.has(term)).length, 0)
    idf.set(term, Math.log(1 + (totalChunks - withTerm + 0.5) / (withTerm + 0.5)))
  }

  const scored = chunksByNote.map((chunks, n) =>
    chunks.map((chunk, i) => {
      let score = 0
      for (const term of queryTerms) {
        const tf = chunk.termFreq.get(term) ?? 0
        if (tf) score += (idf.get(term) as number) * ((tf * (K1 + 1)) / (tf + K1))
      }
      return { n, i, score: score * (1 - RANK_PENALTY * n), size: chunk.text.length }
    }),
  )

  const selected = notes.map(() => new Set<number>())
  let used = 0
  const take = (n: number, i: number, size: number) => {
    selected[n].add(i)
    used += size
  }

  // 1) each note gets its best-matching passage, or its opening when nothing matches
  scored.forEach((chunks, n) => {
    if (!chunks.length) return
    const best = chunks.reduce((top, c) => (c.score > top.score ? c : top), chunks[0])
    take(n, best.i, best.size)
  })

  // 2) spend the remaining budget on the best-matching passages overall
  const rest = scored.flat().filter((c) => c.score > 0 && !selected[c.n].has(c.i))
  rest.sort((a, b) => b.score - a.score)
  for (const c of rest) {
    if (selected[c.n].size >= MAX_CHUNKS_PER_NOTE || used + c.size > budget) continue
    take(c.n, c.i, c.size)
  }

  // 3) rebuild each note's text in reading order, marking skipped parts with "…"
  return notes.flatMap((note, n) => {
    const indexes = [...selected[n]].sort((a, b) => a - b)
    if (!indexes.length) return []
    let text = ''
    indexes.forEach((chunkIndex, k) => {
      const skipsText = k === 0 ? chunkIndex > 0 : chunkIndex !== indexes[k - 1] + 1
      text += `${k > 0 ? ' ' : ''}${skipsText ? '… ' : ''}${chunksByNote[n][chunkIndex].text}`
    })
    return [{ note, text }]
  })
}
