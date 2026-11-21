import { NextResponse } from 'next/server'
import { isPublicPageKey } from 'lib/comments/pages'
import { insertComment, InvalidParentError, readComments } from 'lib/comments/store'
import { bodyError, isUuid, nameError, normalizeName } from 'lib/comments/validation'
import { getClientIp, rateLimit, tooManyRequests } from 'lib/rate-limit'

export const dynamic = 'force-dynamic'
const MAX_BYTES = 16_384
const unavailable = () => NextResponse.json({ error: 'Comments are temporarily unavailable.' }, { status: 503, headers: { 'Cache-Control': 'no-store' } })
const invalid = (error = 'Invalid request.') => NextResponse.json({ error }, { status: 400, headers: { 'Cache-Control': 'no-store' } })

async function readBody(req: Request): Promise<string | null> {
  if (Number(req.headers.get('content-length')) > MAX_BYTES || !req.body) return null
  const reader = req.body.getReader()
  const chunks: Uint8Array[] = []
  let size = 0
  while (true) {
    const { value, done } = await reader.read()
    if (done) break
    size += value.byteLength
    if (size > MAX_BYTES) { await reader.cancel(); return null }
    chunks.push(value)
  }
  const bytes = new Uint8Array(size)
  let offset = 0
  for (const chunk of chunks) { bytes.set(chunk, offset); offset += chunk.byteLength }
  return new TextDecoder().decode(bytes)
}

export async function GET(req: Request) {
  const params = new URL(req.url).searchParams
  const pageKey = params.get('pageKey') || ''
  const parentId = params.get('parentId')
  const cursor = params.get('cursor')
  if (!isPublicPageKey(pageKey) || (parentId !== null && !isUuid(parentId)) || (cursor !== null && !isUuid(cursor))) return invalid()
  try {
    const result = await readComments(pageKey, parentId, cursor)
    return NextResponse.json(result, { headers: { 'Cache-Control': 'no-store' } })
  } catch (error) {
    if (error instanceof InvalidParentError) return invalid('Invalid reply parent.')
    console.error('Comments read failed')
    return unavailable()
  }
}

export async function POST(req: Request) {
  if (req.headers.get('origin') !== new URL(req.url).origin || req.headers.get('sec-fetch-site') === 'cross-site') return invalid()
  const limit = rateLimit(`comments:${getClientIp(req)}`, 10, 10 * 60_000)
  if (!limit.ok) return tooManyRequests(limit.retryAfterSec)
  let data: unknown
  try {
    const body = await readBody(req)
    if (body === null) return invalid()
    data = JSON.parse(body)
  } catch {
    return invalid()
  }
  if (!data || typeof data !== 'object' || Array.isArray(data)) return invalid()
  const input = data as Record<string, unknown>
  if (Object.keys(input).some(key => !['pageKey', 'parentId', 'displayName', 'body', 'website'].includes(key))) return invalid()
  if (typeof input.pageKey !== 'string' || !isPublicPageKey(input.pageKey) || typeof input.displayName !== 'string' || typeof input.body !== 'string' || (input.website !== undefined && typeof input.website !== 'string') || (input.parentId !== undefined && input.parentId !== null && (typeof input.parentId !== 'string' || !isUuid(input.parentId)))) return invalid()
  if (input.website) return invalid()
  const error = bodyError(input.body) || nameError(input.displayName)
  if (error) return invalid(error)
  try {
    const comment = await insertComment({ pageKey: input.pageKey, parentId: (input.parentId as string | null | undefined) || null, displayName: normalizeName(input.displayName), body: input.body.trim() })
    if (!comment) return invalid('This reply is no longer available.')
    return NextResponse.json(comment, { status: 201, headers: { 'Cache-Control': 'no-store' } })
  } catch {
    console.error('Comments write failed')
    return unavailable()
  }
}
