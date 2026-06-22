# Giacomo Maggiore – Personal Website

[All in one place](https://giacomomaggiore.com), you can find:
- Giacomo's bio
- Giacomo's blog
- Giacomo's bookshelf
- Giacomo's notes
- Giacomo's resources  

_Pardon me: I studied Automation and Robotics, now I'm pursuing a Master in Economics... reason why you shouldn't expect great coding and web design skills from me!_

## Connect

- [Instagram](https://instagram.com/giacomomaggiore)  
- [LinkedIn](https://www.linkedin.com/in/giacomo-maggiore-499994263/)  
- [Email](mailto:giaco.maggiore@gmail.com)

---

## Local PKM pipeline

This repo also doubles as a personal knowledge base. Published notes and blog posts live under
`wiki/public/`; private notes under `wiki/private/` (gitignored, Obsidian vault).

### Prerequisites

Install the dependencies for your chosen LLM provider:

```bash
# Gemini (default)
pip install google-genai python-frontmatter python-dotenv

# OpenAI
pip install openai python-frontmatter python-dotenv
```

Set the following in `.env.local`:

```dotenv
# Choose provider: gemini (default) or openai
LLM_PROVIDER=gemini

# Key for the chosen provider (answer generation):
GOOGLE_API_KEY=...    # for LLM_PROVIDER=gemini
# OPENAI_API_KEY=...  # for LLM_PROVIDER=openai

# OpenAI key for embeddings — required for hybrid BM25 + semantic search.
# This is independent of LLM_PROVIDER: even if you answer with Gemini you
# still need this so the index builder and /api/ask can call text-embedding-3-small.
# If unset, retrieval falls back to BM25-only (keyword search).
OPENAI_API_KEY=...

# Optional: override the cheap/fast model used for per-note cleanup
# LLM_MODEL=gemini-2.0-flash-lite   # default for gemini
# LLM_MODEL=gpt-4o-mini             # default for openai

# Optional: override the reasoning tier used by `ingest refresh`
# LLM_REASONING_MODEL=gemini-2.5-pro       # default for gemini
# LLM_REASONING_MODEL=gpt-5.4-2026-03-17   # default for openai
```

### Ingest PDFs

Drop one or more PDF files into `wiki/source/`, then run from the `tools/` directory:

```bash
cd tools

# Process all PDFs in wiki/source/
python3 -m ingest run

# Process a single file
python3 -m ingest run ../wiki/source/mypaper.pdf

# Process a single file and specify the topic folder
python3 -m ingest run ../wiki/source/mypaper.pdf --topic finance
```

Each PDF goes through:
1. **MinerU** (fully local) — extracts text, tables, formulas, and images to Markdown
2. **LLM — topic inference** — suggests a folder name from the filename + content (skipped if `--topic` is given)
3. **LLM — cleanup** — fixes OCR artifacts, grammar, markdown formatting, and strips non-content noise (ads, disclaimers, page headers/footers)
4. **LLM — wikilinks** — inserts `[[links]]` to existing notes; all links validated against the vault allowlist
5. Output written to `wiki/private/<topic>/<title>.md` with frontmatter; `log.md` and `index.md` updated

### Refresh the vault

Re-process every existing note with a reasoning model: re-clean the body,
unwrap broken self-links, regenerate each note's `## Related notes` section
(content-aware, not title-matching), and rebuild `index.md`.

```bash
cd tools

# Re-clean + re-link the whole vault
python3 -m ingest refresh

# Preview everything without writing any files
python3 -m ingest refresh --dry-run

# Only one note (matched by filename substring)
python3 -m ingest refresh --only "Why Not 100% Equity"

# Re-curate links + index only (skip the cleanup phase)
python3 -m ingest refresh --skip-clean
```

Uses the reasoning tier from `LLM_REASONING_MODEL` (defaults:
`gpt-5.4-2026-03-17` for OpenAI, `gemini-2.5-pro` for Gemini). Frontmatter is
never sent to the model and never altered; every inserted `[[link]]` is
validated against the vault allowlist and unwrapped if it doesn't resolve.

### Obsidian

Open `wiki/private/` as an Obsidian vault to browse and write private notes.
The `[[wikilinks]]` inserted by the pipeline are native Obsidian syntax.
Note filenames use the document title (spaces, not underscores) so wikilinks resolve correctly in the graph view.