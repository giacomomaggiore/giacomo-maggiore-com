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
  source/          # reserved local source workspace (not used by this project)
  archive/         # reserved local archive workspace (not used by this project)
  public/
    notes/         # published notes  ->  /notes/[slug]
    blog/          # published blog posts  ->  /blog/[slug]
  private/         # private vault — searchable, never a web page (not saved in git)

lib/wiki/          # shared code: reading notes, search, AI answers
scripts/           # build-time scripts (search index builder, safety checks)
app/               # the /ask page and its API
```

---

## Skills (automated helpers)

Two helpers live in `.github/skills/`. In your AI coding tool, type `/` and pick one, or use its slash command directly:

- **`/update-links`** — reviews requested private notes for meaningful Obsidian links and previews every proposed edit before asking for approval.
- **`/clean-markdown`** — previews conservative grammar, OCR, and Markdown repairs for one private note, then applies them only after approval.

They never touch published blog posts or notes. Neither helper commits or pushes changes without asking first.

---

## How `/ask` works

1. You type a question.
2. The system searches all notes two ways at once — by keyword, and by meaning (AI similarity) — then combines the results.
3. The 5 best-matching notes are handed to an AI, which answers using only those notes.
4. Public notes appear as clickable links; private notes are mentioned by title only.
5. If no `OPENAI_API_KEY` is set, search still works by keyword alone — just without the AI matching.

---

## Setup

**Environment variables** — put these in `.env.local` (never committed to git):

```dotenv
OPENAI_API_KEY=...     # required for AI answers and semantic search

# Optional override — leave commented out to use the default
# LLM_MODEL=...        # model used for answers
```

---

## Everyday commands

```bash
pnpm index    # rebuild the search index after adding/editing notes
pnpm build    # build the website (also rebuilds the index automatically)
```

Typical flow: edit or add a note → `pnpm index` → `pnpm build` → `git push`.
