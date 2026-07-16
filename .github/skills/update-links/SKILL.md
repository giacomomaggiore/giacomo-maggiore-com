---
name: update-links
description: "Review, validate, and refresh Obsidian wikilinks across wiki/private. Use when asked to review vault links, curate Related notes, validate wikilinks, or reconnect private notes."
argument-hint: "Optional note title or filename fragment; omit to review the entire private vault"
---

# Update Links

Use this skill only for notes in `wiki/private/`. It runs the existing link-curation phase, which validates every wikilink against the vault title allowlist and updates related-note sections. It is an editorial LLM operation, not a read-only broken-link linter.

## Procedure

1. If the user supplies a note title or filename fragment, confirm it identifies the intended private note. If it would match more than one note, ask the user to choose one exact note.
2. Run a preview from the repository root:

   ```bash
   cd tools && python3 -m ingest refresh --skip-clean --dry-run
   ```

   For one note, append `--only "<title fragment>"`.
3. Summarize the preview. Do not write changes during the preview.
4. Ask for explicit confirmation before applying the proposed changes.
5. After confirmation, rerun the same command without `--dry-run`.
6. Report the result and mention that `pnpm index` is needed only when the updated notes should be searchable through `/ask` locally. Do not run it unless requested.
7. Do not commit or push changes unless explicitly asked.