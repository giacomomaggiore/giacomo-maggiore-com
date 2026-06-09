'use client'

import { useState, useRef, useEffect } from 'react'
import ReactMarkdown from 'react-markdown'
import remarkGfm from 'remark-gfm'
import remarkMath from 'remark-math'
import rehypeKatex from 'rehype-katex'

type Citation = { title: string; url: string | null }
type Status = 'idle' | 'loading' | 'done' | 'error'

export function AskChat() {
  const [question, setQuestion] = useState('')
  const [answer, setAnswer] = useState('')
  const [citations, setCitations] = useState<Citation[]>([])
  const [status, setStatus] = useState<Status>('idle')
  const abortRef = useRef<AbortController | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  // grow the textarea to fit content, shrink back when cleared
  useEffect(() => {
    const el = textareaRef.current
    if (!el) return
    el.style.height = 'auto'
    el.style.height = el.scrollHeight + 'px'
  }, [question])

  async function submit() {
    if (!question.trim() || status === 'loading') return

    setAnswer('')
    setCitations([])
    setStatus('loading')

    const controller = new AbortController()
    abortRef.current = controller

    try {
      const res = await fetch('/api/ask', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ question }),
        signal: controller.signal,
      })

      if (!res.ok) {
        const err = await res.json()
        setAnswer(err.error ?? 'Something went wrong.')
        setStatus('error')
        return
      }

      const reader = res.body!.getReader()
      const decoder = new TextDecoder()
      let metaParsed = false
      let buf = ''

      while (true) {
        const { done, value } = await reader.read()
        if (done) break
        const chunk = decoder.decode(value, { stream: true })

        if (!metaParsed) {
          // Buffer until we find the first newline — that's the JSON citations line
          buf += chunk
          const nl = buf.indexOf('\n')
          if (nl !== -1) {
            setCitations(JSON.parse(buf.slice(0, nl)).citations)
            metaParsed = true
            const rest = buf.slice(nl + 1)
            if (rest) setAnswer(rest)
          }
        } else {
          setAnswer(prev => prev + chunk)
        }
      }

      setStatus('done')
    } catch (err: unknown) {
      if ((err as Error).name !== 'AbortError') setStatus('error')
    }
  }

  function stop() {
    abortRef.current?.abort()
    setStatus('idle')
  }

  return (
    <div className="flex flex-col gap-4">
      <div className="flex gap-2 items-end">
        <textarea
          ref={textareaRef}
          value={question}
          onChange={e => setQuestion(e.target.value)}
          onKeyDown={e => { if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) submit() }}
          placeholder="Ask anything in the knowledge system…"
          rows={1}
          className="flex-1 p-2 rounded border border-neutral-200 dark:border-neutral-700 bg-transparent text-sm resize-none overflow-hidden focus:outline-none"
        />
        <button
          onClick={submit}
          disabled={status === 'loading' || !question.trim()}
          className="px-4 py-2 text-sm rounded bg-neutral-900 dark:bg-neutral-100 text-white dark:text-neutral-900 disabled:opacity-40 shrink-0"
        >
          {status === 'loading' ? 'Thinking…' : '↑'}
        </button>
        {status === 'loading' && (
          <button
            onClick={stop}
            className="px-4 py-2 text-sm rounded border border-neutral-300 dark:border-neutral-700 shrink-0"
          >
            Stop
          </button>
        )}
      </div>

      {answer && (
        <div className="prose prose-sm dark:prose-invert max-w-none">
          <ReactMarkdown remarkPlugins={[remarkGfm, remarkMath]} rehypePlugins={[rehypeKatex]}>{answer}</ReactMarkdown>
        </div>
      )}

      {citations.length > 0 && (
        <div className="text-xs text-neutral-500 dark:text-neutral-400 border-t border-neutral-100 dark:border-neutral-800 pt-3">
          <span className="font-medium">Sources: </span>
          {citations.map((c, i) => (
            <span key={c.title}>
              {i > 0 && ', '}
              {c.url
                ? <a href={c.url} className="underline underline-offset-2">{c.title}</a>
                : <span>{c.title}</span>
              }
            </span>
            

          ))}
        </div>
      )}
    </div>
  )
}
