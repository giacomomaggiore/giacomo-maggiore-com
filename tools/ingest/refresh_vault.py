"""
Vault-wide re-processing pass, driven by a smart reasoning model.

This replays, over EVERY existing note in wiki/private/, the same manual pass a
human editor would do:

  Phase 1 — Clean each note:
      * remove non-content OCR noise (bylines, dates, page furniture,
        copyright/legal, ads/nav/subscription prompts, boilerplate, duplicated
        OCR lines, trailing "Author:" metadata blocks)
      * light OCR + grammar repair only (never summarise / rewrite / reformat
        meaning; never touch numbers, formulas, tables, equations, citations)
      * unwrap broken self-referential [[wikilinks]] (links a bad earlier pass
        inserted that point at the note's OWN title) back to plain prose
      * also emit a 2-3 sentence summary + key concepts, used in Phase 2

  Phase 2 — Curate cross-note links (content-aware, not title-matching):
      * append a "## Related notes" ("## Note correlate" for Italian notes)
        section listing the 2-5 most genuinely related OTHER notes
      * add a few high-value inline [[Title|phrase]] links
      * every link target is validated against the vault allowlist; anything
        not found is unwrapped to plain text (anti-hallucination guard)

  Phase 3 — Rebuild wiki/private/index.md grouped by frontmatter `topic`.

Frontmatter is never sent to the model and never altered — python-frontmatter
splits it off, the model only ever sees/returns the note BODY.

Usage (from anywhere in the repo):
    python -m ingest refresh                 # whole vault
    python -m ingest refresh --dry-run       # preview, write nothing
    python -m ingest refresh --only "Why Not 100% Equity"   # one note (by title substring)
    python -m ingest refresh --skip-clean    # only re-curate links + index
    python -m ingest refresh --no-index      # skip the index rebuild

Standalone (without the CLI):
    python tools/ingest/refresh_vault.py [--dry-run] [...]

Requirements: same as the rest of the pipeline (python-frontmatter,
python-dotenv, and the SDK for your provider). Set LLM_REASONING_MODEL in
.env.local to pick the reasoning model (defaults: gpt-5.4-2026-03-17 /
gemini-2.5-pro).
"""

import argparse
import json
import re
import sys
from pathlib import Path

import frontmatter

from providers import generate, reasoning_model
from vault import build_title_map, _SKIP_STEMS

WIKILINK_RE = re.compile(r"\[\[([^\[\]\n]+)\]\]")
_SUMMARY_SENTINEL = "===SUMMARY-JSON==="


# ===========================================================================
# Prompts — the heart of this script. Edit these to change behaviour.
# ===========================================================================

CLEAN_PROMPT = """\
You are a meticulous copy-editor cleaning a single markdown note from a personal \
Obsidian knowledge base. The note was produced by an OCR pipeline (PDF or web \
article → markdown), so it contains extraction noise. You are given ONLY the note \
body (its YAML frontmatter has already been removed and will be restored \
afterwards — do not output any frontmatter or `---` fences).

The note's own title is: "{title}"

Apply ONLY the following changes, and nothing else:

1. REMOVE non-content noise wherever it appears:
   - Publication dates, "Received/Accepted/Published" lines, journal name, DOI,
     volume/issue, source URLs, "Downloaded from…", "Electronic copy available
     at…", SSRN/arXiv boilerplate
   - Repeated page headers / footers / running titles / page numbers
   - Copyright lines, disclaimers, legal notices, cookie/consent banners
   - Ads, navigation menus, "click here" / "read more" links, subscription or
     paywall prompts, social-share UI, comment threads, "related posts" lists,
     site footers
   - Boilerplate that is not part of the document itself
   - Duplicated lines or paragraphs caused by OCR (the same sentence repeated
     back-to-back)
   - A trailing metadata block of the form `---` / `Author: …` / `---` that a
     previous automated step may have appended — delete it entirely

2. LIGHT REPAIR ONLY:
   - Fix obvious OCR damage: words split across line breaks, stray characters,
     dropped fi/fl ligatures, broken/missing markdown (headings missing their
     space, malformed lists/tables/code fences, stray ```markdown wrappers around
     the whole body, broken LaTeX delimiters)
   - Fix clear grammar/spelling mistakes in prose
   - Do NOT summarise, shorten, paraphrase, reorder, or restructure anything
   - Do NOT change technical terms, proper nouns, numbers, formulas, equations,
     tables, figures, or citations / reference lists that belong to the document
   - Do NOT invent text to "finish" a sentence the OCR left truncated — leave
     genuinely truncated content exactly as-is

3. FIX BROKEN SELF-LINKS:
   - A previous bad pass sometimes replaced an ordinary phrase with a wikilink
     pointing at THIS note's own title, e.g. `[[{title}]]` dropped into the
     middle of a sentence. Unwrap every such self-referential link back to the
     natural plain-text phrase it should be (usually the lower-cased subject,
     e.g. "the bus ticket theory", "portable alpha", "Switzerland"/"Italy" from
     context). Use the surrounding sentence to choose the right words.
   - Do NOT add any new wikilinks here — linking is a separate later step.
   - Leave wikilinks that point at OTHER notes untouched.

If, after cleaning, the body contains no real article content (e.g. OCR produced
only an image placeholder or a garbage table), return an empty body for the
markdown part.

OUTPUT FORMAT — return EXACTLY this, with no preamble or explanation:

<the full cleaned markdown body>
{sentinel}
{{"summary": "<2-3 sentence summary of what the note argues/covers>", "key_concepts": ["concept", "entity", "theme", "..."]}}

The line "{sentinel}" must appear once, on its own line, separating the cleaned
markdown (above) from a single line of valid minified JSON (below).

--- NOTE BODY START ---
{body}
--- NOTE BODY END ---
"""


