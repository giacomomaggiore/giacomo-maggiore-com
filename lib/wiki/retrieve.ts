export type WikiNote = {
  slug: string
  collection: 'notes' | 'blog' | 'private'
  visibility: 'public' | 'private'
  title: string
  url: string | null
  fullText: string
  termFreq: Record<string, number>
  embedding?: number[]
}

export type WikiIndex = {
  generatedAt: string
  noteCount: number
  avgNoteLen: number
  df: Record<string, number>
  notes: WikiNote[]
}

const STOPWORDS = new Set([
  // EN
  'the','and','for','are','but','not','you','all','can','had','her','was','one',
  'our','out','day','get','has','him','his','how','man','new','now','old','see',
  'two','way','who','did','its','let','put','say','she','too','use','with','that',
  'this','from','have','been','were','they','them','will','your','what','when',
  'which','there','their','would','could','should','about','into','than','then',
  'more','also','some','such','like','only','most','over','other','same','time',
  'very','just','even','well','back','come','give','know','make','take','want',
  'year','think','long','look','much','need','seem','tell','turn','work','after',
  'before','every','first','last','many','never','next','still','these','those',
  'through','until','where','while','again','does','each','here','high','keep',
  'left','life','made','may','might','must','off','own','part','right','since',
  'small','three','together','under','used','without','yet',
  // IT
  'del','dello','della','dei','degli','delle','con','per','tra','fra','che','chi',
  'cui','non','suo','sua','sui','suoi','sue','mio','mia','miei','mie','tuo','tua',
  'tuoi','tue','questo','questa','questi','queste','quello','quella','quelli','quelle',
  'sono','essere','avere','fare','venire','andare','vedere','sapere','potere','volere',
  'dovere','uno','una','due','tre','quando','dove','come','cosa','anche','piu','gia',
  'ancora','sempre','mai','poi','molto','poco','tutto','tutti','solo','cosi','perche',
  'pero','quindi','allora','mentre','dopo','prima','durante','senza',
])

// Strip common English suffixes so "economics"/"economic"/"economical" all map to the same root.
// Single-pass, longest-suffix-first. Conservative length guards prevent over-stemming short words.
function stem(w: string): string {
  if (w.length > 8 && w.endsWith('ization')) return w.slice(0, -7) // optimization → optim
  if (w.length > 8 && w.endsWith('ication')) return w.slice(0, -7) // diversification → divers
  if (w.length > 7 && w.endsWith('ational')) return w.slice(0, -7) // rational → ration? too short; guarded by length
  if (w.length > 7 && w.endsWith('ation'))   return w.slice(0, -5) // correlation → correlat
  if (w.length > 6 && w.endsWith('ical'))    return w.slice(0, -4) // mathematical → mathemat, statistical → statist
  if (w.length > 6 && w.endsWith('ment'))    return w.slice(0, -4) // investment → invest
  if (w.length > 6 && w.endsWith('ness'))    return w.slice(0, -4) // fairness → fair
  if (w.length > 5 && w.endsWith('ics'))     return w.slice(0, -3) // economics → econom, statistics → statist
  if (w.length > 5 && w.endsWith('ion'))     return w.slice(0, -3) // regression → regress, distribution → distribut
  if (w.length > 5 && w.endsWith('ing'))     return w.slice(0, -3) // investing → invest
  if (w.length > 5 && w.endsWith('ic'))      return w.slice(0, -2) // economic → econom
  if (w.length > 5 && w.endsWith('al'))      return w.slice(0, -2) // financial → financ
  if (w.length > 5 && w.endsWith('ed'))      return w.slice(0, -2) // leveraged → leverag
  if (w.length > 5 && w.endsWith('ly'))      return w.slice(0, -2) // efficiently → efficient
  if (w.length > 5 && w.endsWith('er'))      return w.slice(0, -2) // stronger → strong
  if (w.length > 4 && w.endsWith('s') && !w.endsWith('ss')) return w.slice(0, -1) // markets → market
  return w
}

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length >= 3 && !STOPWORDS.has(t))
    .map(stem)
}

