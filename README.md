# giacomo-maggiore-com

> This file (except this line) is 100% AI-generated. Thanks Claude.

[giacomomaggiore.com](https://giacomomaggiore.com) is a personal website, an Obsidian vault, and a note-powered assistant in one repository. The site uses Next.js 14 (App Router), React, TypeScript, Tailwind CSS, and MDX. Vercel hosts the site; GitHub hosts the private repository.

## Why this exists

- I like keeping track of what I read and study. First notebooks, then an iPad, then Notion — now this.
- The goal: one place for everything (website, public notes, private notes, AI assistant) that I fully own.
- The belief behind it: reading something isn't the same as knowing it. Notes only pay off if they're organized and connected to each other.

**What AI does here:** cleans up OCR text, fixes formatting, links related notes together, sorts files into folders. It never writes the notes themselves — I do that. AI only handles the boring, mechanical parts.

## What the repository does

- **Public website.** The blog and notes are rendered from human-authored MDX. Blog posts can be available in English, Italian, or both. The site also has a books list, resources, a CV, an RSS feed, and a sitemap. The blog and notes have searchable listings and view counters. Inline math has no scrollbars; wide display equations scroll horizontally.
- **Comments and newsletter.** Published blog posts have public, plain-text threads with one level of replies; note pages do not show comments. Newsletter signup is double opt-in: the email link must be opened before the address joins the list.
- **Private reading vault.** Obsidian organizes local Markdown files. Private notes do not have public pages and are excluded from public listings, the feed, and the sitemap. Their information can still appear in answers from the public `/ask` page, so this is not a place to store secrets.
- **JackGPT.** The [/ask](https://giacomomaggiore.com/ask) assistant searches the generated index of eligible public and private notes and answers with sources. Public sources have links; private sources are cited by title only.
- **Local analysis.** Python notebooks, inputs, and outputs under `wiki/notebooks/` are internal. They are ignored by Git and excluded from Vercel CLI uploads, builds, and `/ask`.

## Folder structure

```
wiki/
  source/          # reserved local source workspace (not used by this project)
  archive/         # reserved local archive workspace (not used by this project)
  notebooks/       # internal Python analysis (local-only, ignored; never run in production)
  public/
    notes/         # published notes  ->  /notes/[slug]
    blog/          # published blog posts  ->  /blog/[slug]
  private/         # private vault — searchable, never a web page (tracked in git, so keep the repo private)

app/               # Next.js pages, shared components, and API endpoints
lib/               # shared application logic and provider clients
lib/wiki/          # MDX readers, search, and answer generation
lib/wiki-index.generated.json  # checked-in search index; contains private text
migrations/        # manual Postgres schema migrations for comments
public/            # assets served by the website
scripts/           # index builder, privacy check, UI snapshots, and chart generators
tests/             # integration tests; unit tests also live beside app and lib code
docs/agent/        # architecture, service contracts, and implementation/testing procedures
```

The production build uses the checked-in index. **Keep the GitHub repository private:** both the vault and the generated index are tracked. For code entry points and feature behavior, see the [architecture overview](docs/agent/architecture.md).

## Agent guidance and local analysis

This README is the overview for people. [AGENTS.md](AGENTS.md) is the shared source of instructions for coding agents. [CLAUDE.md](CLAUDE.md) is still useful: it is Claude Code's entry point, imports the shared instructions, and describes the Claude-only advisory hook. [GitHub Copilot](.github/copilot-instructions.md) has its own short entry point. Detailed procedures stay in [the agent reference docs](docs/agent/), rather than being duplicated here.

Keep article-supporting notebooks, analysis inputs, and outputs under the ignored `wiki/notebooks/` directory. See the [local notebook procedure](docs/agent/notebooks.md) for safe execution and approval boundaries. The [trend-following dashboard export](docs/agent/notebooks.md#trend-following-dashboard-export) documents the separately approved browser dataset and Python parity checks.

---

## Skills (automated helpers)

Four helpers live in `.github/skills/`. In clients that discover that directory, select the skill by name or use the matching slash command:

- **`/update-links`** — reviews requested private notes for meaningful Obsidian links and previews every proposed edit before asking for approval.
- **`/clean-markdown`** — previews conservative grammar, OCR, and Markdown repairs for one private note, then applies them only after approval.
- **`/update-embeddings`** — rebuilds the search index and the AI embeddings (runs `pnpm index`).
- **`/check-markdown-latex`** — proofreads one Markdown file for grammar, Markdown, and LaTeX errors without changing its content.

`/update-links` and `/clean-markdown` never touch published blog posts or notes. No helper commits or pushes changes without asking first.

---

## How `/ask` works

1. You type a question.
2. The system searches all notes two ways at once — by keyword, and by meaning (AI similarity) — then combines the results.
3. OpenAI receives the question and selected passages from up to eight matching notes, with a total passage budget of 30,000 characters. Passages can come from private notes. Questions about Giacomo can also use the profile in the prompt.
4. All notes supplied to the model are listed as sources, whether or not the answer uses them. Public sources have links; private sources show titles only.
5. If embeddings are unavailable, retrieval falls back to keywords. Generating an answer still requires OpenAI. There is a best-effort limit of 15 questions per minute per IP, per server instance.

## External providers

This lists integrations used by the repository, not ordinary links to other sites. See the site's [privacy policy](https://giacomomaggiore.com/privacy) for how visitor data is handled.

| Provider | What it does and what it receives | Configuration |
| --- | --- | --- |
| **GitHub** | Hosts the private source repository, including the private vault and generated index. It does not serve the website. | Repository access and visibility in GitHub. |
| **Vercel** | Builds, hosts, and serves the website, including API requests and server functions. Its build uses the committed wiki index. | Build command and environment variables in Vercel. The documented production command is `next build`, not `pnpm build`. |
| **OpenAI** | Embeds the `/ask` question and generates an answer from the question and selected note passages. The index builder also sends note text for embeddings when configured; a standard rebuild can include private notes. | `OPENAI_API_KEY`, `LLM_MODEL`. |
| **Neon** | Stores public comments and replies in Postgres, including display names and moderation state. The app does not save visitor IPs in the comments table. Without a database connection, articles still load and comments are unavailable. | Server-only `DATABASE_URL` using a restricted runtime role. |
| **Resend** | Sends confirmation emails and manages newsletter contacts. Resend receives the submitted address to deliver confirmation; it adds the contact only after confirmation. | `RESEND_API_KEY`, `RESEND_AUDIENCE_ID`, `NEWSLETTER_FROM_EMAIL`; see optional signing and link settings below. |
| **PostHog** | Receives enabled browser analytics and powers server-side site and article metrics. The comments UI is marked `ph-no-capture`, and replay filters out `/api/comments` network requests. Current pages use the browser host directly; the `/ingest` proxy is not used. | `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST` for browser analytics; `POST_HOG_API_KEY` and optional project/host overrides for server metrics. |
| **Google Analytics** | Receives browser analytics via the shared site layout. | Measurement ID in [`app/layout.tsx`](app/layout.tsx); no environment variable. |
| **jsDelivr** | Serves the MathJax script requested by browsers on each page. KaTeX renders MDX math separately. | Script URL in [`app/layout.tsx`](app/layout.tsx); no account or key. |

Obsidian is used as a local vault editor, not as a hosted service required by the site. See [data and services](docs/agent/data-and-services.md) for code-level boundaries and test configuration.

## Setup

Use Node.js 22 and pnpm. From a fresh checkout, run `pnpm install`, then `pnpm dev` and open [localhost:3000](http://localhost:3000). The core site can run without provider credentials. Unconfigured features are disabled or unavailable; browser integrations configured in the layout may still load.

Add only the environment variables needed for the features you are working on. Use `.env.local` for local settings and the Vercel dashboard for deployed environments. Never commit credentials or point local development or previews at production data.

```dotenv
OPENAI_API_KEY=...                 # AI answers and semantic search
LLM_MODEL=...                      # model used for answers (required: the built-in default may not be enabled for your OpenAI project)
NEXT_PUBLIC_POSTHOG_KEY=...        # analytics in the browser
NEXT_PUBLIC_POSTHOG_HOST=...       # PostHog host for the browser
POST_HOG_API_KEY=...               # page-view counters (PostHog API)
RESEND_API_KEY=...                 # newsletter
RESEND_AUDIENCE_ID=...             # newsletter list
NEWSLETTER_FROM_EMAIL=...          # sender of confirmation emails (a verified Resend domain)
DATABASE_URL=...                   # server-only Neon runtime role for public comments

# Optional settings
# NEWSLETTER_UNSUBSCRIBE_SECRET=...  # signs email links; falls back to RESEND_API_KEY
# NEXT_PUBLIC_SITE_URL=...           # sets the site origin for newsletter email links
# POST_HOG_PROJECT_ID=...            # PostHog project used for the counters
# POSTHOG_API_HOST=...               # defaults to https://us.posthog.com
```

---

## Everyday commands

```bash
pnpm dev            # run the website locally
pnpm index          # rebuild the search index after adding/editing notes
pnpm index --reuse-embeddings  # reuse matching embeddings; only changed public notes are sent for embedding
pnpm typecheck      # check the TypeScript code
pnpm check:private  # check app references and private index URLs
pnpm exec next build  # build the site without invoking the indexer
pnpm build            # rebuild the index and build the site; agents ask first
```

For focused tests, run `pnpm exec tsx --test <test-files>`. See the [testing matrix](docs/agent/testing.md) for when to run broader checks.

## Deployment and search index

Vercel's documented `next build` command uses the [checked-in index](lib/wiki-index.generated.json). Update the index alongside eligible content changes; otherwise `/ask` will continue searching the older version. `pnpm build` invokes the indexer first and may call OpenAI. The `--reuse-embeddings` mode requires a compatible index and stops rather than sending private notes for new embeddings.

The index includes public notes, published English blog posts, and eligible private Markdown files. Blog drafts and posts without a title or valid date are excluded from the site, feed, sitemap, and index. Comments, notebooks, and reserved archive/source folders are not indexed.

## Public comments

Each published blog post has a single public thread; translations share it. Note pages do not show comments; existing note threads remain in the database and the API still accepts note keys. Comments display with right-aligned dates and reply controls. The composer has name and auto-growing message fields; Post submits directly. Comments are plain text, published immediately, and not indexed by `/ask`. The browser remembers only the last successfully posted display name. See [External providers](#external-providers) for the PostHog controls. The best-effort limit is 10 submissions per IP per 10 minutes per serverless instance; it is not a global spam guarantee. Names are NFKC-normalized, trimmed and lowercased; comparison also removes spaces, dots, underscores, hyphens and common zero-width characters. Names containing `giacomo` or `maggiore`, plus `jackmaggiore` and `gmag`, are reserved. This may reject unrelated names containing those sequences and does not catch every impersonation.

Before launch, review the privacy page with the owner for public submissions, local name storage, Neon, transient abuse controls, moderation and backups. Verify current Neon Free quotas, restore limits, region and residency. Use separate empty databases or branches for production and non-production; never copy production comments into previews. Provisioning and production migration require separate approval.

`neon.ts` contains the Neon CLI policy; `.neon` is an ignored local project link. The current Neon CLI requires Node 20.19 or newer. Check `neon config plan` before `neon deploy`: deployment can modify the linked branch and, by default, replace local Neon variables. Use `--no-env-pull` when local credentials must stay unchanged. Neon CLI setup does not configure Vercel environment variables. Never use a privileged migration connection as the application runtime role.

The production `comments_runtime` role has `SELECT` and `INSERT` on `public.comments`, but no update, delete, schema-creation or Neon administrator privileges. Set that sensitive `DATABASE_URL` only in Vercel Production; a new deployment is needed to pick up changes. If Neon CLI initialization left production connection variables in `.env.local`, remove them before using the app locally. Leave the connection unset or use a separate empty development database.

Apply `migrations/001_comments.sql` once through a privileged connection, first in a disposable test database. Give the application's `DATABASE_URL` a separate role with only schema usage and `SELECT` and `INSERT` on `comments`; revoke any broader inherited or public privileges. Verify it cannot update, delete, or alter the table. Never apply migrations from a build or request. To roll back the feature, remove `DATABASE_URL` or revert the application code while keeping the table and data; comments will be unavailable, not deleted.

Moderate in the Neon SQL Editor with one atomic update, using the actual comment ID:

```sql
UPDATE comments SET deleted_at = now(), display_name = NULL, body = NULL
WHERE id = '00000000-0000-0000-0000-000000000000';
```

Do not hard-delete comments. Keep periodic manual exports outside the repository in a private location, test recovery, and reconcile all subsequent deletions before reopening a restored backup. Backups may retain removed content.

Run the isolated PostgreSQL and API tests with `pnpm exec tsx --test tests/comments.test.ts`. No external database is used by these tests.
