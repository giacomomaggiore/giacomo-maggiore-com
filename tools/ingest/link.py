"""
Inserts [[wikilinks]] into a newly converted note via Gemini, then:
  - validates every link against the vault allowlist (anti-hallucination guard)
  - updates wiki/private/index.md
  - appends a row to wiki/private/log.md
"""

import datetime
import re
from pathlib import Path

import frontmatter
from providers import generate

from vault import build_title_map

WIKILINK_RE = re.compile(r"\[\[([^\[\]\n]+)\]\]")


# ---------------------------------------------------------------------------
# Main linking step
# ---------------------------------------------------------------------------

def insert_links(note_path: Path, repo_root: Path) -> None:
    """
    Reads note_path, asks the configured LLM to insert [[wikilinks]], validates
    every link against the vault allowlist, and writes the result back to disk.
    """
    title_map = build_title_map(repo_root)
    post = frontmatter.load(str(note_path))
    body = post.content

    if not title_map:
        return  # nothing to link to yet

    titles_list = "\n".join(f"- {t}" for t in sorted(title_map.keys()))

    prompt = (
        "You are editing an academic note stored in a personal knowledge base.\n"
        "Your task: insert [[Title]] wikilinks where the text clearly refers to one of the existing notes listed below.\n\n"
        "Rules (strictly follow all of them):\n"
        "1. ONLY use titles from the list below, copied word-for-word exactly.\n"
        "2. Do NOT invent or paraphrase titles.\n"
        "3. Link a concept at most once per note (the first or most meaningful occurrence).\n"
        "4. Do NOT add links inside headings, code blocks, or existing links.\n"
        "5. Return the full note body with links inserted — nothing else, no explanation.\n\n"
        f"Existing note titles:\n{titles_list}\n\n"
        f"Note body:\n{body}"
    )

    linked_body = generate(prompt)

    # Validate: silently replace any [[link]] whose target is not in the allowlist
    # with plain text — this is the real anti-hallucination guard.
    allowed = set(title_map.keys())

    def _validate(m: re.Match) -> str:
        target = m.group(1).strip()
        return f"[[{target}]]" if target in allowed else target

    validated_body = WIKILINK_RE.sub(_validate, linked_body)

    post.content = validated_body
    note_path.write_text(frontmatter.dumps(post), encoding="utf-8")


# ---------------------------------------------------------------------------
# Log update
# ---------------------------------------------------------------------------

_LOG_HEADER = "| datetime | output file | topic | source |\n|---|---|---|---|\n"


def update_log(
    log_path: Path,
    note_path: Path,
    topic: str,
    source_pdf: Path,
    repo_root: Path,
) -> None:
    """Appends one row to wiki/private/log.md (creates with header if missing)."""
    now = datetime.datetime.now().strftime("%Y-%m-%d %H:%M")
    row = (
        f"| {now} "
        f"| {note_path.relative_to(repo_root)} "
        f"| {topic} "
        f"| {source_pdf.relative_to(repo_root)} |\n"
    )
    if not log_path.exists():
        log_path.write_text(_LOG_HEADER + row, encoding="utf-8")
    else:
        with log_path.open("a", encoding="utf-8") as f:
            f.write(row)


# ---------------------------------------------------------------------------
# Index update
# ---------------------------------------------------------------------------

def update_index(
    index_path: Path,
    note_path: Path,
    topic: str,
    title: str,
    repo_root: Path,
) -> None:
    """
    Adds a [[title]] bullet under the correct topic heading in wiki/private/index.md.
    Creates the file if it doesn't exist.
    """
    heading = f"## {topic.replace('-', ' ').title()}\n"
    entry = f"- [[{title}]]\n"

    if not index_path.exists():
        index_path.write_text(f"# Vault Index\n\n{heading}{entry}", encoding="utf-8")
        return

    content = index_path.read_text(encoding="utf-8")

    # Guard against duplicate entries
    if entry.strip() in content:
        return

    if heading in content:
        # Insert entry immediately after the heading
        content = content.replace(heading, heading + entry, 1)
    else:
        # New topic — append at end
        content = content.rstrip() + f"\n\n{heading}{entry}"

    index_path.write_text(content, encoding="utf-8")
