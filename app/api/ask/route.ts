import fs from 'fs'
import path from 'path'
import { NextResponse } from 'next/server'
import { getClientIp, rateLimit, tooManyRequests } from 'lib/rate-limit'
import { buildCitations, streamAnswer } from 'lib/wiki/llm'
import { embedQuery } from 'lib/wiki/openai'
import { selectContext, type ContextNote } from 'lib/wiki/passages'
import { retrieveHybrid, type WikiIndex } from 'lib/wiki/retrieve'

export const runtime = 'nodejs'
export const dynamic = 'force-dynamic'

const MAX_QUESTION_LEN = 500
const MAX_QUESTIONS_PER_MINUTE = 15

// Load the (large) index once per process, not on every request.
// The path is built inline next to the fs call so Vercel's file tracing bundles the index with this route.
let _index: WikiIndex | null = null
function getIndex(): WikiIndex {
  if (!_index) {
    const indexPath = path.join(process.cwd(), 'lib', 'wiki-index.generated.json')
    _index = JSON.parse(fs.readFileSync(indexPath, 'utf-8'))
  }
  return _index!
}

export async function POST(req: Request) {
  // Every question costs OpenAI tokens, so cap requests per client
  const limit = rateLimit(`ask:${getClientIp(req)}`, MAX_QUESTIONS_PER_MINUTE, 60_000)
  if (!limit.ok) return tooManyRequests(limit.retryAfterSec)

  const body = await req.json().catch(() => null)
  const question: unknown = body?.question

  if (typeof question !== 'string' || !question.trim()) {
    return NextResponse.json({ error: 'Missing question' }, { status: 400 })
  }
  if (question.length > MAX_QUESTION_LEN) {
    return NextResponse.json({ error: 'Question too long (max 500 chars)' }, { status: 400 })
  }

  let context: ContextNote[]
  try {
    // Start the embedding request first so it runs while the index loads
    const embeddingPromise = embedQuery(question)
    const index = getIndex()
    const notes = retrieveHybrid(question, await embeddingPromise, index)
    // Only the relevant passages of those notes go to the model
    context = selectContext(question, notes)
  } catch (err) {
    console.error('[ask] retrieval error:', err)
    return NextResponse.json({ error: 'Search is temporarily unavailable' }, { status: 500 })
  }
  const citations = buildCitations(context)

  const encoder = new TextEncoder()
  const abort = new AbortController()

  const stream = new ReadableStream({
    async start(controller) {
      // First line: citation metadata, parsed by the client before rendering text
      controller.enqueue(encoder.encode(JSON.stringify({ citations }) + '\n'))
      try {
        for await (const chunk of streamAnswer(question, context, abort.signal)) {
          controller.enqueue(encoder.encode(chunk))
        }
      } catch (err) {
        // The visitor left or pressed Stop: nobody is listening any more
        if (abort.signal.aborted) return
        console.error('[ask] streamAnswer error:', err)
        // Generic message: upstream error text can contain API key fragments
        controller.enqueue(encoder.encode('\n[Error generating answer. Please try again.]'))
      }
      if (!abort.signal.aborted) controller.close()
    },
    cancel() {
      abort.abort()
    },
  })

  return new Response(stream, {
    headers: { 'Content-Type': 'text/plain; charset=utf-8', 'Cache-Control': 'no-store' },
  })
}
