# Claude Code project guidance

@AGENTS.md

[AGENTS.md](AGENTS.md) is the shared source for approval rules, data boundaries, and links to current project behavior. Read it directly if the client does not expand imports.

- For implementation and review, read the [workflow](docs/agent/workflow.md) and the relevant part of [Architecture](docs/agent/architecture.md).
- For validation, use the [testing matrix and UI snapshot procedure](docs/agent/testing.md). Do not use `pnpm build` as a routine check: it runs the wiki indexer.
- For local Python analysis, follow the [notebook procedure](docs/agent/notebooks.md). Notebooks under `wiki/notebooks/` never run in production or enter `/ask`.

Claude Code's [Stop hook](.claude/settings.json) is advisory. It checks working-tree status and reminds you about applicable approval or verification requirements; it is not a test or permission check.

The [existing skills](README.md#skills-automated-helpers) remain in place. Use `check-markdown-latex` only for a specifically requested file; skill use never bypasses the private-vault approval rule.

Private notes are unpublished, not inherently sensitive. The owner authorizes their use by `/ask` and by OpenAI embeddings during an explicitly requested index refresh; see [Data and services](docs/agent/data-and-services.md). Never include secrets or sensitive data in those requests. `/update-links` still requires approval before changing private notes.
