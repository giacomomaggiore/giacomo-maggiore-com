# giacomo-maggiore-com

> This file (except this line) is 100% AI-generated. Thanks Claude.

My personal website — [giacomomaggiore.com](https://giacomomaggiore.com). Built with Next.js, deployed on Vercel.

It's actually three things in one:

- **A website** — public blog posts and notes.
- **A private notebook** — an Obsidian vault of reading notes, stored as files, never published.
- **A personal AI assistant** — ask it a question, it answers using only my own notes.

---

## Why this exists

- I like keeping track of what I read and study. First notebooks, then an iPad, then Notion — now this.
- The goal: one place for everything (website, public notes, private notes, AI assistant) that I fully own.
- The belief behind it: reading something isn't the same as knowing it. Notes only pay off if they're organized and connected to each other.

**What AI does here:** cleans up OCR text, fixes formatting, links related notes together, sorts files into folders. It never writes the notes themselves — I do that. AI only handles the boring, mechanical parts.

**JackGPT** is the chatbot at [/ask](https://giacomomaggiore.com/ask). Ask it a question and it searches my notes, then answers using only what's actually in them — with sources.

---

## The three parts of this repo

1. **Website** — blog posts and notes, rendered as pages (`/blog/...`, `/notes/...`).
2. **Private vault** — `wiki/private/`. My personal notes, stored as files, never shown on the website.
3. **Ask feature** — the `/ask` page. Search everything (public + private) and get an answer with sources.

**Rule that never changes:** private notes are never turned into web pages. The only way to see them is by asking a question through `/ask`.

---

## Folder structure

```
wiki/
  source/          # drop PDFs here before processing (not saved in git)
  public/
    notes/         # published notes  ->  /notes/[slug]
    blog/          # published blog posts  ->  /blog/[slug]
  private/         # private vault — searchable, never a web page (not saved in git)

lib/wiki/          # shared code: reading notes, search, AI answers
scripts/           # build-time scripts (search index builder, safety checks)
tools/ingest/      # the Python pipeline that turns PDFs into notes
app/               # the /ask page and its API
```

---

## Skills (automated helpers)

Three helpers live in `.github/skills/`. In your AI coding tool, type `/` and pick one, or use its slash command directly:

- **`/update-links`** — finds notes that are genuinely related and links them together. First, AI similarity search shortlists likely matches (fast, cheap); then a smarter AI double-checks that shortlist and writes a short reason for each link it keeps.
- **`/update-embeddings`** — rebuilds the search index, so new or edited notes become findable through `/ask`.
- **`/clean-markdown`** — fixes grammar, OCR mistakes, and formatting in one note.

None of them touch published blog posts. None of them commits or pushes changes without asking first.

---

## How `/ask` works

1. You type a question.
2. The system searches all notes two ways at once — by keyword, and by meaning (AI similarity) — then combines the results.
3. The 5 best-matching notes are handed to an AI, which answers using only those notes.
4. Public notes appear as clickable links; private notes are mentioned by title only.
5. If no `OPENAI_API_KEY` is set, search still works by keyword alone — just without the AI matching.

---

## Turning PDFs into notes

Drop a PDF into `wiki/source/`, then run the pipeline. It will:

- extract the text (fully local, no cloud)
- figure out which topic folder it belongs to
- clean up OCR mess and formatting
- link it to related existing notes
- save it into `wiki/private/`

```bash
cd tools
python3 -m ingest run                 # process every PDF in wiki/source/
python3 -m ingest run file.pdf        # process just one file
python3 -m ingest refresh             # re-clean and re-link every existing note
python3 -m ingest refresh --dry-run   # preview only — changes nothing
python3 -m ingest lint                # check for broken links, missing info, etc.
```

---

## Setup

**Environment variables** — put these in `.env.local` (never committed to git):

```dotenv
OPENAI_API_KEY=...     # required for every AI feature: answers, cleanup, linking, search
LLM_PROVIDER=openai

# Optional overrides — leave commented out to use the defaults
# LLM_MODEL=...              # model used for answers, note cleanup, and linking
# LLM_REASONING_MODEL=...    # smarter model used for the vault-wide re-link pass
# LLM_EMBEDDING_MODEL=...    # model used for search and link similarity (default: text-embedding-3-small)
```

**Python setup** (only needed for the PDF pipeline):

```bash
pip install openai python-frontmatter python-dotenv
```

MinerU (the PDF-to-text tool) must be installed separately.

---

## Everyday commands

```bash
pnpm index    # rebuild the search index after adding/editing notes
pnpm build    # build the website (also rebuilds the index automatically)
```

Typical flow: edit or add a note → `pnpm index` → `pnpm build` → `git push`.
