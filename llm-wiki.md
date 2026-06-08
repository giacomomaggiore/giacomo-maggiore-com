# Plan: Integrate an Obsidian-vault PKM + public LLM Query into the website

## Context

The repo `giacomo-maggiore-com` (Next.js 14 App Router, Vercel) currently serves file-based MDX
content from `app/notes/posts/` and `app/blog/posts/`, rendered via `next-mdx-remote` with KaTeX,
a custom `<Table>`, and sugar-high. There is no search, no LLM, no wikilinks, no graph.

The goal (`llm-wiki.md`) is to turn the repo into a single artifact that is **three things at once**:
1. The **website** (unchanged in look; published content lives under `/wiki/public`).
2. An **Obsidian vault** on the desktop (the repo root is the vault; private notes under `/wiki/private`).
3. A **PKM system**: a local zero-click PDF→Markdown→`[[wikilink]]` ingestion pipeline + a `lint`
   health-check, and a **public LLM Query** interface where visitors ask questions answered over the
   wiki with citations.

### Confirmed decisions
- **Full migration**: `app/notes/posts` → `wiki/public/notes`, `app/blog/posts` → `wiki/public/blog`.
  Site URLs (`/notes/[slug]`, `/blog/[slug]`) stay identical.
- **LLM provider = Google Gemini** for the online Query and the local linking/lint steps.
  TS web side: `@google/genai`; Python pipeline: `google-genai`. Model IDs kept in an env var
  (`GEMINI_MODEL`) — verify current model names at implementation (no hardcoded default beyond env).
- **PDF parsing = MinerU, fully local** (its own local models on your machine; no cloud call for
  parsing). Only linking, lint, and the online Query call Gemini.
- **Online Query accesses ALL content (public + private).** The public `/ask` endpoint answers from the
  whole wiki. Public pages remain browsable at `/notes|blog/<slug>`; **private notes are NOT browsable
  pages, but their knowledge IS queryable online** and their text can appear in answers.
  ⚠️ Anyone online can extract private-note content by asking — deliberate, accepted tradeoff.
- **Index scope = everything.** The keyword index is built from `wiki/public` + `wiki/private`. Because
  Vercel does not get the raw private files (see guardrails), the index is **generated locally and
  committed**, then imported by the deployed app. The committed index carries private text → the GitHub
  repo MUST be private.
- **Retrieval = build-time keyword index** (BM25 over the generated JSON, no vector DB).
- Build all three areas: folder restructure + wikilinks, local ingestion, web Query.

---

## Target repository layout

```
wiki/
  source/          # PDF drop folder            (gitignored + vercelignored)
  public/
    notes/         # migrated from app/notes/posts
    blog/          # migrated from app/blog/posts (keeps .en/.it convention)
  private/         # local Obsidian notes        (vercelignored raw files; in private GitHub repo)
    <topic>/
    index.md       # vault index ([[wikilink]] map, maintained by pipeline)
lib/wiki/
  paths.ts         # dir constants: PUBLIC + PRIVATE (private used ONLY by indexer/pipeline, never by a web page route)
  frontmatter.ts   # shared parser (extracted from the two utils.ts)
  chunk.ts         # markdown -> heading-based chunks (shared by indexer)
  retrieve.ts      # BM25 scorer used inside /api/ask
  wikilinks.ts     # build-time PUBLIC title->url map; remark plugin config
  llm.ts           # Gemini client wrapper (model from env, streaming helper)
lib/wiki-index.generated.json   # FULL index (public+private). COMMITTED, imported by /api/ask
scripts/
  build-wiki-index.ts   # reads wiki/public + wiki/private -> index JSON (run LOCALLY)
  assert-deploy-safe.ts # build guard: no web route renders private as a page; sitemap public-only
tools/ingest/      # LOCAL Python pipeline       (vercelignored)
app/
  ask/page.tsx
  api/ask/route.ts
  components/AskChat.tsx
```

---

## Phase 1 — Restructure + path indirection (refactor, no behavior change)

