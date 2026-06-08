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

```bash
pip install google-genai python-frontmatter python-dotenv
```

Make sure `GOOGLE_API_KEY` is set in `.env.local` (it already is if you cloned this repo with your secrets).

### Ingest PDFs

Drop one or more PDF files into `wiki/source/`, then run from the `tools/` directory:

```bash
cd tools

# Process all PDFs in wiki/source/
python -m ingest run

# Process a single file
python -m ingest run ../wiki/source/mypaper.pdf

# Process a single file and specify the topic folder
python -m ingest run ../wiki/source/mypaper.pdf --topic finance
```

Each PDF goes through:
1. **MinerU** (fully local) — extracts text, tables, and formulas to Markdown
2. **Gemini** — infers the topic (if not provided) and inserts `[[wikilinks]]` to existing notes
3. Output is written to `wiki/private/<topic>/<filename>.md` with frontmatter
4. `wiki/private/log.md` and `wiki/private/index.md` are updated automatically

### Lint the vault

```bash
cd tools

# Deterministic checks: broken links, orphans, duplicate titles, missing frontmatter
python -m ingest lint

# + Gemini suggestions: contradictions, missing concept pages, cross-reference ideas
python -m ingest lint --llm
```

Report is written to `wiki/private/_lint-report.md`.

### Obsidian

Open `wiki/private/` as an Obsidian vault to browse and write private notes.
The `[[wikilinks]]` inserted by the pipeline are native Obsidian syntax.