---
name: convert-source-to-markdown
description: "Convert a PDF in wiki/source into a cleaned, linked private Markdown note. Use when asked to ingest a source PDF, convert a source to Markdown, or add a PDF to private wiki notes. Accepts a source filename or path and an optional topic; missing topics use faulty."
argument-hint: "Source PDF filename or path in wiki/source, followed by an optional topic"
---

# Convert Source To Markdown

Convert one PDF from `wiki/source/` into a private Markdown note using the existing local ingestion pipeline. The source must already be inside `wiki/source/`; this is required because the pipeline archives processed files from there.

## Inputs

- Required: PDF filename or a path in `wiki/source/`, for example `paper.pdf` or `papers/paper.pdf`.
- Optional: topic folder name, for example `ergodicity`.
- If no topic is supplied, use `faulty`. Pass it explicitly as `--topic faulty`; do not let the model infer a topic.

## Procedure

1. Resolve the supplied filename or path to exactly one `.pdf` inside `wiki/source/`, retaining its path relative to `wiki/source/`.
   - For a filename without a path, search recursively in `wiki/source/`.
   - If no PDF or more than one PDF matches, stop and ask the user for the exact relative path.
   - If the file is outside `wiki/source/` or is not a PDF, stop and explain that it must first be placed in `wiki/source/`.
2. Set the topic to the supplied value, or `faulty` when it is omitted. Reject topic values containing `/`, `\\`, or `..`.
3. From the repository root, run the ingestion command from `tools/`:

   ```bash
   cd tools && python3 -m ingest run "../wiki/source/<resolved-source-path>" --topic "<topic>"
   ```

   This invokes local MinerU parsing, applies the configured LLM cleanup, adds validated private-note links, updates `wiki/private/log.md` and `wiki/private/index.md`, writes the note to `wiki/private/<topic>/`, and archives the original PDF below `wiki/archive/`.
4. If the command reports an error, do not retry with a different topic or move files. Report the failing step and preserve the source for inspection.
5. On success, run:

   ```bash
   pnpm index
   ```

   Report the indexer result, including the note count and whether embeddings were created or skipped. Do not reveal environment-variable values or API keys.
6. Run `git status --short` and report the generated index, private note, private log/index, and archived-PDF changes. Do not commit or push unless explicitly asked.

For example, `/convert-source-to-markdown file.pdf ergodicity` writes the resulting note under `wiki/private/ergodicity/`. `/convert-source-to-markdown file.pdf` writes it under `wiki/private/faulty/`.