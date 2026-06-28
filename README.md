# giacomo-maggiore-com

> Please note that this file is 100% AI-generate. Thanks Claude.

Personal website at [giacomomaggiore.com](https://giacomomaggiore.com) — built with Next.js 14 (App Router), deployed on Vercel. It also doubles as an Obsidian vault and a local knowledge-management system with LLM-powered Q&A.

---

## Why this exists

I've always liked keeping track of what I study and read. For years that meant notebooks; then an iPad; then Notion; then the realisation that no off-the-shelf tool gave me full control over my own knowledge.

The goal of this project is to centralise everything in one place — website, public notes, private reading archive, Obsidian graph, AI assistant — without giving up ownership of any of it.

The underlying conviction is simple: **information is not knowledge.** Consuming articles, papers, and books without a structure to review, connect, and revisit them produces little lasting value. Building that structure requires some daily effort, but pays off long-term as notes accumulate and topics interweave.

### What AI does (and doesn't do) here

AI is used **only for operational tasks** — OCR cleanup, wikilink insertion, Markdown formatting, folder organisation. It never writes the notes themselves. Every note starts from a personal interest or something read manually; the AI enters later, once the direction of the topic is already clear.

The friction of learning is intentional and kept. The friction of formatting a PDF or organising a folder is a waste of time and is automated away.

### JackGPT

On top of the private knowledge base, there is a public chatbot at [/ask](https://giacomomaggiore.com/ask) — nicknamed **JackGPT** — that answers questions grounded in the actual notes. It uses hybrid retrieval (BM25 + embeddings) to find the most relevant files, then passes them as context to an LLM. Public notes get a clickable citation; private notes are cited by title only. It's a way to make the knowledge base indirectly accessible without exposing the raw files.

---

## What this repo is

Three things at once:

1. **Website** — blog posts and notes rendered as public pages (`/blog/[slug]`, `/notes/[slug]`).
2. **Obsidian vault** — `wiki/private/` holds private notes on disk, never exposed as pages.
3. **PKM system** — a local pipeline converts PDFs to linked Markdown notes, plus the `/ask` page where you can query the whole knowledge base (public + private) and get cited answers.

### Hard rule

Private notes (`wiki/private/`) are **never** rendered as website pages and never appear in the sitemap. They can only surface through the `/ask` query interface.

---

## Repo layout

```
wiki/
  source/          # drop PDFs here before running ingest  (gitignored)
  public/
    notes/         # published notes  ->  /notes/[slug]
    blog/          # published blog posts (.en.mdx / .it.mdx)  ->  /blog/[slug]
  private/         # local Obsidian vault — queryable, never a page  (gitignored)
    index.md       # auto-maintained list of all ingested notes
    log.md         # append-only ingestion log
    _lint-report.md

lib/wiki/
  paths.ts         # directory constants (PUBLIC / PRIVATE) — single source of truth
  frontmatter.ts   # shared frontmatter parser
  retrieve.ts      # BM25 scorer + hybrid retrieval types
  llm.ts           # provider-agnostic streaming wrapper (Gemini or OpenAI)
  mdx-files.ts     # MDX file utilities

scripts/
  build-wiki-index.ts         # reads all notes -> lib/wiki-index.generated.json
  assert-no-private-pages.ts  # build guard: exits 1 if any private note leaks as a page

tools/ingest/               # local Python pipeline
  cli.py            # entry point: run, refresh, lint commands
  mineru_run.py     # PDF -> Markdown via MinerU (fully local)
  cleanup.py        # LLM pass to fix OCR artifacts and formatting
  link.py           # LLM pass to insert [[wikilinks]]; validates against vault allowlist
  providers.py      # provider-agnostic generate() — dispatches to Gemini or OpenAI
  vault.py          # scans wiki/ -> {title: filepath} allowlist
  refresh_vault.py  # re-processes existing notes with a reasoning model
  lint.py           # health checks (orphans, broken links, missing frontmatter...)

app/
  ask/page.tsx              # /ask page
  api/ask/route.ts          # POST endpoint — retrieval + streaming LLM answer
  components/AskChat.tsx    # client component — textarea, streamed markdown, citations
```

---

## Index build pipeline

The knowledge index is built at compile time and never committed to git.

**How it works:**

1. `scripts/build-wiki-index.ts` reads every `.md`/`.mdx` file in `wiki/public/` and `wiki/private/`.
2. For each note it strips frontmatter, JSX tags, and HTML, then tokenizes the clean text (lowercase, no punctuation, ≥3 chars, EN+IT stopwords removed, light stemming).
3. If `OPENAI_API_KEY` is set, each note is also embedded with `text-embedding-3-small`.
4. Output: `lib/wiki-index.generated.json` — one entry per note with slug, visibility, title, URL (null for private), full text, token frequencies, and optional embedding vector.
5. `scripts/assert-no-private-pages.ts` then checks that no `app/` file imports `WIKI_PRIVATE_DIR` and that every private note has `url: null`. Build fails otherwise.

**Commands:**

```bash
pnpm index    # regenerate the index manually (after adding/editing notes)
pnpm build    # runs the indexer + guard automatically via the prebuild hook, then builds
```

---

## /ask — LLM query interface

Live at `/ask`. You type a question; the server retrieves the most relevant notes and streams a cited answer.

**Retrieval — hybrid BM25 + semantic search:**

- BM25 (keyword) and embedding cosine similarity (semantic) each produce a ranked list.
- The two lists are fused with Reciprocal Rank Fusion (RRF, k=60): `score = 1/(60 + rank_BM25) + 1/(60 + rank_embedding)`.
- Top 5 notes by combined score are sent to the LLM as context.
- Falls back to BM25-only if `OPENAI_API_KEY` is not set.

**Answer generation:**

- `lib/wiki/llm.ts` is provider-agnostic — dispatches to Gemini or OpenAI based on `LLM_PROVIDER`.
- The model is instructed to answer only from the provided notes and cite every claim by note title.
- Public notes get a clickable link; private notes are cited by title only (no link).
- Response is streamed: first newline-delimited JSON with citations, then raw text chunks.
- Questions are capped at 500 characters.

---

## Local ingestion pipeline (PDF -> private notes)

Converts PDFs into linked Markdown notes in `wiki/private/`. Runs locally only — no file watcher, always on-demand.

**Pipeline per PDF:**

1. **MinerU** (fully local, no cloud) — extracts text, tables, formulas, images to Markdown.
2. **LLM — topic inference** — picks a folder name from the content (skipped if `--topic` is given).
3. **LLM — cleanup** — fixes OCR artifacts, strips page headers/footers, ads, repeated lines. Conservative: no summarizing, no rephrasing.
4. **LLM — wikilinks** — inserts `[[links]]` to existing notes. Every link is validated against the vault allowlist; hallucinated links are silently dropped.
5. Written to `wiki/private/<topic>/<Title>.md`; `index.md` and `log.md` updated.

**Commands (run from the `tools/` directory):**

```bash
# Process all PDFs in wiki/source/
python3 -m ingest run

# Process a single file
python3 -m ingest run ../wiki/source/mypaper.pdf

# Process a single file with an explicit topic folder
python3 -m ingest run ../wiki/source/mypaper.pdf --topic finance

# Re-process the whole vault with a reasoning model (re-clean + re-link + rebuild index.md)
python3 -m ingest refresh

# Dry run — preview without writing
python3 -m ingest refresh --dry-run

# Only one note (matched by filename substring)
python3 -m ingest refresh --only "Note Title"

# Skip the cleanup pass, only redo links and index
python3 -m ingest refresh --skip-clean

# Health check — orphans, broken links, missing frontmatter
python3 -m ingest lint
```

**Obsidian:** open `wiki/private/` as a vault. Note filenames use spaces (matching frontmatter title) so `[[wikilinks]]` resolve correctly in the graph view.

---

## Environment variables

All go in `.env.local` (never committed).

```dotenv
# LLM provider for answer generation and ingestion pipeline
LLM_PROVIDER=gemini          # or: openai
GOOGLE_API_KEY=...           # required when LLM_PROVIDER=gemini
# OPENAI_API_KEY=...         # required when LLM_PROVIDER=openai

# OpenAI key for embeddings — independent of LLM_PROVIDER.
# Required for hybrid retrieval (BM25 + semantic). Falls back to BM25-only if unset.
OPENAI_API_KEY=...

# Optional: override the fast model used for per-note cleanup and wikilinks
# LLM_MODEL=gemini-2.0-flash-lite     # default for gemini
# LLM_MODEL=gpt-4o-mini               # default for openai

# Optional: override the reasoning model used by `ingest refresh`
# LLM_REASONING_MODEL=gemini-2.5-pro
# LLM_REASONING_MODEL=gpt-5.4-2026-03-17
```

---

## Python setup (ingestion pipeline only)

```bash
# Gemini (default)
pip install google-genai python-frontmatter python-dotenv

# OpenAI
pip install openai python-frontmatter python-dotenv
```

MinerU must be installed separately and available at `/opt/anaconda3/bin/mineru` (update `tools/ingest/mineru_run.py:MINERU_BIN` if the path differs).

---

## Typical workflow

```bash
# 1. Add or edit notes in wiki/public/ or wiki/private/
# 2. Regenerate the index
pnpm index

# 3. Build and deploy
pnpm build
git push
```

For private note ingestion:
```bash
# Drop PDFs into wiki/source/, then:
cd tools
python3 -m ingest run
pnpm index   # rebuild index to include new notes
```
