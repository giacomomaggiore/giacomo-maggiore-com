import assert from 'node:assert/strict'
import { readFile } from 'node:fs/promises'
import { test } from 'node:test'
import { PGlite } from '@electric-sql/pglite'
import { neonConfig } from '@neondatabase/serverless'
import { getAllSlugs } from '../app/blog/utils'
import { getNotes } from '../app/notes/utils'
import { bodyError, characterCount, nameError, normalizeName } from '../lib/comments/validation'
import { isPublicPageKey } from '../lib/comments/pages'

test('comment normalization and character limits', () => {
  assert.equal(normalizeName('  ＡLICE  '), 'alice')
  for (const name of ['Giacomo', 'g maggiore', 'gi.a-co_mo', 'Ｇｉａｃｏｍｏ', 'jack maggiore', 'gmag']) assert.ok(nameError(name), name)
  assert.equal(nameError('Alice'), null)
  assert.ok(nameError(''))
  assert.ok(nameError('x'.repeat(21)))
  assert.equal(characterCount('😀'), 1)
  assert.equal(bodyError('😀'.repeat(2000)), null)
  assert.ok(bodyError('😀'.repeat(2001)))
  assert.ok(bodyError(' \n '))
})

test('only canonical public article keys are accepted', () => {
  assert.equal(isPublicPageKey(`/blog/${getAllSlugs()[0]}`), true)
  assert.equal(isPublicPageKey(`/notes/${getNotes()[0].slug}`), true)
  for (const key of ['/blog/none', '/blog/99-draft', '/notes/none', '/private/foo', '/blog/../private', `/blog/${getAllSlugs()[0]}.en`, '/blog', '/notes/foo?bar']) assert.equal(isPublicPageKey(key), false, key)
})

