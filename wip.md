# WIP — Work In Progress log

Running log of changes made while implementing the `llm-wiki.md` plan, phase by phase.

---

## Phase 1 — Restructure + path indirection (refactor, no behavior change)

**Goal:** make the repo double as an Obsidian vault by moving published content under `wiki/public`,
behind a single source-of-truth for paths, **without changing anything the website visitor sees.**

**Status:** ✅ Done. `pnpm build` passes — 44/44 pages generated (16 notes + 10 blog posts prerendered,
identical URLs).

### New files

| File | Purpose |
|------|---------|
| `lib/wiki/paths.ts` | Single source of truth for wiki directories. Exports `WIKI_DIR`, `WIKI_PUBLIC_DIR`, `WIKI_PRIVATE_DIR`, `WIKI_PUBLIC_NOTES_DIR`, `WIKI_PUBLIC_BLOG_DIR`. **Website page routes import only the PUBLIC constants**; `WIKI_PRIVATE_DIR` is reserved for the indexer / local pipeline (added in later phases). |
| `lib/wiki/frontmatter.ts` | Shared `parseFrontmatter()` + `Metadata` type, extracted from the two duplicated copies that lived in `app/notes/utils.ts` and `app/blog/utils.ts`. Logic is byte-for-byte the same — just de-duplicated. |

### Content moved (via `git mv`, history preserved)

- `app/notes/posts/*` → `wiki/public/notes/` (16 `.mdx` + `17-return-stacking.txt` draft)
- `app/blog/posts/*` → `wiki/public/blog/` (20 files = 10 posts × `.en`/`.it`)
- Old empty `app/notes/posts/` and `app/blog/posts/` directories removed.
- **Images were NOT moved** — they stay in `public/images/` (served static assets; MDX references like
  `/images/notes/...` keep working unchanged).

### Files edited

- **`app/notes/utils.ts`**
  - Removed the local `Metadata` type + `parseFrontmatter()` (now imported from `lib/wiki/frontmatter`).
  - `getBlogPosts()` now reads `WIKI_PUBLIC_NOTES_DIR` instead of `path.join(process.cwd(),'app','notes','posts')`.
- **`app/blog/utils.ts`**
  - Same de-duplication of `Metadata`/`parseFrontmatter`.
  - `getBlogPosts()`, `getAllSlugs()`, and `getPost()` now read `WIKI_PUBLIC_BLOG_DIR` (3 path-joins replaced).
  - `Lang` type and the it/en language-fallback logic are unchanged.
- **`app/sitemap.ts`**
  - Imported the notes reader as `getNotes` (aliased to avoid the name clash — both utils export `getBlogPosts`).
  - **Added `/notes/<slug>` entries and the `/notes` route to the sitemap.** Notes were previously
    missing from the sitemap entirely; this is the one intentional behavior addition in Phase 1 (it only
    adds URLs that already existed as pages, so nothing visible to a normal visitor changes).

### Not touched (verified they still work through the utils layer)

`app/notes/[slug]/page.tsx`, `app/blog/[slug]/page.tsx`, `app/blog/page.tsx`, `app/components/notes.tsx`,
`app/components/posts.tsx`, `app/feed.xml/route.ts` — these import functions (`getBlogPosts`, `getPost`,
`getAllSlugs`), not directories, so the path change is fully encapsulated inside the two `utils.ts` files.

### Notes / leftovers
- Pre-existing TypeScript "Hint" diagnostics on untyped params in `utils.ts` are unchanged (project runs
  `strict: false`). Pre-existing KaTeX `No character metrics for '€'` warnings during build are unrelated.
- `wiki/private/` does not exist yet — created in the ingestion phase (Phase 5). `WIKI_PRIVATE_DIR` is
  defined now so later phases have a stable import.

---

## Phase 4 — Query API + chat UI

**Status:** ✅ Done. `/ask` page live in dev; requires `GOOGLE_API_KEY` (or `OPENAI_API_KEY`) in `.env.local`.

