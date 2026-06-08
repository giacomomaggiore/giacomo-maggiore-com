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