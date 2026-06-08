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