### New files

| File | Purpose |
|------|---------|
| `lib/wiki/llm.ts` | Provider-agnostic streaming wrapper. Reads `LLM_PROVIDER` / `LLM_MODEL` from env; dispatches to `_streamGemini()` or `_streamOpenAI()`. Exports `streamAnswer(question, context)` (async generator) and `buildCitations(notes)`. |
| `app/api/ask/route.ts` | POST endpoint. Lazy-loads the JSON index, runs BM25 retrieval, streams the response: first line is `{"citations":[…]}\n`, then raw text chunks. Question-length cap at 500 chars. |
| `app/components/AskChat.tsx` | Client component. Reads the stream: parses the first `\n`-delimited line as citation JSON, appends the rest to the answer. Renders answer as markdown via `react-markdown`. AbortController stop button. |
| `app/ask/page.tsx` | Simple server page hosting `<AskChat />`. |

### Packages added

- `openai ^6.42.0` — wired up in `lib/wiki/llm.ts` for the OpenAI provider path

### Retrieval accuracy improvements

Three improvements to `lib/wiki/retrieve.ts` (index regenerated after each change):

| Change | Detail |
|--------|--------|
| **Stemming** | `stem()` function added before `tokenize()` output. Single-pass, longest-suffix-first. Collapses inflected forms: `economics`/`economic`/`economical` → `econom`, `statistics`/`statistical` → `statist`, `regression` → `regress`, `investment` → `invest`. No extra dependency. |
| **Title boost** | Query terms that match a word in the note's title get a 2× score multiplier. A note titled "Econometrics" will heavily outrank a note that merely mentions econometrics once in a footnote. |
| **topK 4 → 5** | Default number of notes sent to the LLM as context increased from 4 to 5. |

---

### LLM provider abstraction

Mirrors the Python `tools/ingest/providers.py` pattern exactly. `lib/wiki/llm.ts` is
provider-agnostic — the provider is chosen via `.env.local`, no code changes required to switch.

**Env vars (to add to `.env.local` before Phase 4):**
```dotenv
# Choose provider: gemini (default) or openai
LLM_PROVIDER=gemini

# Optional model override
# LLM_MODEL=gemini-2.0-flash-lite   # default for gemini
# LLM_MODEL=gpt-4o-mini             # default for openai

# Key for chosen provider (server-only — no NEXT_PUBLIC_ prefix)
GOOGLE_API_KEY=...    # LLM_PROVIDER=gemini
# OPENAI_API_KEY=...  # LLM_PROVIDER=openai
```

**`lib/wiki/llm.ts` contract:**
- Reads `LLM_PROVIDER` (default `gemini`), `LLM_MODEL`, and the relevant API key from `process.env`
- Exports `async function* streamAnswer(question: string, context: WikiNote[]): AsyncGenerator<string>`
- Internally dispatches to `_streamGemini()` or `_streamOpenAI()` based on provider
- `openai` npm package added as dependency when OpenAI support is wired up

### Phase 2 — permanently skipped
Wikilinks rendering (`[[Title]]` in MDX) is not needed: public notes will never use `[[...]]`
syntax. The syntax exists only in private vault notes, which are never rendered as pages.

---

## Phase 3 — Full index (public + private) + BM25 retrieval

**Goal:** build a JSON index of all wiki content at build time so the LLM Query (Phase 4) can
do keyword retrieval over public and private notes without hitting disk at request time.

**Status:** ✅ Done. `pnpm index` generates the index; `pnpm build` runs both scripts automatically
via the `prebuild` hook and passes (44/44 pages, all checks green).

### New files