test('API and migration work against isolated PostgreSQL', async () => {
  const db = new PGlite()
  await db.exec(await readFile('migrations/001_comments.sql', 'utf8'))
  const previousUrl = process.env.DATABASE_URL
  const previousFetch = neonConfig.fetchFunction
  process.env.DATABASE_URL = 'postgresql://test:test@local.invalid/test'
  neonConfig.fetchFunction = async (_url: string, init: RequestInit) => {
    const { query, params } = JSON.parse(String(init.body))
    try {
      const result = await db.query<unknown[]>(query, params, { rowMode: 'array' })
      return Response.json({ fields: result.fields, rows: result.rows.map(row => row.map(value => value === null ? null : value instanceof Date ? value.toISOString() : String(value))) })
    } catch (error) {
      return Response.json({ message: error instanceof Error ? error.message : 'database error' }, { status: 400 })
    }
  }
  const { GET, POST } = await import('../app/api/comments/route')
  const pageKey = `/blog/${getAllSlugs()[0]}`
  const otherKey = `/notes/${getNotes()[0].slug}`
  const post = (value: object, ip = 'test') => POST(new Request('http://localhost/api/comments', { method: 'POST', headers: { origin: 'http://localhost', 'x-forwarded-for': ip, 'content-type': 'application/json' }, body: JSON.stringify(value) }))
  const get = (params: Record<string, string>) => GET(new Request(`http://localhost/api/comments?${new URLSearchParams(params)}`))
  try {
    assert.equal((await post({ pageKey, displayName: 'gi.a-co_mo', body: 'hello' })).status, 400)
    assert.equal((await post({ pageKey, displayName: 'alice', body: ' ' })).status, 400)
    assert.equal((await post({ pageKey, displayName: 'alice', body: 'hello', website: 'spam' })).status, 400)
    assert.equal((await post({ pageKey: '/blog/nonexistent', displayName: 'alice', body: 'hello' })).status, 400)
    assert.equal((await POST(new Request('http://localhost/api/comments', { method: 'POST', headers: { origin: 'https://elsewhere.test' }, body: '{}' }))).status, 400)
    assert.equal((await post({ pageKey, displayName: 'alice', body: 'a'.repeat(17_000) })).status, 400)
    const first = await post({ pageKey, displayName: ' Alice ', body: '  Hello\nhttps://example.com <b>literal</b>  ' })
    assert.equal(first.status, 201)
    const parent = await first.json()
    assert.equal(parent.displayName, 'alice')
    assert.equal(parent.body, 'Hello\nhttps://example.com <b>literal</b>')
    await assert.rejects(db.query('INSERT INTO comments (page_key, display_name, body) VALUES ($1, $2, $3)', [pageKey, 'alice', '\t\n\u00a0']))
    const reply = await post({ pageKey, parentId: parent.id, displayName: 'bob', body: 'reply' })
    assert.equal(reply.status, 201)
    const child = await reply.json()
    assert.equal((await post({ pageKey, parentId: child.id, displayName: 'bob', body: 'nested' })).status, 400)
    assert.equal((await post({ pageKey: otherKey, parentId: parent.id, displayName: 'bob', body: 'wrong page' })).status, 400)
    assert.equal((await get({ pageKey, parentId: child.id })).status, 400)
    assert.equal((await get({ pageKey: otherKey, parentId: parent.id })).status, 400)
    await assert.rejects(db.query('INSERT INTO comments (page_key, parent_id, display_name, body) VALUES ($1, $2, $3, $4)', [otherKey, parent.id, 'bob', 'wrong page']))
    await assert.rejects(db.query('UPDATE comments SET created_at = now() WHERE id = $1', [parent.id]))
    await db.query('UPDATE comments SET deleted_at = now(), display_name = NULL, body = NULL WHERE id = $1', [parent.id])
    assert.equal((await post({ pageKey, parentId: parent.id, displayName: 'bob', body: 'after deletion' }, 'other')).status, 201)
    const thread = await (await get({ pageKey })).json()
    assert.equal(thread.comments[0].displayName, null)
    assert.equal(thread.comments[0].body, null)
    assert.equal(thread.replies[parent.id].comments.length, 2)
    assert.equal(JSON.stringify(thread).includes('Hello'), false)
    for (let i = 0; i < 12; i++) await db.query('INSERT INTO comments (page_key, parent_id, display_name, body, created_at) VALUES ($1, $2, $3, $4, $5)', [pageKey, parent.id, 'bob', `reply ${i}`, '2028-01-01T00:00:00Z'])
    const replyPage = await (await get({ pageKey, parentId: parent.id })).json()
    assert.equal(replyPage.comments.length, 10)
    assert.ok(replyPage.nextCursor)
    const remainingReplies = await (await get({ pageKey, parentId: parent.id, cursor: replyPage.nextCursor })).json()
    assert.equal(new Set([...replyPage.comments, ...remainingReplies.comments].map((comment: { id: string }) => comment.id)).size, 14)
    for (let i = 0; i < 12; i++) await db.query('INSERT INTO comments (page_key, display_name, body, created_at) VALUES ($1, $2, $3, $4)', [pageKey, 'bob', `item ${i}`, '2028-01-01T00:00:00Z'])
    const firstPage = await (await get({ pageKey })).json()
    assert.equal(firstPage.comments.length, 10)
    assert.ok(firstPage.nextCursor)
    const secondPage = await (await get({ pageKey, cursor: firstPage.nextCursor })).json()
    const ids = [...firstPage.comments, ...secondPage.comments].map((comment: { id: string }) => comment.id)
    assert.equal(new Set(ids).size, 13)
    const sameTimestamp = [...firstPage.comments, ...secondPage.comments].filter((comment: { body: string | null }) => comment.body?.startsWith('item ')).map((comment: { id: string }) => comment.id)
    assert.deepEqual(sameTimestamp, [...sameTimestamp].sort().reverse())
    for (let i = 0; i < 10; i++) assert.notEqual((await post({ pageKey, displayName: 'alice', body: 'hello' }, 'rate-test')).status, 429)
    assert.equal((await post({ pageKey, displayName: 'alice', body: 'hello' }, 'rate-test')).status, 429)
    await db.exec('CREATE ROLE comment_runtime; GRANT SELECT, INSERT ON comments TO comment_runtime; SET ROLE comment_runtime')
    await db.query('INSERT INTO comments (page_key, parent_id, display_name, body) VALUES ($1, $2, $3, $4)', [pageKey, parent.id, 'runtime', 'allowed'])
    await assert.rejects(db.query('UPDATE comments SET deleted_at = now(), display_name = NULL, body = NULL WHERE id = $1', [child.id]))
    await db.exec('RESET ROLE')
    delete process.env.DATABASE_URL
    assert.equal((await get({ pageKey })).status, 503)
  } finally {
    if (previousUrl === undefined) delete process.env.DATABASE_URL
    else process.env.DATABASE_URL = previousUrl
    neonConfig.fetchFunction = previousFetch
    await db.close()
  }
})