LINK_PROMPT = """\
You are curating the cross-links of a personal Obsidian knowledge base so the
notes form a connected graph. You are working on ONE note and may link it to the
OTHER notes in the catalog below. Base your decisions on the actual CONTENT and
ideas of the notes, not just on title similarity.

The note you are editing is titled: "{title}"

CATALOG OF ALL OTHER NOTES (use these titles verbatim as link targets):
{catalog}

TASK:
1. Append a "Related notes" section at the very END of the note body:
   - Heading: "## Related notes" — but if THIS note is written in Italian, use
     "## Note correlate" and write the reasons in Italian.
   - List the 2-5 OTHER notes most genuinely related to this one. Prefer the
     strongest conceptual links (shared thesis, same author, method ↔ its
     application, theory ↔ empirical test, companion pieces) over weak topical
     overlap. Quality over quantity.
   - Format each as: `- [[Exact Catalog Title]] — short reason (a few words)`
2. Add a FEW high-value inline links inside the existing body (at most 3):
   - Only where another catalog note's specific concept/author/term is already
     named in the text. Wrap the existing phrase as `[[Exact Catalog Title|phrase]]`.
   - Only if it reads naturally. This is curation, not saturation.

STRICT RULES:
- Use ONLY titles copied verbatim from the catalog. Never invent or paraphrase a
  title. Never link this note to itself.
- Link any given target at most once in the whole note (prefer the inline
  occurrence; otherwise the Related notes list).
- Do NOT add links inside headings, code blocks, math, tables, or existing links.
- Do NOT otherwise edit, summarise, or reword the body. Only insert links and
  append the Related-notes section.
- Return the FULL note body (with your inline links and the appended section) and
  NOTHING else — no preamble, no code fences, no explanation.

--- NOTE BODY START ---
{body}
--- NOTE BODY END ---
"""


# ===========================================================================
# Helpers
# ===========================================================================

def _load_env(repo_root: Path) -> None:
    try:
        from dotenv import load_dotenv
    except ImportError:
        return
    env_file = repo_root / ".env.local"
    if env_file.exists():
        load_dotenv(env_file)


def _find_repo_root() -> Path:
    here = Path(__file__).resolve().parent
    for candidate in [here, *here.parents]:
        if (candidate / "wiki").exists():
            return candidate
    sys.exit("Error: cannot find repo root (no wiki/ directory found).")


def _iter_notes(repo_root: Path, only: str | None):
    """Yield (path, post) for every managed note, optionally filtered by --only."""
    private_dir = repo_root / "wiki/private"
    for path in sorted(private_dir.rglob("*.md")):
        if path.stem in _SKIP_STEMS:
            continue
        if only and only.lower() not in path.stem.lower():
            continue
        try:
            post = frontmatter.load(str(path))
        except Exception as e:
            print(f"  ! skipping (bad frontmatter): {path.name} — {e}")
            continue
        yield path, post


def _is_empty_body(body: str) -> bool:
    return len(body.strip()) < 40


def _split_clean_output(raw: str) -> tuple[str, dict]:
    """Split the model output into (cleaned_markdown, {summary, key_concepts})."""
    if _SUMMARY_SENTINEL in raw:
        md, _, tail = raw.partition(_SUMMARY_SENTINEL)
    else:
        md, tail = raw, ""
    md = md.strip()
    meta: dict = {}
    tail = tail.strip()
    if tail:
        # tolerate ```json fences or trailing prose around the JSON object
        m = re.search(r"\{.*\}", tail, re.DOTALL)
        if m:
            try:
                meta = json.loads(m.group(0))
            except json.JSONDecodeError:
                meta = {}
    return md, meta


