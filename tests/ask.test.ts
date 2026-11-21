import assert from 'node:assert/strict'
import { createServer } from 'node:http'
import type { AddressInfo } from 'node:net'
import { once } from 'node:events'
import { test } from 'node:test'
import { retrieveHybrid, type WikiIndex } from '../lib/wiki/retrieve'

test('retrieval does not log private note titles in development', () => {
  const index: WikiIndex = {
    generatedAt: '', noteCount: 1, avgNoteLen: 1, df: { example: 1 },
    notes: [{
      slug: 'private', collection: 'private', visibility: 'private', title: 'Private test title',
      url: null, fullText: 'example', termFreq: { example: 1 }, embedding: [1],
    }],
  }
  const originalLog = console.log
  const logs: unknown[][] = []
  console.log = (...args) => { logs.push(args) }
  try {
    assert.equal(retrieveHybrid('example', [1], index)[0].title, 'Private test title')
    assert.equal(logs.length, 0)
  } finally {
    console.log = originalLog
  }
})

test('ask API validates requests and streams answers with a local OpenAI mock', async (t) => {
  let chatRequest: { model: string; messages: { role: string; content: string }[] } | undefined
  let mode: 'answer' | 'empty' | 'embedding-error' | 'chat-error' = 'answer'
  const server = createServer(async (req, res) => {
    const chunks: Buffer[] = []
    for await (const chunk of req) chunks.push(Buffer.from(chunk))
    const body = JSON.parse(Buffer.concat(chunks).toString())

    if (req.url === '/v1/embeddings') {
      if (mode === 'embedding-error') {
        res.writeHead(500, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: { message: 'Mock embedding failure' } }))
      } else {
        res.writeHead(200, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ data: [{ embedding: Array(1536).fill(0) }] }))
      }
      return
    }
    if (req.url === '/v1/chat/completions') {
      chatRequest = body
      if (mode === 'chat-error') {
        res.writeHead(500, { 'Content-Type': 'application/json' })
        res.end(JSON.stringify({ error: { message: 'Mock private upstream details' } }))
      } else {
        res.writeHead(200, { 'Content-Type': 'text/event-stream' })
        if (mode !== 'empty') {
          res.write(`data: ${JSON.stringify({ choices: [{ delta: { content: 'Mock answer.' } }] })}\n\n`)
        }
        res.end('data: [DONE]\n\n')
      }
      return
    }
    res.writeHead(404).end()
  })
  server.listen(0, '127.0.0.1')
  await once(server, 'listening')

  const previous = {
    OPENAI_API_KEY: process.env.OPENAI_API_KEY,
    OPENAI_BASE_URL: process.env.OPENAI_BASE_URL,
    LLM_MODEL: process.env.LLM_MODEL,
  }
  process.env.OPENAI_API_KEY = 'local-mock-key'
  process.env.OPENAI_BASE_URL = `http://127.0.0.1:${(server.address() as AddressInfo).port}/v1`
  process.env.LLM_MODEL = 'gpt-6-luna'

  try {
    const { POST } = await import('../app/api/ask/route')
    const request = (body: string, ip = 'test-client') => new Request('http://localhost/api/ask', {
      method: 'POST', headers: { 'Content-Type': 'application/json', 'x-forwarded-for': ip }, body,
    })

    await t.test('rejects malformed, missing and oversized questions', async () => {
      for (const body of ['{', '{}', JSON.stringify({ question: ' ' }), JSON.stringify({ question: 'a'.repeat(501) })]) {
        assert.equal((await POST(request(body))).status, 400)
      }
    })

    await t.test('streams the answer, matching source metadata and the configured model', async () => {
      const question = 'Explain investment risk.'
      const res = await POST(request(JSON.stringify({ question })))
      assert.equal(res.status, 200)
      assert.equal(res.headers.get('cache-control'), 'no-store')
      const [metadata, answer] = (await res.text()).split('\n', 2)
      const citations: { title: string; url: string | null }[] = JSON.parse(metadata).citations
      assert.equal(answer, 'Mock answer.')
      assert.ok(citations.length > 0 && citations.length <= 8)
      assert.equal(chatRequest?.model, 'gpt-6-luna')
      const prompt = chatRequest?.messages.find((message) => message.role === 'system')?.content ?? ''
      const context = chatRequest?.messages.find((message) => message.role === 'user')?.content ?? ''
      assert.ok(prompt.includes('Economics, Management & Technology'))
      assert.ok(prompt.includes('previously worked as a research assistant at KOF'))
      assert.ok(prompt.includes('do not guess') && prompt.includes('dry, lightly ironic'))
      assert.ok(context.endsWith(`Question: ${question}`))
      assert.ok(citations.every(({ title, url }) => context.includes(`## ${title}\n`) && (url === null || /^\/(notes|blog)\//.test(url))))
    })

    await t.test('falls back to keyword retrieval if embeddings fail', async () => {
      mode = 'embedding-error'
      const res = await POST(request(JSON.stringify({ question: 'investment risk' })))
      assert.ok((await res.text()).endsWith('Mock answer.'))
    })

    await t.test('reports an empty or failed model stream without leaking upstream details', async () => {
      for (const nextMode of ['empty', 'chat-error'] as const) {
        mode = nextMode
        const res = await POST(request(JSON.stringify({ question: 'investment risk' })))
        const text = await res.text()
        assert.ok(text.endsWith('[Error generating answer. Please try again.]'))
        assert.ok(!text.includes('Mock private upstream details'))
      }
    })

    await t.test('rate limits after 15 requests from the same client', async () => {
      for (let i = 0; i < 15; i++) assert.equal((await POST(request('{}', 'limited-client'))).status, 400)
      const res = await POST(request('{}', 'limited-client'))
      assert.equal(res.status, 429)
      assert.ok(Number(res.headers.get('retry-after')) > 0)
    })
  } finally {
    for (const [key, value] of Object.entries(previous)) {
      if (value === undefined) delete process.env[key]
      else process.env[key] = value
    }
    server.close()
    await once(server, 'close')
  }
})
