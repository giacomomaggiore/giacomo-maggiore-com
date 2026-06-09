export type WikiNote = {
  slug: string
  collection: 'notes' | 'blog' | 'private'
  visibility: 'public' | 'private'
  title: string
  url: string | null
  fullText: string
  termFreq: Record<string, number>
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

export function tokenize(text: string): string[] {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter(t => t.length >= 3 && !STOPWORDS.has(t))
}

const K1 = 1.5
const B = 0.75

export function retrieve(query: string, index: WikiIndex, topK = 4): WikiNote[] {
  const qTerms = tokenize(query)
  if (qTerms.length === 0) return []

  const { notes, df, noteCount, avgNoteLen } = index
  const scores = notes.map(note => {
    const docLen = Object.values(note.termFreq).reduce((a, b) => a + b, 0)
    let score = 0
    for (const t of qTerms) {
      const tf = note.termFreq[t] ?? 0
      if (tf === 0) continue
      const docFreq = df[t] ?? 0
      const idf = Math.log((noteCount - docFreq + 0.5) / (docFreq + 0.5) + 1)
      const norm = (tf * (K1 + 1)) / (tf + K1 * (1 - B + B * docLen / avgNoteLen))
      score += idf * norm
    }
    return score
  })

  return scores
    .map((s, i) => ({ s, i }))
    .filter(({ s }) => s > 0)
    .sort((a, b) => b.s - a.s)
    .slice(0, topK)
    .map(({ i }) => notes[i])
}