def _strip_code_fences(text: str) -> str:
    """Remove a leading/trailing ```...``` fence the model may wrap output in."""
    t = text.strip()
    if t.startswith("```"):
        t = re.sub(r"^```[a-zA-Z]*\n", "", t)
        t = re.sub(r"\n```\s*$", "", t)
    return t.strip()


def _validate_links(body: str, allowed: set[str]) -> tuple[str, int, int]:
    """Keep [[links]] whose target resolves to an allowed title; unwrap the rest.

    Handles aliased `[[Target|display]]`, headed `[[Target#section]]`, and
    path-qualified `[[folder/Target]]` forms. Returns (body, kept, unwrapped).
    """
    kept = unwrapped = 0

    def _sub(m: re.Match) -> str:
        nonlocal kept, unwrapped
        inner = m.group(1)
        target, _, display = inner.partition("|")
        target = target.split("#")[0].strip()
        candidate = target.split("/")[-1].strip()  # tolerate path-qualified links
        if target in allowed or candidate in allowed:
            kept += 1
            return m.group(0)
        unwrapped += 1
        return (display.strip() or candidate or target)

    return WIKILINK_RE.sub(_sub, body), kept, unwrapped


# ===========================================================================
# Phase 1 — clean + summarise
# ===========================================================================

def clean_note(path: Path, post, model: str, dry_run: bool) -> dict:
    """Clean one note in place and return its catalog entry."""
    body = post.content
    title = str(post.get("title", path.stem)).strip()
    topic = str(post.get("topic", "")).strip()

    entry = {"title": title, "topic": topic, "folder": path.parent.name,
             "summary": "", "key_concepts": []}

    if _is_empty_body(body):
        print(f"  · empty body, skipping clean: {title}")
        return entry

    prompt = CLEAN_PROMPT.format(title=title, body=body, sentinel=_SUMMARY_SENTINEL)
    raw = generate(prompt, model=model)
    cleaned, meta = _split_clean_output(raw)

    entry["summary"] = str(meta.get("summary", "")).strip()
    kc = meta.get("key_concepts", [])
    entry["key_concepts"] = [str(c).strip() for c in kc] if isinstance(kc, list) else []

    if cleaned and cleaned != body.strip():
        if dry_run:
            print(f"  ✎ would clean: {title}  (Δ {len(body)}→{len(cleaned)} chars)")
        else:
            post.content = cleaned
            path.write_text(frontmatter.dumps(post), encoding="utf-8")
            print(f"  ✓ cleaned: {title}  (Δ {len(body)}→{len(cleaned)} chars)")
    else:
        print(f"  · no clean changes: {title}")
    return entry


# ===========================================================================
# Phase 2 — curate links
# ===========================================================================

def _format_catalog(entries: list[dict], exclude_title: str) -> str:
    lines = []
    for e in entries:
        if e["title"] == exclude_title:
            continue
        concepts = ", ".join(e["key_concepts"][:8])
        summary = e["summary"] or "(no summary)"
        lines.append(f"- {e['title']} [{e['topic'] or e['folder']}] — {summary}"
                     + (f" | concepts: {concepts}" if concepts else ""))
    return "\n".join(lines)


def link_note(path: Path, post, entries: list[dict], allowed: set[str],
              model: str, dry_run: bool) -> None:
    body = post.content
    title = str(post.get("title", path.stem)).strip()

    if _is_empty_body(body):
        print(f"  · empty body, skipping links: {title}")
        return

    catalog = _format_catalog(entries, exclude_title=title)
    if not catalog:
        return

    prompt = LINK_PROMPT.format(title=title, catalog=catalog, body=body)
    linked = _strip_code_fences(generate(prompt, model=model))
    if not linked:
        print(f"  ! empty link response, skipping: {title}")
        return

    # Anti-hallucination guard: drop links to titles not in the vault.
    linked, kept, dropped = _validate_links(linked, allowed)

    if dry_run:
        print(f"  ✎ would link: {title}  ({kept} valid, {dropped} unwrapped)")
        return
    post.content = linked
    path.write_text(frontmatter.dumps(post), encoding="utf-8")
    print(f"  ✓ linked: {title}  ({kept} valid, {dropped} unwrapped)")


