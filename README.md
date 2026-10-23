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
  private/         # private vault — searchable, never a web page (tracked in git, so keep the repo private)

lib/wiki/          # shared code: reading notes, search, AI answers
lib/               # shared helpers: site URLs, dates, rate limit, PostHog, newsletter
scripts/           # search index builder, safety checks, UI snapshot tool, chart scripts
app/               # pages and components (blog, notes, books, resources, /ask, ...)
app/api/           # server endpoints: /api/ask, /api/posthog, /api/newsletter
```

---

## Skills (automated helpers)

Four helpers live in `.github/skills/`. In your AI coding tool, type `/` and pick one, or use its slash command directly:

- **`/update-links`** — reviews requested private notes for meaningful Obsidian links and previews every proposed edit before asking for approval.
- **`/clean-markdown`** — previews conservative grammar, OCR, and Markdown repairs for one private note, then applies them only after approval.
- **`/update-embeddings`** — rebuilds the search index and the AI embeddings (runs `pnpm index`).
- **`/check-markdown-latex`** — proofreads one Markdown file for grammar, Markdown, and LaTeX errors without changing its content.

`/update-links` and `/clean-markdown` never touch published blog posts or notes. No helper commits or pushes changes without asking first.

---

## How `/ask` works

1. You type a question.
2. The system searches all notes two ways at once — by keyword, and by meaning (AI similarity) — then combines the results.
3. The best passages of the 8 best-matching notes are handed to an AI, which answers using only those passages (about 30,000 characters at most, to keep it cheap and fast).
4. Public notes appear as clickable links; private notes are mentioned by title only.
5. If no `OPENAI_API_KEY` is set, search still works by keyword alone — just without the AI matching.
6. To limit cost, each visitor can ask up to 15 questions per minute.

---

## Setup

**Environment variables** — put these in `.env.local` (never committed to git). Set the same ones in Vercel.

```dotenv
OPENAI_API_KEY=...                 # AI answers and semantic search
LLM_MODEL=...                      # model used for answers (required: the built-in default may not be enabled for your OpenAI project)
NEXT_PUBLIC_POSTHOG_KEY=...        # analytics in the browser
NEXT_PUBLIC_POSTHOG_HOST=...       # PostHog host for the browser
POST_HOG_API_KEY=...               # page-view counters (PostHog API)
RESEND_API_KEY=...                 # newsletter
RESEND_AUDIENCE_ID=...             # newsletter list
NEWSLETTER_FROM_EMAIL=...          # sender of the confirmation and welcome emails (a verified Resend domain)
NEWSLETTER_UNSUBSCRIBE_SECRET=...  # signs confirmation and unsubscribe links
NEXT_PUBLIC_SITE_URL=...           # public site address, used in email links

# Optional overrides — leave commented out to use the default
# POST_HOG_PROJECT_ID=...          # PostHog project used for the counters
# POSTHOG_API_HOST=...             # PostHog API address (default https://us.posthog.com)
```

---

## Everyday commands

```bash
pnpm dev            # run the website locally
pnpm index          # rebuild the search index after adding/editing notes
pnpm typecheck      # check the TypeScript code
pnpm check:private  # check that no private note can become a page
pnpm build          # build the website (also rebuilds the index automatically)
```

Typical flow: edit or add a note → `pnpm index` → `pnpm build` → `git push`.

Vercel builds with the search index stored in git, so always commit the rebuilt index (`lib/wiki-index.generated.json`) together with your notes.