1. `lib/wiki/paths.ts`: `WIKI_PUBLIC_DIR` and `WIKI_PRIVATE_DIR`. **`WIKI_PRIVATE_DIR` is imported only
   by `scripts/build-wiki-index.ts` and the Python pipeline — never by any `app/` page/route.**
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
   - `[[Title]]` → private/unresolved → **plain text, not a link** (browsable site never links to a
     private page that doesn't exist as a URL).
3. Test: unknown `[[link]]` renders as text; known public one renders as internal link.

## Phase 3 — Full index (public + private), generated locally

1. `scripts/build-wiki-index.ts` (run via `tsx`): reads **`WIKI_PUBLIC_DIR` and `WIKI_PRIVATE_DIR`**.
   Chunk by H2/H3 (reuse `slugify`, `mdx.tsx:179`), strip frontmatter/JSX/`<Table>`/HTML. Emit
   `lib/wiki-index.generated.json`:
   ```ts
   type WikiChunk = { id; slug; collection:'notes'|'blog'|'private';
                      visibility:'public'|'private'; title; heading;
                      url: string|null;            // null for private (no public page)
                      text; termFreq: Record<string,number> }
   type WikiIndex = { generatedAt; docCount; chunkCount; avgChunkLen;
                      df: Record<string,number>; chunks: WikiChunk[] }
   ```
   Tokenizer: lowercase, strip punctuation, EN+IT stopwords, tokens ≥3.
2. **Run locally**, commit the JSON (NOT gitignored) — this is how private knowledge reaches Vercel,
   since raw private files are vercelignored. Add `pnpm index` script. Document: regenerate + commit
   before deploying when wiki content changes.
3. `scripts/assert-deploy-safe.ts` (runs in `prebuild`): assert no `app/` page/route imports
   `WIKI_PRIVATE_DIR`; assert `sitemap.ts`/routes enumerate only public collections; assert every chunk
   with `visibility:'private'` has `url===null`. `exit 1` on violation.
4. `package.json`: `"index": "tsx scripts/build-wiki-index.ts"`,
   `"prebuild": "tsx scripts/assert-deploy-safe.ts"`; devDep `tsx`.
5. `.gitignore` += `/wiki/source`, `/tools/ingest/**/__pycache__`.
   `.vercelignore` (new) += `wiki/private`, `wiki/source`, `tools/` — raw private files & pipeline never
   uploaded to Vercel; only the committed index travels.

## Phase 4 — Query API + chat UI (answers over the whole wiki)

1. `app/api/ask/route.ts` (`runtime='nodejs'`, `dynamic='force-dynamic'`; follow the server/env pattern
   of `app/api/posthog/route.ts`):
   - `import wikiIndex from 'lib/wiki-index.generated.json'` (bundled, read-only — Vercel-safe).
   - `lib/wiki/retrieve.ts`: BM25 (`k1=1.5,b=0.75`) over **all** chunks; top-K≈8, group by slug, context
     block capped ~30K chars; return `{contextText, citations}`.
   - `lib/wiki/llm.ts`: Gemini via `@google/genai`, model from `GEMINI_MODEL`, streaming.
     System prompt: answer **only** from provided pages, cite each claim by title (`[Title]`); for public
     pages include the URL, for private pages cite title only (no link); refuse if not covered.
   - Stream text deltas via a `ReadableStream`; emit citations as a first JSON meta line.
   - **Cost protection (required before go-live):** question-length cap, output token cap, IP rate limit
     + global daily cap (Upstash/Vercel KV; e.g. 5/min, 50/day per IP). 429 + `Retry-After`.
   - `GOOGLE_API_KEY` server-only (no `NEXT_PUBLIC_`).
2. `app/components/AskChat.tsx` (`'use client'`): textarea → `fetch('/api/ask')`, read
   `res.body.getReader()`, render streamed markdown with `react-markdown` (already a dep) + citations
   (public = clickable, private = plain label). AbortController stop button; friendly 429 handling.
3. `app/ask/page.tsx` hosts it; add nav link (`app/components/nav.tsx`).
   - **No write-back online** (Vercel fs is read-only). "File answer into wiki" is local-only.

## Phase 5 — Local ingestion pipeline (Python, under `tools/ingest/`)

Python orchestrator (MinerU is a heavy Python pkg; `google-genai` for Gemini calls). Never deployed.
```
tools/ingest/  pyproject.toml(watchdog, google-genai, python-frontmatter) cli.py watch.py mineru_run.py link.py vault.py lint.py
```
- **watch.py**: `watchdog` on `wiki/source/*.pdf`, debounce until file size stable.
- **mineru_run.py**: subprocess MinerU (runs **fully locally** on your machine with its own local
  models — no cloud call for parsing) → markdown+assets → `wiki/private/<topic>/<name>.md`
  (`--topic` flag or Gemini-inferred). Only the later linking/lint/query steps call Gemini.
- **vault.py**: recursively scan vault (public+private) → `title -> relpath` = linking allowlist.
- **link.py**: one Gemini call with new body + exact existing-title list; prompt forbids inventing links.
  **Then validate programmatically**: regex every `[[...]]`, drop any target not in the allowlist (the
  real anti-hallucination guard). Update `wiki/private/index.md` (validated against real paths).
- **CLI**: `python -m ingest ingest <pdf> [--topic x]` | `watch` | `lint`.
- **lint.py**: deterministic checks always (orphans, broken `[[links]]`, missing frontmatter, pages not
  in index, dup titles); opt-in Gemini checks (contradictions, stale claims, missing concept pages,
  suggested cross-refs/questions) → writes `wiki/private/_lint-report.md`. **Read-only — suggests, never
  auto-edits.** After ingestion that touches public notes, remind to run `pnpm index` + commit so the
  online Query reflects new content.

---

## Libraries / env to add
- npm: `@google/genai`, `remark-wiki-link`, devDep `tsx`; optional `@upstash/redis`.
- Python (local only): `google-genai`, `watchdog`, `python-frontmatter`, MinerU (`magic-pdf`/`mineru`).
- env: `GOOGLE_API_KEY` (server-only), `GEMINI_MODEL`; KV creds if used.

## Risks / trade-offs
- **Private content is exposed via the public chat by design** — anyone can extract private-note text by
  asking, and the committed index contains that text. Mitigations available if you reconsider: gate
  `/ask` behind auth, or split the index into public-only (deployed) vs full (local). Repo MUST be private.
- **Index freshness is manual**: `pnpm index` + commit is required before deploy when wiki changes
  (Vercel can't regenerate it — it lacks the private files). Document clearly; optional pre-commit hook.
- **Keyword/BM25 misses paraphrases** (no embeddings): weight title+heading heavily; optional cheap
  Gemini keyword-expansion; clean upgrade path to embeddings without changing the `/ask` contract.
- **Bilingual (it/en)**: stopword list + tokenizer must cover both.
- **MinerU weight/latency**: kept entirely out of the web deploy.
- **Public endpoint cost**: rate limit + daily cap + token caps mandatory before go-live.
- **Migration churn**: moving content touches `notes/utils.ts`, `blog/utils.ts`, `sitemap.ts`,
  `[slug]/page.tsx` — do it as one atomic refactor behind `lib/wiki/paths.ts`.

## Verification
- `pnpm index` produces `lib/wiki-index.generated.json` with both public and private chunks; private
  chunks have `url:null`. `pnpm build` runs `assert-deploy-safe` and passes.
- Existing `/notes/*` and `/blog/*` pages render unchanged after migration.
- A public note with `[[Known Title]]` links internally; `[[Unknown/Private]]` renders as text.
- `grep -rn "WIKI_PRIVATE_DIR" app` returns nothing (private dir never read by a page route).
- Add a private note, run `pnpm index` → it 404s as a page but its content can be cited by `/ask`.
- `/ask`: question answerable from a public note → streamed answer + clickable citation; question
  answerable only from a private note → answer cites the private title (no link); off-topic → declines;
  hammering → 429.
- Local: drop a PDF in `wiki/source` with `watch` running → markdown in `wiki/private`, only allowlisted
  `[[links]]` inserted, `index.md` updated. `python -m ingest lint` produces a report.