| File | Purpose |
|------|---------|
| `lib/wiki/retrieve.ts` | Shared `tokenize()` + `WikiNote`/`WikiIndex` types + `retrieve()` BM25 scorer (k1=1.5, b=0.75). Single source of truth for tokenization — imported by both the indexer and the future `/api/ask` route. |
| `scripts/build-wiki-index.ts` | Reads `wiki/public/notes/` (16 notes), `wiki/public/blog/` (10 `.en.mdx` posts, `.it.mdx` skipped), and `wiki/private/` (recursive, skips `index`, `log`, `_lint-report`, `images/`). Cleans text, tokenizes, builds `termFreq` per note and global `df` + `avgNoteLen`. Writes `lib/wiki-index.generated.json`. |
| `scripts/assert-no-private-pages.ts` | Two build-time guards: (1) no `.ts`/`.tsx` under `app/` references `WIKI_PRIVATE_DIR`; (2) every note with `visibility:'private'` in the generated index has `url===null`. Exits 1 on violation. |

### Files edited

| File | Change |
|------|--------|
| `package.json` | Added `"index": "tsx scripts/build-wiki-index.ts"` and `"prebuild": "tsx scripts/build-wiki-index.ts && tsx scripts/assert-no-private-pages.ts"` scripts; added `tsx ^4.0.0` to `devDependencies`. |
| `.gitignore` | Added `/lib/wiki-index.generated.json` and `/tools/ingest/**/__pycache__`. |

### Generated file (not committed)

`lib/wiki-index.generated.json` — 29 notes (16 notes, 10 blog, 3 private); ~9 400 unique tokens in
the global `df`; average note length ~2 078 tokens.

### Key design decisions

- **English-only blog indexing**: `.it.mdx` files are skipped. BM25 covers English content only;
  avoids duplicate scoring between language variants.
- **Private slugs include topic subdir** (e.g. `switzerland/Italian Diaspora Nicola Protasoni`) to
  avoid collisions across topics.
- **Tokenizer**: lowercase → strip non-alphanumeric → ≥3 chars → ~80 EN+IT stopwords removed.
  Lives in `lib/wiki/retrieve.ts` so indexer and retriever are always in sync.
- **BM25** implemented in `retrieve()` in `lib/wiki/retrieve.ts`. Used by Phase 4's `/api/ask` route.

### Local workflow

```
pnpm index       # regenerate after adding/editing notes
pnpm build       # prebuild runs indexer + assert automatically
```

---

## Phase 4b — Hybrid BM25 + embedding retrieval

**Goal:** replace keyword-only BM25 retrieval with hybrid search: BM25 for exact-term recall fused
with OpenAI embedding cosine similarity for semantic recall, combined via Reciprocal Rank Fusion.

**Status:** ✅ Done.

### Problem with pure BM25

`retrieve()` scored notes using only exact token overlap. A question like *"how do central banks
affect inflation"* returned zero score for a note titled *"Monetary Transmission Mechanisms"* because
no stemmed token matched. Semantically close content was systematically missed.

### Changes

| File | Change |
|------|--------|
| `lib/wiki/retrieve.ts` | Added `embedding?: number[]` to `WikiNote`. Extracted `bm25Scores()` private helper. Added `cosineSim()` (dot product; unit-normalised vectors). Added `retrieveHybrid(query, queryEmbedding, index, topK)` which runs both methods and fuses ranks with RRF (k=60). `retrieve()` is unchanged for backwards compatibility. |
| `scripts/build-wiki-index.ts` | Wrapped top-level code in `async main()`. Added `embedNotes()`: calls `client.embeddings.create()` in a single batch request for all notes (`text-embedding-3-small`). Attaches `embedding: number[]` to each `WikiNote` before writing the JSON. Gracefully skips if `OPENAI_API_KEY` is not set. |
| `app/api/ask/route.ts` | Added `embedQuery()`: embeds the user question with `text-embedding-3-small`. Runs `embedQuery` and `getIndex()` concurrently with `Promise.all`. Passes the query embedding to `retrieveHybrid()` instead of `retrieve()`. Falls back to BM25-only if `OPENAI_API_KEY` is absent. |

### How RRF fusion works

Both BM25 and embedding search produce a ranked list of notes. RRF ignores raw scores and works
on positions only:

```
final_score_i = 1/(60 + rank_BM25_i) + 1/(60 + rank_embedding_i)
```

A note ranked highly by both methods scores double; a note found by only one still ranks normally.
The constant 60 smooths the top-rank advantage so ranks 1–10 remain meaningfully differentiated.

### Env var

`OPENAI_API_KEY` is now used for embeddings regardless of `LLM_PROVIDER`. Both answer generation
and embedding generation can use different providers independently.

### Rebuild required

After pulling this change, run:

```bash
npm run index   # regenerates lib/wiki-index.generated.json with embedding vectors
```

`pnpm build` does this automatically via the `prebuild` hook.

---

## Phase 5 — Local ingestion pipeline

**Goal:** on-demand PDF → Markdown → `[[wikilinks]]` conversion, plus a vault health-check command.
No file watcher — everything triggered manually.

**Status:** ✅ Done. CLI smoke-tested; `lint` runs end-to-end against the real vault (36 notes scanned).

### New files

| File | Purpose |
|------|---------|
| `tools/ingest/__init__.py` | Makes `tools/ingest/` a Python package |
| `tools/ingest/__main__.py` | Entry point for `python -m ingest`; adds package dir to `sys.path` |
| `tools/ingest/pyproject.toml` | Dependency declaration (`google-genai`, `python-frontmatter`, `python-dotenv`) |
| `tools/ingest/vault.py` | Scans all of `wiki/` (public + private) → builds `{title: filepath}` allowlist for link validation |
| `tools/ingest/mineru_run.py` | Calls `/opt/anaconda3/bin/mineru` as subprocess; finds output `.md`; adds frontmatter (`title`, `date`, `source`, `topic`); copies images; writes to `wiki/private/<topic>/<stem>.md` |
| `tools/ingest/link.py` | Calls Gemini to insert `[[wikilinks]]`; validates every link against the vault allowlist (drops hallucinated ones); updates `wiki/private/index.md` and appends to `wiki/private/log.md` |
| `tools/ingest/lint.py` | Deterministic health checks (broken links, orphans, duplicate titles, missing frontmatter); optional `--llm` flag adds Gemini suggestions; writes `wiki/private/_lint-report.md` (read-only) |
| `tools/ingest/cli.py` | `argparse` wiring for `run` and `lint` commands; loads `.env.local` automatically |

### Files created at runtime (by the pipeline)

- `wiki/source/` — PDF drop folder (gitignored). Place PDFs here before running.
- `wiki/private/index.md` — vault index: one `[[Title]]` bullet per ingested note, grouped by topic.
- `wiki/private/log.md` — append-only ingestion log (datetime, output file, topic, source PDF).
- `wiki/private/_lint-report.md` — health-check report (overwritten on each lint run).

### Dependencies installed

- `python-frontmatter` 1.3.0
- `python-dotenv` (new install)
- `google-genai` 1.5.0 was already present

### Key design decisions

- **Anti-hallucination guard**: `link.py` validates every `[[...]]` against the vault allowlist after the LLM call. Any link whose target title doesn't exist in the vault is silently dropped.
- **MinerU binary path**: hardcoded to `/opt/anaconda3/bin/mineru` in `mineru_run.py:MINERU_BIN`. Update if the path changes.
- **LLM provider**: configured via `LLM_PROVIDER` in `.env.local`. Refactored in the next section.

---

## Phase 5 — LLM provider abstraction (refactor)

**Goal:** decouple the pipeline from Google Gemini so the provider can be swapped via a single env var, with no code changes elsewhere.

**Status:** ✅ Done.

### New file

| File | Purpose |
|------|---------|
| `tools/ingest/providers.py` | Single `generate(prompt) -> str` function. Reads `LLM_PROVIDER` from env and dispatches to `_gemini()` or `_openai()`. Each backend uses a cheap default model unless `LLM_MODEL` overrides it. |

### Files edited

