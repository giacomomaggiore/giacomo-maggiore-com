# Project Guidance

Next.js 14 (App Router) personal website, [giacomomaggiore.com](https://giacomomaggiore.com), deployed on Vercel. The repo is also an Obsidian vault that powers an AI assistant at `/ask`. Read this file fully before changing anything.

## Hard rules

1. **The UI, UX and frontend are frozen.** Rendered HTML, CSS, copy and client behavior must stay identical, on Vercel and on localhost. Refactors are fine only if `Verify the UI is unchanged` (below) shows no diff.
2. **Public content is human-authored and AI-free.** Do not edit `wiki/public/notes/` or `wiki/public/blog/` unless the user explicitly asks or an active skill authorizes it.
3. **Ask for approval before editing anything under `wiki/private/`**, even when a retained skill requests it.
4. **Private notes never become a public route, page, metadata, feed, sitemap entry or log line.** The only way to reach them is `/ask`, and they are cited by title only.
5. **Never reveal or commit secrets** (`.env.local`, `.vercel/`, API keys). Read env var *names* only.
6. **Do not commit, push or deploy** unless the user asks for that specific action.
7. **Preserve unrelated user changes.** The working tree may contain edits you did not make.
8. Ask before running `pnpm build` (it also runs the indexer, which calls OpenAI). `pnpm index` is allowed when needed.
9. The old MinerU/PDF ingestion pipeline is gone. Do not reintroduce it, Python ingestion commands or MinerU dependencies. `wiki/source/` and `wiki/archive/` are reserved, git-ignored local folders.

## Repository map

| Path | What it is |
| --- | --- |
| `app/` | Pages, API routes, React components (App Router) |
| `app/api/ask/route.ts` | `/api/ask`: rate limit, hybrid retrieval, streamed LLM answer |
| `app/api/posthog/route.ts` | `/api/posthog`: cached PostHog stats for the view counters |
| `app/api/newsletter/` | Newsletter signup (`route.ts`), signed confirmation link (`confirm/route.ts`) and signed unsubscribe link, GET click or one-click POST (`unsubscribe/route.ts`) |
| `app/components/` | `ContentList` (blog/notes list), `ArticlePage` (post/note body), `stats` (PostHog counters), `mdx` (MDX renderer), `AskChat`, `nav`, `footer` |
| `app/blog/`, `app/notes/` | Pages plus `utils.ts` readers for each collection |
| `lib/site.ts` | `PRODUCTION_URL` and `baseUrl` (production vs localhost) |
| `lib/dates.ts` | `formatDate`, `byPublishedDesc` |
| `lib/seo.ts` | `articleMetadata` (title, canonical, Open Graph) |
| `lib/rate-limit.ts` | In-memory per-IP limiter, `getClientIp`, `tooManyRequests` |
| `lib/posthog.ts` | Server HogQL queries with a 60 s in-memory cache |
| `lib/newsletter.ts` | Resend client, email validation, HMAC confirm/unsubscribe links, contact creation, confirmation and welcome emails |
| `lib/wiki/` | `paths` (all content paths), `frontmatter`, `mdx-files` (readers), `retrieve` (BM25 + embeddings), `passages` (picks the relevant excerpts of each note), `llm` (prompt + streaming), `openai` (shared client, embedding model) |
| `lib/wiki-index.generated.json` | Generated search index, committed (~4 MB) |
| `scripts/build-wiki-index.ts` | Builds the index; embeds notes when `OPENAI_API_KEY` is set |
| `scripts/assert-no-private-pages.ts` | Fails if `app/` references `WIKI_PRIVATE_DIR` or a private note has a URL |
| `scripts/snapshot-ui.mjs` | Saves normalized HTML of every route for before/after diffs |
| `scripts/generate-*.py` | One-off matplotlib chart generators for blog images, not part of the build |
| `wiki/public/notes/` | Published notes, `/notes/[slug]`, file `NN-name.mdx` |
| `wiki/public/blog/` | Published posts, `/blog/[slug]`, files `NN-name.en.mdx` and `NN-name.it.mdx` |
| `wiki/private/` | Private vault, searchable through `/ask` only |
| `.github/skills/` | Retained skills (see below) |

Imports use `baseUrl: "."`, e.g. `import { baseUrl } from 'lib/site'` or `'app/components/ContentList'`. Shared logic belongs in `lib/`; do not copy helpers between routes.

## How things work

- **Pages.** MDX files are read from disk with `lib/wiki/mdx-files.ts` (parsed files are cached in memory in production only). Frontmatter has `title`, `publishedAt`, `summary`. `app/components/mdx.tsx` renders MDX with KaTeX; `<Table data={{ headers, rows }} />` blocks are converted to Markdown tables first. Slugs from URLs are validated (`isSafeSlug`) before touching the filesystem.
- **Language.** `middleware.ts` sets a `lang` cookie (`en`/`it`) on `/blog/*`. Blog pages read it; the list defaults to `en`, a post defaults to `it`. Notes are English only.
- **`/ask`.** Question (max 500 chars) → rate limit (15/min/IP) → embed the query (`text-embedding-3-small`) while loading the index → `retrieveHybrid` (BM25 + cosine similarity fused with RRF, top 8; keyword-only when there is no embedding) → `selectContext` keeps only the best-matching passages of those notes (max `CONTEXT_BUDGET` = 30,000 characters, at least one passage per note) → stream the answer from OpenAI (first line is JSON citations, the rest is Markdown). Closing the connection aborts the OpenAI call. Sources shown to the visitor are exactly the notes the model received. Query and index **must** use the same embedding model (`EMBEDDING_MODEL` in `lib/wiki/openai.ts`).
- **Search index.** `scripts/build-wiki-index.ts` indexes public notes, `*.en.mdx` blog posts and every `.md`/`.mdx` under `wiki/private/` (skips `images/`, `_*`, `index`, `log`). Private notes get `url: null`.
- **View counters.** Client components in `app/components/stats.tsx` POST to `/api/posthog`; the route runs HogQL against PostHog and caches each query for 60 s. Only blog/notes URLs on the site's own origin are accepted (strict regex, prevents HogQL injection).
- **Newsletter (double opt-in).** The footer form posts to `/api/newsletter`: honeypot field, consent check, 5 signups per 10 min per IP and 3 confirmation emails per hour per address. It only sends a confirmation email (HMAC-signed link, valid 48 h, no contact yet) and redirects to `/newsletter/check-inbox` (own origins only). Opening the link (`/api/newsletter/confirm`) creates the Resend contact (or switches an unsubscribed one back on), sends the welcome email (plain-text part, `List-Unsubscribe` one-click headers, signed unsubscribe link) and redirects to `/newsletter/confirmed`; a bad or expired link goes to `/newsletter/expired`. Those three pages are `noindex` and not in the sitemap. Confirm links are GET, so a mail scanner that prefetches links can confirm an address.

## External services

| Service | Used for | Env vars (names only) | Code | If it is missing or fails |
| --- | --- | --- | --- | --- |
| OpenAI | Answers (`LLM_MODEL`) and embeddings | `OPENAI_API_KEY`, `LLM_MODEL` (**must be set**, locally and in Vercel: the code default `gpt-4o-mini` returns 403 on the owner's OpenAI project) | `lib/wiki/openai.ts`, `lib/wiki/llm.ts` | No key: keyword-only search, answer shows an error line. Never echo upstream error text to users. |
| PostHog (browser) | Analytics events | `NEXT_PUBLIC_POSTHOG_KEY`, `NEXT_PUBLIC_POSTHOG_HOST` (US) | `app/instrumentation-client.js` | No key: analytics silently off |
| PostHog (server API) | View counters via HogQL | `POST_HOG_API_KEY`, optional `POST_HOG_PROJECT_ID`, optional `POSTHOG_API_HOST` | `lib/posthog.ts`, `app/api/posthog/route.ts` | Counters show 0 or an error line. Env names keep the odd `POST_HOG_` spelling because Vercel uses them. |
| Resend | Newsletter contacts, confirmation and welcome emails | `RESEND_API_KEY`, `RESEND_AUDIENCE_ID`, `NEWSLETTER_FROM_EMAIL`, `NEWSLETTER_UNSUBSCRIBE_SECRET` (falls back to the API key), `NEXT_PUBLIC_SITE_URL` | `lib/newsletter.ts`, `app/api/newsletter/**` | Missing audience or from-address: signup returns 500 (no confirmation email can be sent). Failed welcome email: logged, subscription kept. |
| Google Analytics | Page analytics (`G-6E5X8EMEPL`) | none | `app/layout.tsx` | n/a |
| jsDelivr CDN | MathJax script loaded on every page | none | `app/layout.tsx` | Pages still render (KaTeX does the math) |
| Vercel | Hosting, `next build`, project settings in the dashboard | none in code | n/a | n/a |

`LLM_PROVIDER` and `LLM_REASONING_MODEL` may exist in `.env.local` but **no code reads them**; the LLM layer is OpenAI-only today. Add a provider switch only if the user asks (they once wanted that flexibility).

When mocking services for tests, the SDKs honor `OPENAI_BASE_URL` and `RESEND_BASE_URL`, and `/api/posthog` honors `POSTHOG_API_HOST`. Never hit real services with dummy or real keys just to test.

## Deployment model (important)

- Vercel's project setting (last `vercel pull`, March 2026, verify in the dashboard) is `next build`, **not** `pnpm build`. So `prebuild` does not run on Vercel: production serves the **committed** `lib/wiki-index.generated.json`.
- After changing any note, blog post or private note: run `pnpm index`, then commit the regenerated index. A stale index means `/ask` does not know the new content. The index was last rebuilt on 2026-10-23 (71 notes); check its `generatedAt` and rebuild when content has changed since.
- `wiki/private/` and the index (which contains private note text) are **tracked in git today**, although older docs claimed otherwise. The GitHub repo must therefore stay private. Untracking them would break `/ask` in production until the index is delivered another way.
- `/api/ask` reads the index with an inline `path.join(process.cwd(), 'lib', 'wiki-index.generated.json')` next to `fs.readFileSync` so Vercel's file tracing bundles it. Do not move that path into another module or switch to `fs/promises`.
- Production Node is 22.x (`engines`); local Node may be 20.x. Keep code compatible with both.

## Commands

```bash
pnpm dev            # local dev server (localhost:3000)
pnpm typecheck      # tsc --noEmit; must stay clean
pnpm check:private  # private-page assertion (also part of pnpm build)
pnpm index          # rebuild the search index; calls OpenAI embeddings if a key is set; rewrites a tracked file
pnpm build          # index + assertion + next build (ask first)
```

Prefer the smallest relevant validation. Do not install or bump dependencies unless validation proves one is missing. Pinned on purpose: Next 14.1.4, React 18.2, Tailwind 4 alpha.

## Verify the UI is unchanged

Run this for any change to `app/`, `lib/`, `middleware.ts` or `next.config.js`. It needs no env vars and calls no external service. Stop `pnpm dev` first (dev and build share `.next`).

```bash
# 1. baseline = last commit in a throwaway worktree (older commits need RESEND_API_KEY=x to build)
git worktree add /tmp/site-base HEAD && ln -s "$PWD/node_modules" /tmp/site-base/node_modules
(cd /tmp/site-base && pnpm exec next build)
# 2. current working tree
pnpm exec next build
# 3. serve both, snapshot both, compare
(cd /tmp/site-base && pnpm exec next start -p 3999 &)
pnpm exec next start -p 4000 &
sleep 5
node scripts/snapshot-ui.mjs http://localhost:3999 /tmp/snap-before
node scripts/snapshot-ui.mjs http://localhost:4000 /tmp/snap-after
diff -r /tmp/snap-before /tmp/snap-after && echo identical
# 4. clean up: stop both servers (lsof -ti :3999 :4000 | xargs kill), then
git worktree remove --force /tmp/site-base
```

- Use `pnpm exec next build`, not `pnpm build`, so the OpenAI-calling indexer is skipped.
- The snapshot covers every route, the blog in `none`/`en`/`it` cookie variants, redirects, feed, sitemap and robots. Compiled CSS lives in `.next/static/css/`; a diff there should only ever remove rules for classes you deleted.
- For client behavior, dump the hydrated DOM with headless Chrome (`--headless=new --dump-dom --virtual-time-budget=6000 <url>`) on both builds and diff. Point `POSTHOG_API_HOST` at a local mock to exercise the counters.

## Conventions

- English for code, comments, docs and new user-facing text. Short one-line comments that say *why*; match the surrounding style.
- Keep changes focused and readable. No unrelated refactors. Update `README.md` and this file when commands, structure or behavior change.
- New server logic goes in `lib/`; API routes stay thin (validate, call `lib/`, shape the response).
- Route handlers must not construct SDK clients at module load (builds would need secrets); create them lazily like `getResend()` / `getOpenAI()`.

## Preserved quirks (do not "fix" without asking)

These look like bugs but are current, user-visible behavior.

- **"Page views"** on posts and notes count only PostHog `$pageview` events, and `posthog.init` uses `capture_pageview: 'history_change'` so in-site navigation counts too. Since 2026-10-23 they no longer include clicks, page leaves or the old debug `test_event`, so the displayed numbers dropped. Do not switch the query back to "all events".
- Blog views are counted on the production URL even on localhost; notes use `baseUrl`, so locally they show 0.
- `lang` cookie: unsupported browser languages become Italian; list and post defaults differ (see above). A first visit renders with the cookie from the *request*, so the first response may use the default.
- `next.config.js` `/ingest` rewrites point to PostHog EU but nothing uses them (the browser calls the US host directly). `skipTrailingSlashRedirect` also affects trailing-slash URLs site-wide.
- MathJax (CDN) loads on every page next to KaTeX but typeset nothing on any note or blog page when checked on 2026-10-23 (it only injects a stylesheet). It is a removal candidate, but only with a before/after diff and the user's approval.
- Visible copy is frozen with the UI. Typos were fixed on 2026-10-23 with the user's approval; do not edit copy otherwise.
- `<Table>` data in MDX is evaluated with `Function(...)` in `mdx.tsx`. This is acceptable only because content is trusted and repo-owned.
- `/og` is an unused starter-template route.
- `/blog` and `/notes` ship the full text of every item to the browser to power client-side search.

## Retained skills (`.github/skills/`)

- `clean-markdown`: previews and applies conservative cleanup to **one private note**, approval-gated.
- `update-links`: previews and approval-gates Obsidian wikilink curation in the **private vault**; never reads public notes.
- `update-embeddings`: runs `pnpm index` and reports the result (note count, embeddings created or skipped). No commit unless asked.
- `check-markdown-latex`: proofreads one `.md`/`.mdx` file (grammar, Markdown, LaTeX). It can target public files, so treat that as explicit user authorization for that single file only.
