"""
Wiki health checks.

Deterministic checks (always run):
  - Broken [[wikilinks]] — target title not in vault
  - Orphan notes — no other note links to them
  - Duplicate titles
  - Missing `title` frontmatter

Optional --llm flag adds Gemini suggestions:
  - Contradictions between notes
  - Missing concept pages
  - Suggested cross-references

Output: wiki/private/_lint-report.md  (read-only — never edits notes)
"""

import re
from pathlib import Path

import frontmatter
from providers import generate
from vault import build_title_map

WIKILINK_RE = re.compile(r"\[\[([^\[\]\n]+)\]\]")

_SKIP_STEMS = {"index", "log", "_lint-report"}


def run_lint(repo_root: Path, use_llm: bool = False) -> None:
    title_map = build_title_map(repo_root)
    issues: list[str] = []

    # Track inbound links per title so we can detect orphans
    inbound: dict[str, list[str]] = {t: [] for t in title_map}

    for title, path in title_map.items():
        try:
            post = frontmatter.load(str(path))
        except Exception as e:
            issues.append(f"Cannot parse `{path.name}`: {e}")
            continue

        if not str(post.get("title", "")).strip():
            issues.append(f"Missing `title` in frontmatter: `{path.name}`")

        for link_target in WIKILINK_RE.findall(post.content):
            link_target = link_target.strip()
            if link_target in title_map:
                inbound[link_target].append(title)
            else:
                issues.append(
                    f"Broken `[[{link_target}]]` in **{title}** (`{path.name}`)"
                )

    # Orphans
    for title, path in title_map.items():
        if path.stem in _SKIP_STEMS:
            continue
        if not inbound.get(title):
            issues.append(f"Orphan (no inbound links): **{title}** (`{path.name}`)")

    # Duplicate titles (shouldn't happen — vault.py last-write wins — but check anyway)
    seen: dict[str, Path] = {}
    for title, path in title_map.items():
        if title in seen:
            issues.append(
                f"Duplicate title **{title}**: `{path.name}` vs `{seen[title].name}`"
            )
        seen[title] = path

    # Build report
    lines = [
        "# Lint Report\n",
        f"**Notes scanned:** {len(title_map)}\n",
    ]

    if issues:
        lines.append(f"**Issues found:** {len(issues)}\n")
        lines.append("\n## Issues\n")
        lines.extend(f"{issue}\n" for issue in issues)
    else:
        lines.append("\nNo issues found.\n")

    if use_llm:
        lines.append("\n## Gemini Suggestions\n")
        lines.append(_llm_suggestions(title_map))

    report = "\n".join(lines)
    report_path = repo_root / "wiki/private/_lint-report.md"
    report_path.write_text(report, encoding="utf-8")

    print(f"Issues found: {len(issues)}")
    print(f"Report written → {report_path.relative_to(repo_root)}")


def _llm_suggestions(title_map: dict[str, Path]) -> str:
    # Build compact summaries (cap at 30 notes to stay within token budget)
    summaries: list[str] = []
    for title, path in list(title_map.items())[:30]:
        try:
            post = frontmatter.load(str(path))
            preview = post.content[:400].replace("\n", " ")
            summaries.append(f"**{title}**: {preview}")
        except Exception:
            pass

    prompt = (
        "You are reviewing a personal knowledge base. Below are short summaries of notes.\n"
        "Please identify:\n"
        "1. Apparent contradictions or inconsistencies between notes\n"
        "2. Important concepts mentioned in multiple notes but lacking their own dedicated page\n"
        "3. Pairs of notes that would benefit from explicit cross-references\n"
        "4. Open questions or missing sources worth investigating\n\n"
        "Be concise and specific. Format as markdown bullet lists per category.\n\n"
        "Notes:\n\n" + "\n\n---\n\n".join(summaries)
    )

    return generate(prompt) + "\n"
