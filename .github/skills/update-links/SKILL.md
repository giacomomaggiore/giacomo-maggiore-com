---
name: update-links
description: "Review, validate, and refresh Obsidian wikilinks across wiki/private using embedding-based candidate retrieval plus an LLM curation pass. Use when asked to review vault links, curate Related notes, validate wikilinks, or reconnect private notes."
argument-hint: "Optional note title or filename fragment; omit to review the entire private vault"
---

# Update Links

Use this skill only for notes in `wiki/private/`. It never reads or links to `wiki/public/` blog posts or notes.

Link curation is a two-step, hybrid pipeline (see `tools/ingest/refresh_vault.py`):
1. **Embeddings narrow the field.** Every note (title + summary + key concepts) is embedded with `text-embedding-3-small` (override via `LLM_EMBEDDING_MODEL`). Cosine similarity shortlists each note's top ~8 nearest neighbours in the vault.
2. **The reasoning model picks and explains.** Only that shortlist — not the whole vault — is handed to the reasoning model, which chooses the 2-5 genuinely related notes, writes the "## Related notes" section (or "## Note correlate" for Italian notes) with a short reason each, and adds a few high-value inline links. Every link target is validated against the vault allowlist; anything else is unwrapped to plain text (anti-hallucination guard).

This design is          deliberate: pure embedding similarity finds topically-close notes but can't explain *why* they're related or judge things like shared authorship or theory-vs-application pairing; a pure LLM pass over the full catalog doesn't scale as the vault grows. Combining both keeps quality high and cost bounded.

## Procedure

1. If the user supplies a note title or filename fragment, confirm it identifies the intended private note. If it would match more than one note, ask the user to choose one exact note.
2. Run a preview from any terminal location:

   ```bash
   repo_root="$(git rev-parse --show-toplevel)"
   cd "$repo_root/tools" && python3 -m ingest refresh --skip-clean --dry-run
   ```

   For one note, append `--only "<title fragment>"`. The candidate catalog is always built from the whole vault, even on a single-note `--only` run.
3. If the preview reports a `model_not_found` error, stop and explain that `LLM_REASONING_MODEL` (or `LLM_EMBEDDING_MODEL`) must name a model available to the configured account; do not apply any changes. If instead only a few notes fail with a transient error (e.g. a 401 on an otherwise-working model) while most succeed, note it and rerun once — this pipeline has seen OpenAI return sporadic transient 401s that clear on retry; only escalate if the same note keeps failing on retry.
4. Summarize the preview, including how many candidate notes each linked note drew from. Do not write changes during the preview.
5. Ask for explicit confirmation before applying the proposed changes.
6. After confirmation, rerun the same command without `--dry-run`.
7. Report the result and mention that `pnpm index` is needed only when the updated notes should be searchable through `/ask` locally. Do not run it unless requested.
8. Do not commit or push changes unless explicitly asked.
