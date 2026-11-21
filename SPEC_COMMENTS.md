# Public comments — implementation specification

**Status:** Implemented in the repository. This document preserves the original design and acceptance criteria; its prescriptive language and planning-time provider limits are historical. See [current behavior](docs/agent/architecture.md#comments) and the [operating notes](README.md#public-comments). The implementation in source is authoritative; this document does not confirm deployment or authorize provisioning, a production migration, a commit, a push, or a deployment.

## 1. Goal and scope

Add a minimal, public discussion beneath every published blog post and public note. Readers can ask questions, suggest corrections, or reply with only a display name and a message. Publish immediately after validation; Giacomo moderates afterward in the Neon dashboard. All submissions are public: there is no private-feedback mode.

Use first-party UI and APIs with **Neon Free managed Postgres**. This keeps the owner in control of the UI, data and moderation without operating a database server. A hosted widget would introduce another browser integration; GitHub-backed comments would require readers to have GitHub accounts and would need a separate public repository. Never make this website repository public. Local files, Vercel's temporary filesystem and in-memory state are not durable comment storage.

No visitor accounts, email collection or verification, pre-approval queue, self-service editing or deletion, reactions, notifications, ads, comments analytics, attachments, Markdown, math or code rendering. URLs are displayed as plain text, not clickable links. No custom moderation UI or verified owner badge in v1.

## 2. Current site and integration point

- Next.js 14 App Router, React 18, TypeScript and Tailwind; hosted on Vercel. Keep Node 20/22 compatibility and use pnpm.
- [`app/blog/[slug]/page.tsx`](app/blog/%5Bslug%5D/page.tsx) and [`app/notes/[slug]/page.tsx`](app/notes/%5Bslug%5D/page.tsx) resolve public MDX on the server and share [`ArticlePage`](app/components/ArticlePage.tsx). It renders title, publication date, view count and the MDX body. Mount one comments component **after the closing `<article>`**, outside `.prose` and before the site footer. Do not add a component to individual MDX files.
- [`app/blog/utils.ts`](app/blog/utils.ts) strips language suffixes for public paths, checks publication status, and falls back when a translation is unavailable. [`middleware.ts`](middleware.ts) sets the `lang` cookie; English and Italian use the same URL. Pass a thread key explicitly: `/blog/<canonical-slug>` with no language suffix; `/notes/<canonical-slug>` from [`app/notes/utils.ts`](app/notes/utils.ts). Use one thread for both blog translations. Never key on host, query, hash, locale, title, or `viewsUrl` (its existing behavior differs on localhost). If a slug changes later, migrate its key deliberately if the thread should follow it.
- [`ContentList`](app/components/ContentList.tsx) powers `/blog` and `/notes` listing search. Leave it, the existing MDX pipeline, article metadata and view counters unchanged. Comments must not enter any MDX file, list search, RSS feed, sitemap, `/ask`, wiki index, private path or generated content artifact.
- Keep article rendering independent of Neon. Mount a small client component and fetch when the reader approaches the comments section; do not query Neon at module load, during static generation, or on every article request. The article and unrelated routes must not depend on a configured, reachable database.

## 3. Visual design and interactions

Use the site's existing Geist typography, narrow reading column and light/dark neutral palette. Add a small `Comments` heading. Use **only a thin light-gray outline around the “Add a comment…” composer** (a neutral equivalent in dark mode); no separators, cards, outlines around posted comments or replies, avatars, or decorative animation. Use vertical whitespace to distinguish top-level comments and a small indent for replies. Keep text controls simple, with clear focus and adequately sized click/tap targets.

```text
Comments

┌──────────────────────────────────────────────┐
│ Add a comment…                       [Post]  │
└──────────────────────────────────────────────┘

alice                        Reply  1 february 2029
Thanks for the explanation.

  marco                             2 february 2029
  The example helped me too.

anna                         Reply  3 january 2029
A different comment.
```

- **Compose:** Use a real multiline textarea at the top, initially compact, with `Post` on the right. Provide an accessible label in addition to the placeholder. Accept 1–2,000 characters after trimming; reject whitespace-only input. Keep internal line breaks and wrap long words and URLs. Do not send a request on the first `Post` click: validate the draft, then reveal an **inline** display-name prompt directly beneath the composer, not a modal, pop-up or new tab. Show one active primary action at a time. Focus the name field when the prompt opens.
- **Confirm:** The inline prompt has a visible `Display name` label, `Cancel`, and `Post`. State unobtrusively that the name and comment are public. Require 1–20 characters after trimming and lowercasing automatically. Provide specific inline feedback for an invalid/reserved name or overlong body. `Cancel` closes the prompt without discarding the draft. Final `Post` submits, with a `Posting…` state and double-submit protection. Only clear the draft once the server confirms success. On failure, retain both inputs and offer a retry. Do not show an optimistic comment as published.
- **Remember name:** After a successful post, remember the normalized display name on that device in `localStorage`; prefill it in future prompts. Keep it editable and still require final confirmation. This is a functional preference, not proof of identity or a tracking identifier. Do not store drafts there. Handle unavailable storage without breaking posting.
- **Read:** Each top-level comment spans the available width. Put the name in bold on the left; group `Reply` then the regular-weight, muted date on the right. Body goes on the next line. Use semantic buttons, an accessible time element, and wrap the header on narrow screens without truncating controls or making the page scroll horizontally. Use a comment-specific formatter: English month name in lowercase, day without a leading zero, no comma (`1 february 2029`), in the **visitor's local timezone**. Keep UTC timestamps in the database; do not change [`lib/dates.ts`](lib/dates.ts) or the article date display.
- **Reply:** Open the reply composer inline beneath the selected top-level comment, before its replies, with a contextual label (`Replying to alice`, or `Replying to a deleted comment`). Use the same draft → name → confirmation flow and indent replies slightly. Multiple replies per parent; no Reply action on replies, even if deleted. Sort top-level comments newest first and replies oldest first. Refresh or reconcile from the confirmed server response so an accepted reply appears under the right parent.
- **Deleted:** Replace the name and body with muted `Deleted comment` text. Retain existing replies and allow new replies to a deleted **top-level** comment. Do not change sorting or dates when moderating. A deleted reply is also a placeholder and cannot receive replies.
- **Loading, empty and unavailable:** Distinguish initial loading from `No comments yet.` If the thread cannot load, show `Comments are temporarily unavailable.` and offer `Retry`; disable posting until the thread can be reached. Explain a failed submission without exposing internal errors; keep drafts intact and re-enable posting when it recovers. The article remains readable. Make status changes and errors accessible to screen readers without unnecessarily moving focus.

## 4. Storage and moderation

Use a checked-in SQL migration for one `comments` table, with these fields (names/types are the proposed implementation contract):

| Field | Type | Rules |
| --- | --- | --- |
| `id` | UUID | Primary key, generated by the server/database. |
| `page_key` | text | Required canonical article path, including `/blog/` or `/notes/`. |
| `parent_id` | UUID, nullable | Null for a top-level comment; otherwise references a top-level comment on the same page. Deleted top-level comments remain valid parents. |
| `display_name` | text, nullable | Normalized lowercase, nonblank, 1–20 characters for visible comments; null on deletion. |
| `body` | text, nullable | Nonblank plain text, up to 2,000 characters for visible comments; null on deletion. |
| `created_at` | `timestamptz` | Required, defaults to database time; clients cannot set it. |
| `deleted_at` | `timestamptz`, nullable | Null for visible comments; set on moderation. |

Use a foreign key that prevents orphaning replies and does not cascade deletes. Enforce same-page and top-level parent rules at the write boundary, including direct dashboard inserts where practical via database constraints or a trigger; do not rely on the UI. Keep thread identity and timestamps stable after creation. Use database checks for visible vs. deleted row states and index the thread reads by page, parent and creation order. Sort deterministically using ID as the tie-breaker when timestamps match. Do not persist IPs, emails, user agents, fingerprints, raw form payloads or account records with comments.

**Moderator workflow:** In the Neon Console, inspect/filter the table; use one atomic update (for example, a small documented SQL Editor operation by ID) to set `deleted_at` and clear **both** `body` and `display_name`. Do not hard-delete rows in normal moderation. Never return pre-deletion content via the API. Keep periodic manual exports in a private location outside the repository; test recovery and account for older backups containing subsequently removed content. If restoring a backup, reconcile moderation deletions before reopening comments.

## 5. Server contract and guardrails

- Suggested entry point: `app/api/comments/route.ts` with `GET` for a page's thread and `POST` for a new comment/reply. Keep routes thin; put normalization, article-key validation, query and response shaping in `lib/comments/`. Use a small server-only client, such as `@neondatabase/serverless`, initialized lazily from `DATABASE_URL`. Use parameterized SQL. Avoid introducing an ORM solely for this feature. Follow existing code style and keep configuration and credentials out of the browser.
- Read requests identify `pageKey`. Write requests accept only `pageKey`, optional `parentId`, `displayName`, `body` and the honeypot field. Resolve the page against the existing **public** content readers on both reads and writes, not merely a path-prefix check. Reject noncanonical keys, nonexistent pages, draft-only posts and private paths; do not traverse arbitrary paths or read private content to validate them. Reject invalid, cross-page or nested parent IDs. Bound request size before parsing. Use the same character-count rules in the UI, API and database; don't silently truncate. Render submitted content as escaped text, never as HTML or MDX.
- Return the public fields only (including deletion state); for a removed row, return neither a name nor a body value other than null/omitted. Treat an empty thread as success, malformed input as a validation error, rate-limited requests as `429`, and unavailable/missing Neon configuration as `503` with a generic message. Return `201` and the persisted public record for a successful insert. Do not log submission text, names, IPs or credentials, or echo database errors to readers.
- Bound read sizes with indexed queries and explicit “Load more” controls when needed; preserve the top-level and reply sort orders and never silently truncate replies. Keep GET dynamic/noncached in v1 so dashboard deletions are visible on the next fetch. Fetch once on approach to the section, and on explicit retry or post reconciliation; do not poll. Check quota use before adding caching, and define deletion visibility before serving cached results.
- Start with a hidden anti-bot field and best-effort per-IP submission limits. Reuse [`lib/rate-limit.ts`](lib/rate-limit.ts) with a comments-specific namespace; keep IP-based state transient and apply the same protection to replies. Reject or discard honeypot hits without writing. Avoid cross-origin writes; the comments API is same-origin only. Document the chosen rate threshold and validate it against normal use. The in-memory limiter counts per serverless instance, not globally. Do not promise spam prevention. If abuse warrants stronger limits or bot screening, evaluate that separately rather than adding a CAPTCHA, external profiling, or visitor email now.
- Do not add comment tracking or send names, bodies, drafts, or actions to analytics. Existing site-wide page analytics stay unchanged outside this feature; check PostHog autocapture/session replay and other active instrumentation on the new subtree and mask/exclude comments as needed. Treat logs and exports as sensitive. Before launch, review the [privacy page](app/privacy/page.tsx) with the owner for accurate disclosure of public submissions, on-device name storage, moderation/deletion, transient abuse controls, Neon and backups; keep any copy update narrowly scoped and owner-approved.

## 6. Reserved names now; verified owner later

**V1 requirement:** Apply reserved-name checks server-side on all public submissions after trimming/lowercasing. Reject any name containing `giacomo` or `maggiore`, including `giacomo maggiore`, `giacomo`, `maggiore` and `gmaggiore`, and keep a small explicit list for known variants not already caught. Normalize comparison consistently (for example, Unicode compatibility normalization and comparison without common separators) to catch obvious variants; document and test the chosen rules and their false positives. The error should ask the reader to choose another name. Do not promise exhaustive detection of lookalike spellings. Display names otherwise are not unique or verified.

**Deferred:** Giacomo's exclusive posting method and a verified `Giacomo Maggiore`/author badge. Do not make a badge depend on submitted display text, browser state or any client-supplied role, and do not implement a public bypass for the reservation. An owner-controlled dashboard workflow or a separately protected posting interface can be designed later; a badge must derive from trusted server-controlled identity/metadata, with no visitor login requirement. No owner flag or badge UI is required in the initial schema or build.

## 7. Neon and Vercel setup

1. When authorized, verify the current [Neon Free plan limits](https://neon.com/faqs/free-plan-limits-and-quotas) and select a **$0 plan** before creating anything. Use the [Neon–Vercel integration](https://neon.com/docs/guides/vercel-managed-integration) or connect an existing Neon Free project by adding a sensitive server-only `DATABASE_URL` in Vercel. The owner already has the Vercel CLI; reuse it for project/environment work where useful, but verify target project, team and environment before changing anything. No Neon Auth or Realtime is needed. Choose an appropriate region close to the Vercel Functions and review data residency with the owner.
2. Give production a dedicated database/branch. Use a separate empty database or test-data branch for preview/development; do not copy real comments into test environments or point previews at production. Do not expose `.env.local`, `.vercel/` contents, tokens, or connection values. Use a narrowly privileged runtime role (read and insert, not DDL or moderation) and a separate privileged connection for schema changes and dashboard moderation. Document environment variable **names** and the migration/rollback procedure.
3. Apply the migration in a disposable test environment first and confirm the public runtime role cannot moderate. Apply the production migration only with explicit approval. No migration from a public request or a general application build. A rollback should remove/disable the comments feature without dropping submitted data.
4. Free is not unlimited. As checked during planning in November 2026, Neon documents **1 GB storage, 100 compute-unit hours/month and 5 GB public transfer/month per project**. Idle compute scales to zero after five minutes (first query may be slower). Hitting compute or transfer limits suspends access until reset or upgrade, without deleting data or billing Free overages; storage cap can block writes that require more space. Text volume is likely small; reads from visitors or bots can still consume quota. Check usage after launch rather than guaranteeing zero cost under all traffic. Vercel has separate usage limits. Verify current restore limits (six hours at planning time) and keep manual exports; no automatic failover, stale public replica or offline posting queue in v1.

## 8. Implementation order and acceptance

1. Add schema/migration, server helpers and tests against isolated data. Verify read/write, parent constraints, deterministic sorting and dashboard soft deletion.
2. Mount the comments component for both routes. Test a shared English/Italian thread and a distinct note thread, including blog language fallback, no comments on lists/404s, and database unavailability leaving article and footer intact.
3. Cover normalization and bounds, reserved names (including canonical and obvious variants), blank inputs, honeypot/rate limit behavior, nonexistent and draft-only pages, cross-page/nested parent rejection, and safe rendering of literal URLs and markup. Verify deleted names/bodies are not returned, replies remain, and a new reply to a deleted top-level comment succeeds.
4. Check keyboard and mobile behavior, visible focus, wrapping of long URLs, both themes, local date around midnight, the two-step flow and remembered-name prefill. Verify failed/double submissions don't clear drafts or create duplicates from repeated clicks. Ensure unrelated screens are unchanged and no comment data enters telemetry or `/ask`.
5. Run focused tests, `pnpm typecheck` and `pnpm check:private`. Follow the repository's UI snapshot procedure when editing application code: use `pnpm exec next build` (no indexer), use test or missing DB configuration for verification, and compare snapshots for unrelated changes. Do not run `pnpm build` without approval because it runs the wiki indexer. Comments do not require regenerating the index. Preserve all unrelated working-tree edits. Update directly related setup/maintenance documentation when implementation lands.
