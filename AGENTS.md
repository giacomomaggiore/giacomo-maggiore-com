# Repository instructions

This is a Next.js 14 App Router site on Vercel, an Obsidian vault, and a retrieval-backed assistant at `/ask`. Use pnpm and the pinned dependencies. Production targets Node 22; maintain local Node 20 compatibility.

## Non-negotiable rules

- Preserve visible copy, layout, and behavior on localhost and Vercel unless the user requests a UI change. Keep unrelated UI and working-tree changes intact.
- Public notes and blog posts are human-authored. Do not edit them unless requested or explicitly authorized by an active proofreading skill for the named file. Ask before editing anything under `wiki/private/`, even when following a skill.
- Keep private notes out of routes, metadata, feeds, sitemaps, and logs. Only `/ask` may surface their information, with title-only citations. The private vault and generated index are tracked: keep the repository private.
- Never read or disclose credential values or send secrets or sensitive data to external services. Private notes are unpublished, not inherently sensitive; the owner authorizes the existing OpenAI `/ask` and explicitly requested indexing workflows to process them. Do not copy note text into logs, verification artifacts, or unrelated external tools. Use local fakes for verification; do not call real services with dummy or real credentials just to test.
- Ask before `pnpm build` (it runs the indexer). Do not commit, push, deploy, provision services, or apply production migrations without explicit approval for that action.
- `wiki/notebooks/` is internal and local-only. Never import, index, publish, or execute it in a build, CI job, or deployed service. Do not revive the old MinerU/PDF ingestion pipeline; `wiki/source/` and `wiki/archive/` remain reserved local directories.

## Where to look

| Task | Read first |
| --- | --- |
| Implement or review a change | [Implementation and review](docs/agent/workflow.md) |
| Trace pages, API routes, or current behavior | [Architecture](docs/agent/architecture.md) |
| Touch the vault, index, telemetry, or deployment | [Data and services](docs/agent/data-and-services.md) |
| Pick checks or verify no UI regression | [Testing](docs/agent/testing.md) |
| Read or run an internal notebook | [Notebooks](docs/agent/notebooks.md) |

For changes to `app/`, `lib/`, `middleware.ts`, or `next.config.js`, follow the UI snapshot procedure in Testing. For all changes, report what was verified and what was not. Update directly affected documentation when commands, structure, or behavior change.
