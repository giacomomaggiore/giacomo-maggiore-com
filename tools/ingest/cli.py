"""
Entry point for the local ingestion pipeline.

Usage (run from the repo root or anywhere — the script finds the repo root
by looking for a wiki/ directory):

    python -m ingest run                        # process all PDFs in wiki/source/
    python -m ingest run paper.pdf              # process one specific PDF
    python -m ingest run paper.pdf --topic finance
    python -m ingest refresh                    # re-clean + re-link the whole vault
    python -m ingest refresh --dry-run          # preview without writing

Requirements:
    pip install google-genai python-frontmatter python-dotenv
    Set GOOGLE_API_KEY (and optionally GEMINI_MODEL) in .env.local or your shell.
"""

import argparse
import os
import shutil
import sys
from pathlib import Path


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------

def _load_env(repo_root: Path) -> None:
    """Load .env.local from the repo root so GOOGLE_API_KEY etc. are available."""
    try:
        from dotenv import load_dotenv
    except ImportError:
        print(
            "Warning: python-dotenv is not installed, so .env.local will NOT be "
            "loaded.\n         Install it with: pip install -r tools/requirements.txt",
            file=sys.stderr,
        )
        return  # rely on the shell environment
    env_file = repo_root / ".env.local"
    if env_file.exists():
        load_dotenv(env_file)


def _find_repo_root() -> Path:
    """Walk up from this file's location until we find a directory containing wiki/."""
    here = Path(__file__).resolve().parent
    for candidate in [here, *here.parents]:
        if (candidate / "wiki").exists():
            return candidate
    sys.exit("Error: cannot find repo root (no wiki/ directory found).")


def _require_api_key() -> None:
    """Check that the API key for the configured provider is present."""
    provider = os.environ.get("LLM_PROVIDER", "openai").lower().strip()
    if provider == "gemini":
        if not os.environ.get("GOOGLE_API_KEY", "").strip():
            sys.exit(
                "Error: GOOGLE_API_KEY is not set (LLM_PROVIDER=gemini).\n"
                "Add it to .env.local or export it in your shell."
            )
    elif provider == "openai":
        if not os.environ.get("OPENAI_API_KEY", "").strip():
            sys.exit(
                "Error: OPENAI_API_KEY is not set (LLM_PROVIDER=openai).\n"
                "Add it to .env.local or export it in your shell."
            )
    else:
        sys.exit(f"Error: Unknown LLM_PROVIDER '{provider}'. Use 'gemini' or 'openai'.")


def _unique_path(path: Path) -> Path:
    """Return a non-existing path by adding -2, -3, ... before the suffix if needed."""
    if not path.exists():
        return path

    counter = 2
    while True:
        candidate = path.with_name(f"{path.stem}-{counter}{path.suffix}")
        if not candidate.exists():
            return candidate
        counter += 1


def _archive_pdf(pdf: Path, source_dir: Path, archive_dir: Path) -> Path:
    """Move a processed PDF from wiki/source/ to wiki/archive/, preserving subfolders."""
    rel = pdf.relative_to(source_dir)
    archived_pdf = _unique_path(archive_dir / rel)
    archived_pdf.parent.mkdir(parents=True, exist_ok=True)
    shutil.move(str(pdf), str(archived_pdf))
    return archived_pdf


# ---------------------------------------------------------------------------
# Commands
# ---------------------------------------------------------------------------

def cmd_run(args: argparse.Namespace) -> None:
    repo_root = _find_repo_root()
    _load_env(repo_root)
    _require_api_key()

    from mineru_run import run_pdf
    from link import insert_links, update_log, update_index
    import frontmatter

    source_dir = repo_root / "wiki/source"
    archive_dir = repo_root / "wiki/archive"
    private_dir = repo_root / "wiki/private"
    private_dir.mkdir(parents=True, exist_ok=True)
    log_path   = private_dir / "log.md"
    index_path = private_dir / "index.md"

    # Determine which PDFs to process
    if args.file:
        pdf = Path(args.file).resolve()
        if not pdf.exists():
            sys.exit(f"Error: file not found: {pdf}")
        pdfs = [pdf]
    else:
        pdfs = sorted(source_dir.rglob("*.pdf"))

    if not pdfs:
        print("No PDFs found in wiki/source/. Drop some PDFs there and try again.")
        return

    print(f"Processing {len(pdfs)} PDF(s) ...\n")

    for pdf in pdfs:
        print(f"[{pdf.name}]")
        try:
            note_path, topic = run_pdf(pdf, private_dir, args.topic, repo_root)
            print(f"  Parsed  → {note_path.relative_to(repo_root)}")

            insert_links(note_path, repo_root)
            print(f"  Linked  ✓")

            post = frontmatter.load(str(note_path))
            title = str(post.get("title", note_path.stem)).strip()

            update_log(log_path, note_path, topic, pdf, repo_root)
            update_index(index_path, note_path, topic, title, repo_root)
            print(f"  Log + index updated ✓")

            archived_pdf = _archive_pdf(pdf, source_dir, archive_dir)
            print(f"  Archived → {archived_pdf.relative_to(repo_root)}\n")

        except Exception as e:
            print(f"  ERROR: {e}\n")

    print("Done.")


def cmd_refresh(args: argparse.Namespace) -> None:
    repo_root = _find_repo_root()
    _load_env(repo_root)
    _require_api_key()

    from refresh_vault import refresh
    refresh(
        repo_root,
        dry_run=args.dry_run,
        only=args.only,
        skip_clean=args.skip_clean,
        skip_links=args.skip_links,
        no_index=args.no_index,
    )


# ---------------------------------------------------------------------------
# Argument parser
# ---------------------------------------------------------------------------

def main() -> None:
    parser = argparse.ArgumentParser(
        prog="ingest",
        description="Local wiki ingestion pipeline",
    )
    sub = parser.add_subparsers(dest="command", required=True)

    # --- run ---
    p_run = sub.add_parser("run", help="Convert PDFs in wiki/source/ to linked markdown notes")
    p_run.add_argument(
        "file",
        nargs="?",
        help="Path to a specific PDF (default: all PDFs in wiki/source/)",
    )
    p_run.add_argument(
        "--topic", "-t",
        help="Topic folder name, e.g. 'finance' (default: inferred by Gemini)",
    )
    p_run.set_defaults(func=cmd_run)

    # --- refresh ---
    p_refresh = sub.add_parser(
        "refresh",
        help="Re-clean and re-link the whole vault with a reasoning model",
    )
    p_refresh.add_argument("--dry-run", action="store_true",
                           help="Preview changes without writing any files")
    p_refresh.add_argument("--only", metavar="SUBSTR",
                           help="Only process notes whose filename contains SUBSTR")
    p_refresh.add_argument("--skip-clean", action="store_true",
                           help="Skip the cleanup phase; only re-curate links + index")
    p_refresh.add_argument("--skip-links", action="store_true",
                           help="Skip the link-curation phase")
    p_refresh.add_argument("--no-index", action="store_true",
                           help="Do not rebuild index.md")
    p_refresh.set_defaults(func=cmd_refresh)

    args = parser.parse_args()
    args.func(args)