# ===========================================================================
# Phase 3 — rebuild index
# ===========================================================================

def rebuild_index(repo_root: Path, entries: list[dict], dry_run: bool) -> None:
    by_topic: dict[str, list[str]] = {}
    for e in entries:
        topic = e["topic"] or e["folder"] or "misc"
        by_topic.setdefault(topic, [])
        if e["title"] not in by_topic[topic]:
            by_topic[topic].append(e["title"])

    lines = ["# Vault Index", "",
             "A map of the notes in this vault, grouped by topic. Each note also "
             "carries its own **Related notes** section linking out to neighbouring "
             "ideas.", ""]
    for topic in sorted(by_topic):
        heading = topic.replace("-", " ").replace("_", " ").strip().title()
        lines.append(f"## {heading}")
        for title in sorted(by_topic[topic]):
            lines.append(f"- [[{title}]]")
        lines.append("")
    content = "\n".join(lines).rstrip() + "\n"

    index_path = repo_root / "wiki/private/index.md"
    if dry_run:
        print(f"  ✎ would rebuild index.md ({len(entries)} notes, "
              f"{len(by_topic)} topics)")
        return
    index_path.write_text(content, encoding="utf-8")
    print(f"  ✓ rebuilt index.md ({len(entries)} notes, {len(by_topic)} topics)")


# ===========================================================================
# Orchestration
# ===========================================================================

def refresh(repo_root: Path, *, dry_run: bool = False, only: str | None = None,
            skip_clean: bool = False, skip_links: bool = False,
            no_index: bool = False) -> None:
    _load_env(repo_root)
    model = reasoning_model()
    print(f"Using reasoning model: {model}\n")

    notes = list(_iter_notes(repo_root, only))
    if not notes:
        print("No notes matched.")
        return

    # Phase 1: clean + collect catalog
    entries: list[dict] = []
    if skip_clean:
        print("Phase 1: clean — SKIPPED (building catalog from current notes)")
        for path, post in notes:
            entries.append({
                "title": str(post.get("title", path.stem)).strip(),
                "topic": str(post.get("topic", "")).strip(),
                "folder": path.parent.name,
                "summary": (post.content[:300].replace("\n", " ").strip()),
                "key_concepts": [],
            })
    else:
        print(f"Phase 1: cleaning {len(notes)} note(s) …")
        for path, post in notes:
            try:
                entries.append(clean_note(path, post, model, dry_run))
            except Exception as e:
                print(f"  ERROR cleaning {path.name}: {e}")

    # Reload posts so Phase 2 sees the cleaned bodies (when not dry-run).
    if not skip_links:
        print(f"\nPhase 2: curating links across {len(notes)} note(s) …")
        # Allowlist = every title currently in the vault (anti-hallucination).
        allowed = set(build_title_map(repo_root).keys())
        for path, _old in notes:
            try:
                post = frontmatter.load(str(path))
            except Exception as e:
                print(f"  ! skipping (bad frontmatter): {path.name} — {e}")
                continue
            try:
                link_note(path, post, entries, allowed, model, dry_run)
            except Exception as e:
                print(f"  ERROR linking {path.name}: {e}")

    # Phase 3: index (only meaningful for a full run)
    if not no_index and not only:
        print("\nPhase 3: rebuilding index …")
        rebuild_index(repo_root, entries, dry_run)
    elif only:
        print("\nPhase 3: index rebuild skipped (--only run).")

    print("\nDone." + (" (dry run — nothing written)" if dry_run else ""))


def main(argv: list[str] | None = None) -> None:
    parser = argparse.ArgumentParser(
        prog="ingest refresh",
        description="Re-clean and re-link the whole wiki/private vault with a "
                    "reasoning model.",
    )
    parser.add_argument("--dry-run", action="store_true",
                        help="Preview changes without writing any files")
    parser.add_argument("--only", metavar="SUBSTR",
                        help="Only process notes whose filename contains SUBSTR")
    parser.add_argument("--skip-clean", action="store_true",
                        help="Skip the cleanup phase; only re-curate links + index")
    parser.add_argument("--skip-links", action="store_true",
                        help="Skip the link-curation phase")
    parser.add_argument("--no-index", action="store_true",
                        help="Do not rebuild index.md")
    args = parser.parse_args(argv)

    repo_root = _find_repo_root()
    refresh(repo_root, dry_run=args.dry_run, only=args.only,
            skip_clean=args.skip_clean, skip_links=args.skip_links,
            no_index=args.no_index)


if __name__ == "__main__":
    sys.path.insert(0, str(Path(__file__).resolve().parent))
    main()
