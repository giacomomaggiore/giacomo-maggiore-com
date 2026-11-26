# Data boundaries and services

## Data destinations

| Source | Allowed destinations | Never |
| --- | --- | --- |
| Public blog and note MDX | Public pages and metadata; eligible text in `/ask` | Unrequested edits or AI-authored public copy |
| Private vault | Private Git repository, generated index, `/ask` retrieval/context; private citations by title only | Public routes, metadata, sitemap, feed, logs, or verification artifacts |
| Public comments | Dedicated database, comments API/UI, private moderation and backup workflows | Wiki, `/ask`, public content artifacts, telemetry, or raw payload logs |
| Internal notebooks | Local workspace only | Git, build inputs, deployment, public assets, retrieval, telemetry |

The owner uses "private" to mean unpublished, not inherently sensitive. The private vault and generated index are tracked, so the repository must stay private. Do not inspect either as part of a general repository audit or expose excerpts in diagnostics. Never inspect local credential values or send secrets or sensitive data to external services. Real note content is not a test fixture.

The owner authorizes the existing OpenAI workflows to process eligible private-note text: a requested full index refresh can send it for embeddings, and `/ask` can send selected passages when answering. This does not authorize publication, logging, unrelated external uses, or bypassing the approval required before editing private notes.

## Wiki index and deployment

- [`scripts/build-wiki-index.ts`](../../scripts/build-wiki-index.ts) reads public notes, published English blog posts, and private Markdown/MDX. Its private walk excludes `images/`, names starting with `_`, and the `index`/`log` notes. Notebook paths are not input roots. Preserve the explicit roots in [`lib/wiki/paths.ts`](../../lib/wiki/paths.ts). Index entries for private notes use `url: null`. Keep secrets and sensitive data out of indexed content; the indexer does not screen for them.
- Query vectors and stored vectors use the same `EMBEDDING_MODEL` (`text-embedding-3-small`). Normal indexing reads `.env.local` and can call OpenAI if a key is present; the existing `--reuse-embeddings` mode only embeds changed public entries and fails if a private vector cannot be reused. Follow the applicable approval and data handling rules before indexing; never rebuild just to test an unrelated change. A stale index means `/ask` will not see updated content.
- The documented Vercel build command is `next build`, not `pnpm build`: it uses the committed index and does not invoke the indexer. Verify remote settings separately if needed. Keep the inline `path.join(process.cwd(), 'lib', 'wiki-index.generated.json')` next to `fs.readFileSync` in the `/api/ask` route for deployment tracing. Do not move the path into a separate module or switch that read to `fs/promises`.
- [`scripts/assert-no-private-pages.ts`](../../scripts/assert-no-private-pages.ts) rejects app references to `WIKI_PRIVATE_DIR` and private index entries with URLs. This is a targeted check, not proof against every leak.

## Integration contracts

Only environment variable names belong in docs. See [local setup](../../README.md#setup) for the configuration list and [Testing](testing.md) for isolated checks.

| Integration | Contract |
| --- | --- |
| OpenAI | `OPENAI_API_KEY` enables the answer and an embedding attempt. Without it, retrieval can still rank by keyword, but answers require a configured model/client. Set `LLM_MODEL` explicitly; the code default may not be available on the owner's project. `LLM_PROVIDER` and `LLM_REASONING_MODEL` are not read. Never expose upstream errors to visitors. |
| PostHog | Browser analytics use `NEXT_PUBLIC_POSTHOG_KEY`/`NEXT_PUBLIC_POSTHOG_HOST`; server metrics use the existing `POST_HOG_API_KEY` spelling and optional `POST_HOG_PROJECT_ID`/`POSTHOG_API_HOST`. Metrics may be unavailable without credentials. Keep comment capture and replay network exclusions in place. |
| Resend | The newsletter requires `RESEND_API_KEY`, `RESEND_AUDIENCE_ID` and `NEWSLETTER_FROM_EMAIL`. `NEWSLETTER_UNSUBSCRIBE_SECRET` falls back to the API key; changing signing credentials affects existing links. `NEXT_PUBLIC_SITE_URL` can set the origin used in emails. |
| Neon | `DATABASE_URL` is server-only. Runtime needs only schema access and read/insert on `comments`; use a different privileged connection for moderation or migrations. Do not copy live comments into non-production. Missing Neon must not break article pages. |
| Google Analytics and jsDelivr | Site-wide analytics and MathJax script references are in the layout. Hydrated browser checks can reach third parties unless outbound requests are blocked. |

Do not run a local app with production credentials. A local Neon CLI operation can link a branch or replace local env values; inspect configuration changes before allowing cloud actions. See the comments [operating notes](../../README.md#public-comments) for migration, role, moderation, and recovery procedures. Builds and public requests must never run a migration.
