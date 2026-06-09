import fs from 'fs'
import path from 'path'
import { NextResponse } from 'next/server'
import { retrieve, type WikiIndex } from 'lib/wiki/retrieve'
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

export async function POST(req: Request) {
  const body = await req.json().catch(() => null)
  const question: unknown = body?.question

  if (typeof question !== 'string' || !question.trim()) {
    return NextResponse.json({ error: 'Missing question' }, { status: 400 })
  }
  if (question.length > MAX_QUESTION_LEN) {
    return NextResponse.json({ error: 'Question too long (max 500 chars)' }, { status: 400 })
  }

  const notes = retrieve(question, getIndex())
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
