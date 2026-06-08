"""
Scans the entire wiki vault (public + private) and builds the title allowlist.

The allowlist is the single source of truth used by link.py to validate
[[wikilinks]] — any link whose target is not in this map gets stripped.
"""

from pathlib import Path
import frontmatter


# Only private notes are managed by the pipeline.
# wiki/public/ is website content — the pipeline never reads or writes it.
# To bring a public note into the pipeline, copy it to wiki/private/<topic>/.
_WIKI_DIRS = [
    "wiki/private",
]

# Files to skip when building the index
_SKIP_STEMS = {"index", "log", "_lint-report"}


def build_title_map(repo_root: Path) -> dict[str, Path]:
    """
    Returns {title: absolute_path} for every note with a `title` in frontmatter.
    Only .md and .mdx files are considered; _lint-report, index, log are skipped.
    """
    title_map: dict[str, Path] = {}

    for rel in _WIKI_DIRS:
        root = repo_root / rel
        if not root.exists():
            continue
        for filepath in sorted(root.rglob("*")):
            if filepath.suffix not in (".md", ".mdx"):
                continue
            if filepath.stem in _SKIP_STEMS:
                continue
            try:
                post = frontmatter.load(str(filepath))
                title = str(post.get("title", "")).strip()
                if title:
                    title_map[title] = filepath
            except Exception:
                pass  # malformed frontmatter — skip silently

    return title_map
