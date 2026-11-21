import { neon } from '@neondatabase/serverless'

export type Comment = {
  id: string
  pageKey: string
  parentId: string | null
  displayName: string | null
  body: string | null
  createdAt: string
  deletedAt: string | null
}

export type CommentPage = { comments: Comment[]; nextCursor: string | null }
export type ThreadPage = CommentPage & { replies: Record<string, CommentPage> }
type CommentRow = {
  id: string; page_key: string; parent_id: string | null; display_name: string | null
  body: string | null; created_at: string; deleted_at: Date | string | null
}
const PAGE_SIZE = 10
export class InvalidParentError extends Error {}

function database() {
  if (!process.env.DATABASE_URL) throw new Error('Database not configured')
  return neon(process.env.DATABASE_URL)
}

function commentRow(row: Record<string, unknown>): CommentRow {
  const { id, page_key, parent_id, display_name, body, created_at, deleted_at } = row
  if (typeof id !== 'string' || typeof page_key !== 'string' || (parent_id !== null && typeof parent_id !== 'string') ||
      (display_name !== null && typeof display_name !== 'string') || (body !== null && typeof body !== 'string') ||
      typeof created_at !== 'string' || (deleted_at !== null && !(deleted_at instanceof Date) && typeof deleted_at !== 'string')) {
    throw new Error('Invalid comment record')
  }
  return { id, page_key, parent_id, display_name, body, created_at, deleted_at }
}

function publicComment(row: CommentRow): Comment {
  return {
    id: row.id, pageKey: row.page_key, parentId: row.parent_id,
    displayName: row.deleted_at ? null : row.display_name,
    body: row.deleted_at ? null : row.body,
    createdAt: row.created_at, deletedAt: row.deleted_at instanceof Date ? row.deleted_at.toISOString() : row.deleted_at,
  }
}

function page(rows: CommentRow[]): CommentPage {
  const comments = rows.slice(0, PAGE_SIZE).map(publicComment)
  return { comments, nextCursor: rows.length > PAGE_SIZE ? comments[comments.length - 1].id : null }
}

export async function readComments(pageKey: string, parentId: string | null, cursor: string | null): Promise<ThreadPage> {
  const sql = database()
  if (parentId) {
    const parent = await sql`SELECT id FROM comments WHERE id = ${parentId}::uuid AND page_key = ${pageKey} AND parent_id IS NULL`
    if (!parent.length) throw new InvalidParentError()
  }
  // Cursor rows are immutable, including after moderation.
  const rows = parentId
    ? await sql`SELECT *, to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS created_at FROM comments WHERE page_key = ${pageKey} AND parent_id = ${parentId}::uuid
        AND (${cursor}::uuid IS NULL OR (created_at, id) > (SELECT created_at, id FROM comments WHERE id = ${cursor}::uuid AND page_key = ${pageKey} AND parent_id = ${parentId}::uuid))
        ORDER BY comments.created_at ASC, comments.id ASC LIMIT ${PAGE_SIZE + 1}`
    : await sql`SELECT *, to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS created_at FROM comments WHERE page_key = ${pageKey} AND parent_id IS NULL
        AND (${cursor}::uuid IS NULL OR (created_at, id) < (SELECT created_at, id FROM comments WHERE id = ${cursor}::uuid AND page_key = ${pageKey} AND parent_id IS NULL))
        ORDER BY comments.created_at DESC, comments.id DESC LIMIT ${PAGE_SIZE + 1}`
  const result = page(rows.map(commentRow))
  const replies: Record<string, CommentPage> = {}
  if (!parentId && result.comments.length) {
    const ids = result.comments.map(comment => comment.id)
    const replyRows = await sql`SELECT r.*, to_char(r.created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS created_at FROM unnest(${ids}::uuid[]) AS p(id)
      CROSS JOIN LATERAL (SELECT * FROM comments WHERE page_key = ${pageKey} AND parent_id = p.id
        ORDER BY created_at ASC, id ASC LIMIT ${PAGE_SIZE + 1}) r`
    const parsedReplies = replyRows.map(commentRow)
    for (const id of ids) replies[id] = page(parsedReplies.filter(row => row.parent_id === id))
  }
  return { ...result, replies }
}

export async function insertComment(input: { pageKey: string; parentId: string | null; displayName: string; body: string }): Promise<Comment | null> {
  const sql = database()
  const rows = await sql`INSERT INTO comments (page_key, parent_id, display_name, body)
    SELECT ${input.pageKey}, ${input.parentId}::uuid, ${input.displayName}, ${input.body}
    WHERE ${input.parentId}::uuid IS NULL OR EXISTS (
      SELECT 1 FROM comments WHERE id = ${input.parentId}::uuid AND page_key = ${input.pageKey} AND parent_id IS NULL
    ) RETURNING *, to_char(created_at AT TIME ZONE 'UTC', 'YYYY-MM-DD"T"HH24:MI:SS.US"Z"') AS created_at`
  return rows.length ? publicComment(commentRow(rows[0])) : null
}