| File | Change |
|------|--------|
| `tools/ingest/mineru_run.py` | Removed `from google import genai` and `_model()`. `_infer_topic()` and `run_pdf()` no longer accept a `client` parameter — they call `generate()` from `providers`. |
| `tools/ingest/link.py` | Same: removed Gemini import, `_model()`, and `client` param from `insert_links()`. LLM call is now `linked_body = generate(prompt)`. Removed unused `import os`. |
| `tools/ingest/lint.py` | Removed inline Gemini client creation from `_llm_suggestions()`. Now imports and calls `generate(prompt)`. |
| `tools/ingest/cli.py` | `_require_api_key()` is now provider-aware (checks `GOOGLE_API_KEY` for gemini, `OPENAI_API_KEY` for openai). `cmd_run` no longer creates a `genai.Client` or passes it down. |
| `tools/ingest/pyproject.toml` | Provider SDKs moved to optional extras: `pip install -e ".[gemini]"` or `pip install -e ".[openai]"`. Core deps are now only `python-frontmatter` and `python-dotenv`. |

### Env vars (add to `.env.local`)

```dotenv
# Choose provider: gemini (default) or openai
LLM_PROVIDER=gemini

# Optional model override (otherwise uses the cheapest default for each provider)
# LLM_MODEL=gemini-2.0-flash-lite   # default for gemini
# LLM_MODEL=gpt-4o-mini             # default for openai

# Key for the chosen provider:
GOOGLE_API_KEY=...    # LLM_PROVIDER=gemini
# OPENAI_API_KEY=...  # LLM_PROVIDER=openai
```

### Default models

| Provider | Default | Notes |
|----------|---------|-------|
| `gemini` | `gemini-2.0-flash-lite` | Cheapest/fastest Gemini tier |
| `openai` | `gpt-4o-mini` | Cheapest capable OpenAI model |

---

## Phase 5 — Markdown cleanup step + Obsidian filename fix (refactor)

**Goal:** improve the quality of ingested notes with an LLM cleanup pass, and fix a bug where Obsidian showed ghost nodes in the graph view due to filename/wikilink mismatch.

**Status:** ✅ Done.

### New file

| File | Purpose |
|------|---------|
| `tools/ingest/cleanup.py` | `clean_markdown(content) -> str` — sends raw MinerU output through the LLM to fix OCR artifacts, grammar, markdown formatting, and strip non-content noise (ads, disclaimers, page headers/footers, repeated lines). Prompt is conservative: no summarizing, no rephrasing, no touching formulas or technical terms. |

### Files edited

| File | Change |
|------|--------|
| `tools/ingest/mineru_run.py` | Added `from cleanup import clean_markdown`. After reading MinerU output, calls `clean_markdown(raw_content)` before writing to disk. The cleaned content is what gets frontmatter, wikilinks, and is saved as the final note. Also: output filename now uses the human-readable title (spaces) instead of the raw PDF stem (underscores). |

### Pipeline order (per PDF)

```
MinerU (local)
  → topic inference (LLM)
  → markdown cleanup (LLM)   ← new
  → write to wiki/private/<topic>/<Title>.md
  → wikilink insertion (LLM)
  → log + index update
```

### Obsidian filename fix

**Bug:** Obsidian graph showed duplicate ghost nodes — e.g. `Italian_Diaspora_Nicola_Protasoni` (real file, underscores) and `Italian Diaspora Nicola Protasoni` (ghost, from `[[...]]` in `index.md`). Obsidian matches wikilinks to filenames, not frontmatter titles, so the underscore/space mismatch caused unresolved links.

**Fix:** `mineru_run.py` now derives the output filename from the same title string used in frontmatter (`pdf_path.stem.replace("_"," ").replace("-"," ").title()`), so `[[Italian Diaspora Nicola Protasoni]]` resolves to `Italian Diaspora Nicola Protasoni.md` in Obsidian with no ghost node.


..

**Existing files:** rename manually in Finder or Obsidian — new ingestions are correct automatically.