// BM25 parameters
// K1 controls how much term frequency impacts scoring (if K1=0: score doesn't rise with repetitions)
// B adjusts document-length normalisation (large B penalises longer docs)
const K1 = 1.5
const B = 0.75

// BM25 is a ranking function used by search engines to estimate how relevant a document is to a query.
// It rewards documents that:
// - Contain the search terms multiple times,
// - Are of typical document length (not too short or too long).
// - Have those terms appear in less common contexts (across the whole corpus),
//
// BM25 is based on the idea that a term appearing in a document is more important
// if it appears less frequently across all documents (inverse document frequency)
// and if it appears more times in that document (term frequency), but with diminishing returns.
// It also considers the length of the document to avoid biasing towards longer
// documents that may contain more terms by chance.
// Returns a raw BM25 score for every note (index matches index.notes order).
// Scores are in [0, ∞); notes with no query-term overlap score 0.
function bm25Scores(qTerms: string[], index: WikiIndex): number[] {
  const { notes, df, noteCount, avgNoteLen } = index
  return notes.map(note => {
    const docLen = Object.values(note.termFreq).reduce((a, b) => a + b, 0)
    const titleTokens = new Set(tokenize(note.title))
    let score = 0
    for (const t of qTerms) {
      const tf = note.termFreq[t] ?? 0
      if (tf === 0) continue
      const docFreq = df[t] ?? 0
      const idf = Math.log((noteCount - docFreq + 0.5) / (docFreq + 0.5) + 1)
      const norm = (tf * (K1 + 1)) / (tf + K1 * (1 - B + B * docLen / avgNoteLen))
      const titleBoost = titleTokens.has(t) ? 2.0 : 1.0
      score += idf * norm * titleBoost
    }
    return score
  })
}

export function retrieve(query: string, index: WikiIndex, topK = 8): WikiNote[] {
  const qTerms = tokenize(query)
  if (qTerms.length === 0) return []
  const scores = bm25Scores(qTerms, index)
  return scores
    .map((s, i) => ({ s, i }))
    .filter(({ s }) => s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, topK)
    .map(({ i }) => index.notes[i])
}

// Dot product == cosine similarity when both vectors are unit-normalised,
// which OpenAI's text-embedding-3-small guarantees.
function cosineSim(a: number[], b: number[]): number {
  let dot = 0
  for (let i = 0; i < a.length; i++) dot += a[i] * b[i]
  return dot
}

// Hybrid retrieval: BM25 + embedding cosine similarity fused with
// Reciprocal Rank Fusion (RRF, k=60).  Falls back to pure BM25 when
// queryEmbedding is null (e.g. OPENAI_API_KEY not set).
export function retrieveHybrid(
  query: string,
  queryEmbedding: number[] | null,
  index: WikiIndex,
  topK = 8,
): WikiNote[] {
  const K_RRF = 60

  // --- BM25 ranks (all notes, zeros sort to the bottom) ---
  const qTerms = tokenize(query)
  const bm25 = bm25Scores(qTerms.length ? qTerms : [], index)
  const bm25Rank = new Map(
    bm25
      .map((s, i) => ({ s, i }))
      .sort((a, b) => b.s - a.s)
      .map(({ i }, rank) => [i, rank]),
  )

  // --- Embedding ranks (skipped when no embedding available) ---
  const embRank = new Map<number, number>()
  if (queryEmbedding) {
    index.notes
      .map((note, i) => ({
        i,
        score: note.embedding ? cosineSim(queryEmbedding, note.embedding) : -2,
      }))
      .sort((a, b) => b.score - a.score)
      .forEach(({ i }, rank) => embRank.set(i, rank))
  }

  // --- RRF fusion ---
  return index.notes
    .map((note, i) => {
      const rBM25 = bm25Rank.get(i) ?? index.noteCount
      const rEmb  = embRank.get(i)  ?? index.noteCount
      const score =
        1 / (K_RRF + rBM25) +
        (queryEmbedding ? 1 / (K_RRF + rEmb) : 0)
      return { note, score }
    })
    .sort((a, b) => b.score - a.score)
    .slice(0, topK)
    .map(({ note }) => note)
}
