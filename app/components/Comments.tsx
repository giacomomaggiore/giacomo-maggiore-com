'use client'

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from 'react'
import type { Comment, CommentPage, ThreadPage } from 'lib/comments/store'
import { bodyError, nameError, normalizeName } from 'lib/comments/validation'

const NAME_KEY = 'comments-display-name'
const buttonStyle = 'min-h-11 px-2 text-sm focus-visible:outline focus-visible:outline-offset-2'

function localDate(timestamp: string) {
  const date = new Date(timestamp)
  return `${date.getDate()} ${date.toLocaleString('en', { month: 'long' }).toLowerCase()} ${date.getFullYear()}`
}

function mergeComments(existing: Comment[], added: Comment[], ascending: boolean) {
  const byId = new Map([...existing, ...added].map(comment => [comment.id, comment]))
  return [...byId.values()].sort((a, b) => {
    const order = a.createdAt.localeCompare(b.createdAt) || a.id.localeCompare(b.id)
    return ascending ? order : -order
  })
}

function Composer({ pageKey, parentId, label, disabled, onPosted, onBusyChange }: {
  pageKey: string; parentId: string | null; label?: string; disabled: boolean; onPosted: (comment: Comment) => void; onBusyChange: (busy: boolean) => void
}) {
  const [body, setBody] = useState('')
  const [name, setName] = useState('')
  const [website, setWebsite] = useState('')
  const [confirming, setConfirming] = useState(false)
  const [posting, setPosting] = useState(false)
  const [error, setError] = useState('')
  const busy = useRef(false)
  const nameRef = useRef<HTMLInputElement>(null)
  const bodyRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => { if (confirming) nameRef.current?.focus() }, [confirming])
  useLayoutEffect(() => {
    const textarea = bodyRef.current
    if (!textarea) return
    const resize = () => {
      textarea.style.height = 'auto'
      textarea.style.height = `${textarea.scrollHeight}px`
    }
    resize()
    window.addEventListener('resize', resize)
    return () => window.removeEventListener('resize', resize)
  }, [body, confirming])

  function prepare() {
    const message = bodyError(body)
    if (message) { setError(message); return }
    try { setName(localStorage.getItem(NAME_KEY) || '') } catch { /* Storage is optional. */ }
    setError('')
    setConfirming(true)
  }

  async function submit() {
    if (busy.current) return
    const message = bodyError(body) || nameError(name)
    if (message) { setError(message); return }
    busy.current = true
    setPosting(true)
    onBusyChange(true)
    setError('')
    try {
      const response = await fetch('/api/comments', {
        method: 'POST', headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ pageKey, parentId, displayName: name, body, website }),
      })
      if (!response.ok) {
        const result = await response.json()
        setError(response.status === 400 ? result.error : 'Could not post your comment. Please try again.')
        return
      }
      const comment: Comment = await response.json()
      try { localStorage.setItem(NAME_KEY, normalizeName(name)) } catch { /* Storage is optional. */ }
      onPosted(comment)
      setBody('')
      setConfirming(false)
    } catch {
      setError('Could not post your comment. Please try again.')
    } finally {
      busy.current = false
      setPosting(false)
      onBusyChange(false)
    }
  }

  return (
    <div className="mt-2">
      {label && <p className="mb-2 text-sm text-neutral-600 dark:text-neutral-400">{label}</p>}
      <div className="flex items-center gap-2 rounded border border-neutral-300 p-2 dark:border-neutral-700">
        <textarea ref={bodyRef} aria-label={label || 'Add a comment'} placeholder="Add a comment…" rows={1} value={body}
          onChange={event => setBody(event.target.value)} disabled={disabled || posting}
          className="min-w-0 flex-1 resize-none overflow-hidden border-0 bg-transparent p-1 outline-offset-2 focus-visible:outline" />
        {!confirming && <button type="button" className={buttonStyle} disabled={disabled} onClick={prepare}>Post</button>}
      </div>
      <div className="absolute left-[-10000px]" aria-hidden="true">
        <label>Website<input type="text" value={website} onChange={event => setWebsite(event.target.value)} tabIndex={-1} autoComplete="off" /></label>
      </div>
      {confirming && <div className="mt-3">
        <label className="block text-sm" htmlFor={`comment-name-${parentId || 'top'}`}>Display name</label>
        <input ref={nameRef} id={`comment-name-${parentId || 'top'}`} type="text" value={name}
          onChange={event => setName(event.target.value.normalize('NFKC').toLowerCase())} disabled={posting}
          className="mt-1 w-full border-0 bg-transparent p-1 outline-offset-2 focus-visible:outline" />
        <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">Your name and comment are public.</p>
        <div className="flex justify-end gap-2">
          <button type="button" className={buttonStyle} disabled={posting} onClick={() => { setConfirming(false); setError('') }}>Cancel</button>
          <button type="button" className={buttonStyle} disabled={disabled || posting} onClick={submit}>{posting ? 'Posting…' : 'Post'}</button>
        </div>
      </div>}
      <p role="status" className="text-sm text-red-700 dark:text-red-400">{error}</p>
    </div>
  )
}

