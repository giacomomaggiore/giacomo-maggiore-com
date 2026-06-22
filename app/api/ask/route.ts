import fs from 'fs'
import path from 'path'
import { NextResponse } from 'next/server'
import { retrieveHybrid, type WikiIndex } from 'lib/wiki/retrieve'
import { streamAnswer, buildCitations } from 'lib/wiki/llm'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_QUESTION_LEN = 500

// Lazy-load the index once per process —
//  it's large and reading it on every request is wasteful
let _index: WikiIndex | null = null
function getIndex(): WikiIndex {
  if (!_index) {
    const p = path.join(process.cwd(), 'lib', 'wiki-index.generated.json')
    _index = JSON.parse(fs.readFileSync(p, 'utf-8'))
  }
  return _index!
}

// Embed the user's question using the same model used at index build time.
// Returns null if OPENAI_API_KEY is not set — retrieve falls back to BM25-only.
async function embedQuery(question: string): Promise<number[] | null> {
  const apiKey = process.env.OPENAI_API_KEY
  if (!apiKey) return null
  try {
    const { default: OpenAI } = await import('openai')
    const client = new OpenAI({ apiKey })
    const res = await client.embeddings.create({
      model: 'text-embedding-3-small',
      input: question,
    })
    return res.data[0].embedding
  } catch {
    return null
  }
}

export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  const question: unknown = body?.question

  if (typeof question !== 'string' || !question.trim()) {
    return NextResponse.json({ error: 'Missing question' }, { status: 400 })
  }
  if (question.length > MAX_QUESTION_LEN) {
    return NextResponse.json({ error: 'Question too long (max 500 chars)' }, { status: 400 })
  }

  const [queryEmbedding, index] = await Promise.all([
    embedQuery(question),
    Promise.resolve(getIndex()),
  ])
  const notes = retrieveHybrid(question, queryEmbedding, index)
  const citations = buildCitations(notes)

  const encoder = new TextEncoder()

  const stream = new ReadableStream({
    async start(controller) {
      // First line: citation metadata, parsed by the client before rendering text
      controller.enqueue(encoder.encode(JSON.stringify({ citations }) + '\n'))
      try {
        for await (const chunk of streamAnswer(question, notes)) {
          controller.enqueue(encoder.encode(chunk))
        }
      } catch {
        controller.enqueue(encoder.encode('\n[Error generating answer — check your API key and LLM_PROVIDER]'))
      } finally {
        controller.close()
      }
    },
  })

  return new Response(stream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8' },
  })
}
