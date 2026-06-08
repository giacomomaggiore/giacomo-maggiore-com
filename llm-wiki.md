# Plan: Integrate an Obsidian-vault PKM + LLM Query into the website

## Context

The repo `giacomo-maggiore-com` (Next.js 14 App Router, Vercel) currently serves file-based MDX
content from `app/notes/posts/` and `app/blog/posts/`, rendered via `next-mdx-remote` with KaTeX,
a custom `<Table>`, and sugar-high. There is no search, no LLM, no wikilinks, no graph.

The goal is to turn the repo into a single artifact that is **three things at once**:
1. The **website** (unchanged in look; published content lives under `/wiki/public`).
2. An **Obsidian vault** on the desktop (the repo root is the vault; private notes under `/wiki/private`).
3. A **PKM system**: a local zero-click PDF→Markdown→`[[wikilink]]` ingestion pipeline + a `lint`
   health-check, and an **LLM Query** interface where you ask questions answered over the wiki with
   citations.

### The one invariant
> **Private notes must NEVER be rendered as website pages.** No page under `/notes/*` or `/blog/*`,
> no public URL, no sitemap entry. That is the *only* hard rule.

Everything else is relaxed to keep it simple:
- The **LLM and the local pipeline read all notes (public + private) directly off disk** — no special
  access layer, no separate index for private. Easiest possible access.
- We **don't care whether private content reaches Vercel.** The search index is built normally at build
  time from the whole wiki; private chunks simply carry no page URL so they can never become a page.

### Confirmed decisions
- **Full migration**: `app/notes/posts` → `wiki/public/notes`, `app/blog/posts` → `wiki/public/blog`.
  Site URLs (`/notes/[slug]`, `/blog/[slug]`) stay identical.
- **LLM provider = Google Gemini** for the Query and the local linking/lint steps.
  TS web side: `@google/genai`; Python pipeline: `google-genai`. Model ID in env (`GEMINI_MODEL`).
- **PDF parsing = MinerU, fully local** (its own local models on your machine; no cloud call for
  parsing). Only linking, lint, and the Query call Gemini.
- **Query accesses ALL content (public + private).** Public pages stay browsable at `/notes|blog/<slug>`;
  private notes are queryable but never browsable.
- **Retrieval = build-time keyword index** (BM25 over a generated JSON, no vector DB).

---

## Target repository layout

```
wiki/
  source/          # PDF drop folder            (gitignored)
  public/
    notes/         # migrated from app/notes/posts
    blog/          # migrated from app/blog/posts (keeps .en/.it convention)
  private/         # local Obsidian notes; queryable but NEVER a website page
    <topic>/
    index.md       # vault index ([[wikilink]] map, maintained by pipeline)
    log.md         # append-only ingestion log (datetime, filename, topic, source path)
lib/wiki/
  paths.ts         # dir constants: PUBLIC + PRIVATE
  frontmatter.ts   # shared parser (extracted from the two utils.ts)
  chunk.ts         # markdown -> heading-based chunks (shared by indexer)
  retrieve.ts      # BM25 scorer used inside /api/ask
  wikilinks.ts     # build-time PUBLIC title->url map; remark plugin config
  llm.ts           # Gemini client wrapper (model from env, streaming helper)
lib/wiki-index.generated.json   # FULL index (public+private), built at build time, imported by /api/ask
scripts/
  build-wiki-index.ts   # reads wiki/public + wiki/private -> index JSON
  assert-no-private-pages.ts  # build guard: private is never a page / in the sitemap
tools/ingest/      # LOCAL Python pipeline
app/
  ask/page.tsx
  api/ask/route.ts
  components/AskChat.tsx
```

---

## Phase 1 — Restructure + path indirection (refactor, no behavior change)

1. `lib/wiki/paths.ts`: export `WIKI_PUBLIC_DIR` and `WIKI_PRIVATE_DIR`.
   The website's page routes read **only** `WIKI_PUBLIC_DIR`; `WIKI_PRIVATE_DIR` is read only by the
   indexer and the local pipeline.
2. `git mv` `app/notes/posts/*` → `wiki/public/notes/`, `app/blog/posts/*` → `wiki/public/blog/`.
   Post images stay in `public/images/` (served assets, unchanged).