function CommentView({ comment, onReply }: { comment: Comment; onReply?: () => void }) {
  return <div className="min-w-0 [overflow-wrap:anywhere]">
    {comment.deletedAt
      ? <span className="text-neutral-500">Deleted comment</span>
      : <><strong className="font-bold">{comment.displayName}:</strong>{' '}<span className="whitespace-pre-wrap italic">{comment.body}</span></>}
    {' '}<span aria-hidden="true" className="text-xl font-bold leading-none text-neutral-500">•</span>{' '}
    <time className="whitespace-nowrap text-sm text-neutral-600 dark:text-neutral-400" dateTime={comment.createdAt}>{localDate(comment.createdAt)}</time>
    {onReply && <>{' '}<span aria-hidden="true" className="text-xl font-bold leading-none text-neutral-500">•</span>{' '}
      <button type="button" className="relative -my-2 inline-block py-2 text-sm underline underline-offset-2 focus-visible:outline focus-visible:outline-offset-2" onClick={onReply} aria-label={`Reply to ${comment.deletedAt ? 'a deleted comment' : comment.displayName}`}>reply</button>
    </>}
  </div>
}

export function Comments({ pageKey }: { pageKey: string }) {
  const section = useRef<HTMLElement>(null)
  const [state, setState] = useState<'waiting' | 'loading' | 'ready' | 'error'>('waiting')
  const [thread, setThread] = useState<ThreadPage>({ comments: [], nextCursor: null, replies: {} })
  const [activeReply, setActiveReply] = useState<string | null>(null)
  const [loadError, setLoadError] = useState('')
  const [loadingMore, setLoadingMore] = useState(false)
  const [submitting, setSubmitting] = useState(false)

  const fetchPage = useCallback(async (parentId?: string, cursor?: string): Promise<ThreadPage> => {
    const params = new URLSearchParams({ pageKey })
    if (parentId) params.set('parentId', parentId)
    if (cursor) params.set('cursor', cursor)
    const response = await fetch(`/api/comments?${params}`, { cache: 'no-store' })
    if (!response.ok) throw new Error('Comments unavailable')
    return response.json()
  }, [pageKey])

  const load = useCallback(async () => {
    setState('loading')
    try { setThread(await fetchPage()); setState('ready') } catch { setState('error') }
  }, [fetchPage])

  useEffect(() => {
    const target = section.current
    if (!target) return
    const observer = new IntersectionObserver(entries => {
      if (entries.some(entry => entry.isIntersecting)) { observer.disconnect(); void load() }
    }, { rootMargin: '400px' })
    observer.observe(target)
    return () => observer.disconnect()
  }, [load])

  async function more(parentId?: string) {
    if (loadingMore) return
    const cursor = parentId ? thread.replies[parentId]?.nextCursor : thread.nextCursor
    if (!cursor) return
    setLoadingMore(true)
    setLoadError('')
    try {
      const result = await fetchPage(parentId, cursor)
      setThread(current => parentId
        ? { ...current, replies: { ...current.replies, [parentId]: { comments: mergeComments(current.replies[parentId]?.comments || [], result.comments, true), nextCursor: result.nextCursor } } }
        : { comments: mergeComments(current.comments, result.comments, false), nextCursor: result.nextCursor, replies: { ...current.replies, ...result.replies } })
    } catch { setLoadError('Could not load more comments. Please try again.') }
    finally { setLoadingMore(false) }
  }

  function posted(comment: Comment) {
    setThread(current => {
      if (!comment.parentId) return { ...current, comments: mergeComments(current.comments, [comment], false), replies: { ...current.replies, [comment.id]: { comments: [], nextCursor: null } } }
      const previous: CommentPage = current.replies[comment.parentId] || { comments: [], nextCursor: null }
      return { ...current, replies: { ...current.replies, [comment.parentId]: { ...previous, comments: mergeComments(previous.comments, [comment], true) } } }
    })
    setActiveReply(null)
  }

  return <section ref={section} className="ph-no-capture mt-8 border-t border-neutral-200 pt-3 dark:border-neutral-800" aria-labelledby="comments-heading">
    <h2 id="comments-heading" className="text-xl font-bold">Comments</h2>
    {state === 'ready' && <Composer pageKey={pageKey} parentId={null} disabled={submitting} onPosted={posted} onBusyChange={setSubmitting} />}
    <div role="status" aria-live="polite" className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
      {(state === 'waiting' || state === 'loading') && 'Loading comments…'}
      {state === 'error' && <>Comments are temporarily unavailable. <button type="button" className={buttonStyle} onClick={load}>Retry</button></>}
      {state === 'ready' && !thread.comments.length && 'No comments yet.'}
      {loadError}
    </div>
    {state === 'ready' && <div className="mt-2 space-y-3">
      {thread.comments.map(comment => <div key={comment.id}>
        <CommentView comment={comment} onReply={submitting ? undefined : () => setActiveReply(activeReply === comment.id ? null : comment.id)} />
        {activeReply === comment.id && <div className="ml-4"><Composer pageKey={pageKey} parentId={comment.id} label={`Replying to ${comment.deletedAt ? 'a deleted comment' : comment.displayName}`} disabled={submitting} onPosted={posted} onBusyChange={setSubmitting} /></div>}
        <div className="ml-4 mt-1 space-y-2">
          {thread.replies[comment.id]?.comments.map(reply => <CommentView key={reply.id} comment={reply} />)}
          {thread.replies[comment.id]?.nextCursor && <button type="button" className={buttonStyle} disabled={loadingMore} onClick={() => more(comment.id)}>Load more replies</button>}
        </div>
      </div>)}
      {thread.nextCursor && <button type="button" className={buttonStyle} disabled={loadingMore} onClick={() => more()}>Load more comments</button>}
    </div>}
  </section>
}
