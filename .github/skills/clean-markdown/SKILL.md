---
name: clean-markdown
description: "Preview and clean grammar, OCR artifacts, Markdown syntax, and non-content noise in one private Obsidian note. Use when asked to clean a markdown note, repair note formatting, or fix OCR/grammar in wiki/private."
argument-hint: "Exact note title or a unique filename fragment"
---

# Clean Markdown

Use this skill only for one note in `wiki/private/`. The existing cleanup pass makes conservative edits: it repairs clear OCR and grammar errors, Markdown and LaTex syntax, and extraction noise. It must not summarize, rewrite meaning, or change frontmatter.

## Procedure

1. Require an exact title or a filename fragment that identifies one private note. If the fragment is ambiguous, ask the user to choose the note.
2. Run a preview from the repository root:

   ```bash
   cd tools && python3 -m ingest refresh --only "<title fragment>" --skip-links --dry-run
   ```
3. Summarize the proposed cleanup. Do not write changes during the preview.
4. Ask for explicit confirmation before applying the cleanup.
5. After confirmation, rerun the same command without `--dry-run`.
6. Report the result and suggest `pnpm index` only when the changed note should be searchable through `/ask` locally.
7. Do not commit or push changes unless explicitly asked.