3. Update readers: `app/notes/utils.ts:54`, `app/blog/utils.ts:55,59,73,85`, `app/sitemap.ts`
   (add note slugs). `[slug]/page.tsx` readers go through utils — verify unchanged.
4. Extract duplicated `parseFrontmatter` from both `utils.ts` into `lib/wiki/frontmatter.ts`.
5. Verify the site builds and all existing pages render unchanged.

## Phase 2 — Public wikilink rendering

1. Add `remark-wiki-link` (dynamic-imported like `remark-math`/`remark-gfm` in
   `app/components/mdx.tsx:306-310`).
2. `lib/wiki/wikilinks.ts`: build a **public-only** `title -> /notes|blog/<slug>` map.
   - `[[Title]]` → public page → internal `next/link` (reuse `CustomLink` branch, `mdx.tsx:147`).
   - `[[Title]]` → private/unresolved → **plain text, not a link** (the site never links to something
     that isn't a public page).
3. Test: unknown `[[link]]` renders as text; known public one renders as internal link.

## Phase 3 — Full index (public + private), built at build time

1. `scripts/build-wiki-index.ts` (run via `tsx`): reads **`WIKI_PUBLIC_DIR` and `WIKI_PRIVATE_DIR`**.
   Chunk by H2/H3 (reuse `slugify`, `mdx.tsx:179`), strip frontmatter/JSX/`<Table>`/HTML. Emit
   `lib/wiki-index.generated.json`:
   ```ts
   type WikiChunk = { id; slug; collection:'notes'|'blog'|'private';
                      visibility:'public'|'private'; title; heading;
                      url: string|null;            // null for private -> can never become a page link
                      text; termFreq: Record<string,number> }
   type WikiIndex = { generatedAt; docCount; chunkCount; avgChunkLen;
                      df: Record<string,number>; chunks: WikiChunk[] }
   ```
   Tokenizer: lowercase, strip punctuation, EN+IT stopwords, tokens ≥3.
2. `scripts/assert-no-private-pages.ts`: assert no `app/` page/route reads `WIKI_PRIVATE_DIR`; assert the
   sitemap and `generateStaticParams` enumerate only public collections; assert every chunk with
   `visibility:'private'` has `url===null`. `exit 1` on violation. **This is the enforcement of the one
   invariant.**
3. `package.json`: `"prebuild": "tsx scripts/build-wiki-index.ts && tsx scripts/assert-no-private-pages.ts"`,
   add devDep `tsx`. (`prebuild` runs automatically before `next build`, locally and on Vercel.)
4. `.gitignore` += `/wiki/source`, `/lib/wiki-index.generated.json`, `/tools/ingest/**/__pycache__`.
   (No `.vercelignore` needed for private — we don't care if it deploys; it just can't become a page.)

## Phase 4 — Query API + chat UI (answers over the whole wiki)

1. `app/api/ask/route.ts` (`runtime='nodejs'`, `dynamic='force-dynamic'`; follow the server/env pattern
   of `app/api/posthog/route.ts`):
   - `import wikiIndex from 'lib/wiki-index.generated.json'` (read-only, bundled).
   - `lib/wiki/retrieve.ts`: BM25 (`k1=1.5,b=0.75`) over **all** chunks; top-K≈8, group by slug, context
     block capped ~30K chars; return `{contextText, citations}`.
   - `lib/wiki/llm.ts`: Gemini via `@google/genai`, model from `GEMINI_MODEL`, streaming.
     System prompt: answer **only** from provided pages, cite each claim by title (`[Title]`); public
     pages get a URL, private pages cite title only (no link); refuse if not covered.
   - Stream text deltas via a `ReadableStream`; emit citations as a first JSON meta line.
   - **Cost protection (before go-live):** question-length cap, output token cap, IP rate limit + global
     daily cap (Upstash/Vercel KV; e.g. 5/min, 50/day per IP). 429 + `Retry-After`.
   - `GOOGLE_API_KEY` server-only (no `NEXT_PUBLIC_`).
2. `app/components/AskChat.tsx` (`'use client'`): textarea → `fetch('/api/ask')`, read
   `res.body.getReader()`, render streamed markdown with `react-markdown` (already a dep) + citations
   (public = clickable, private = plain label). AbortController stop button; friendly 429 handling.
3. `app/ask/page.tsx` hosts it; add nav link (`app/components/nav.tsx`).
   - **No write-back online** (Vercel fs is read-only). "File answer into wiki" is local-only.

## Phase 5 — Local ingestion pipeline (Python, under `tools/ingest/`)

Python orchestrator (MinerU is a heavy Python pkg; `google-genai` for Gemini calls). Local only.
```
tools/ingest/  pyproject.toml(watchdog, google-genai, python-frontmatter) cli.py watch.py mineru_run.py link.py vault.py lint.py
```
- **watch.py**: `watchdog` on `wiki/source/*.pdf`, debounce until file size stable.
- **mineru_run.py**: subprocess MinerU (runs **fully locally** with its own models — no cloud call for
  parsing) → markdown+assets → `wiki/private/<topic>/<name>.md` (`--topic` flag or Gemini-inferred).
- **vault.py**: recursively scan vault (public+private) → `title -> relpath` = linking allowlist.
- **link.py**: one Gemini call with the new body + exact existing-title list; prompt forbids inventing
  links. **Then validate programmatically**: regex every `[[...]]`, drop any target not in the allowlist
  (the real anti-hallucination guard). Update `wiki/private/index.md` (validated against real paths).
  Append a line to `wiki/private/log.md`:
  `| 2026-06-08 14:32 | my-paper.md | finance | wiki/source/my-paper.pdf |`
  (columns: datetime ISO 8601, output filename, topic, original source path). Create the file with a
  header row if it doesn't exist yet. Also append when a file is manually added to `wiki/public`
  (watch.py detects any new `.md`/`.mdx` in `wiki/` and logs it even if parsing is skipped).
- **CLI**: `python -m ingest ingest <pdf> [--topic x]` | `watch` | `lint`.
- **lint.py**: deterministic checks always (orphans, broken `[[links]]`, missing frontmatter, pages not
  in index, dup titles); opt-in Gemini checks (contradictions, stale claims, missing concept pages,
  suggested cross-refs/questions) → writes `wiki/private/_lint-report.md`. **Read-only — suggests, never
  auto-edits.**

---

## Libraries / env to add
- npm: `@google/genai`, `remark-wiki-link`, devDep `tsx`; optional `@upstash/redis`.
- Python (local only): `google-genai`, `watchdog`, `python-frontmatter`, MinerU (`magic-pdf`/`mineru`).
- env: `GOOGLE_API_KEY` (server-only), `GEMINI_MODEL`; KV creds if used.

## Risks / trade-offs
- **Private knowledge is reachable via the Query** (and the index may deploy to Vercel) — accepted; the
  only protected boundary is that private notes are never *browsable pages*. If the `/ask` endpoint is
  public, anyone can extract private-note text by asking; gate `/ask` behind auth if that's not wanted.
- **Keyword/BM25 misses paraphrases** (no embeddings): weight title+heading heavily; optional cheap
  Gemini keyword-expansion; clean upgrade path to embeddings without changing the `/ask` contract.
- **Bilingual (it/en)**: stopword list + tokenizer must cover both.
- **Public endpoint cost**: rate limit + daily cap + token caps before go-live.
- **Migration churn**: moving content touches `notes/utils.ts`, `blog/utils.ts`, `sitemap.ts`,
  `[slug]/page.tsx` — do it as one atomic refactor behind `lib/wiki/paths.ts`.

## Verification
- `pnpm build` runs `prebuild` → generates the index (public + private chunks; private chunks have
  `url:null`) and `assert-no-private-pages` passes.
- Existing `/notes/*` and `/blog/*` pages render unchanged after migration.
- A public note with `[[Known Title]]` links internally; `[[Unknown/Private]]` renders as text.
- `grep -rn "WIKI_PRIVATE_DIR" app` returns nothing (no page route reads private).
- Add a private note → it 404s as a page and is absent from the sitemap, but its content can be cited
  by `/ask`.
- `/ask`: question answerable from a public note → streamed answer + clickable citation; from a private
  note → answer cites the private title (no link); off-topic → declines; hammering → 429.
- Local: drop a PDF in `wiki/source` with `watch` running → markdown in `wiki/private`, only allowlisted
  `[[links]]` inserted, `index.md` updated. `python -m ingest lint` produces a report.