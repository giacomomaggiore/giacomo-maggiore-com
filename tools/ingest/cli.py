"""
Entry point for the local ingestion pipeline.

Usage (run from the repo root or anywhere — the script finds the repo root
by looking for a wiki/ directory):

    python -m ingest run                        # process all PDFs in wiki/source/
    python -m ingest run paper.pdf              # process one specific PDF
    python -m ingest run paper.pdf --topic finance
    python -m ingest lint                       # deterministic health checks
    python -m ingest lint --llm                 # + Gemini suggestions

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
        env_file = repo_root / ".env.local"
        if env_file.exists():
            load_dotenv(env_file)
    except ImportError:
        pass  # python-dotenv not installed — rely on the shell environment


def _find_repo_root() -> Path:
    """Walk up from this file's location until we find a directory containing wiki/."""
    here = Path(__file__).resolve().parent
    for candidate in [here, *here.parents]:
        if (candidate / "wiki").exists():
            return candidate
    sys.exit("Error: cannot find repo root (no wiki/ directory found).")


def _require_api_key() -> None:
    """Check that the API key for the configured provider is present."""
    provider = os.environ.get("LLM_PROVIDER", "gemini").lower().strip()
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


def cmd_lint(args: argparse.Namespace) -> None:
    repo_root = _find_repo_root()
    _load_env(repo_root)
    if args.llm:
        _require_api_key()

    from lint import run_lint
    run_lint(repo_root, use_llm=args.llm)


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

    # --- lint ---
    p_lint = sub.add_parser("lint", help="Health-check the wiki vault")
    p_lint.add_argument(
        "--llm",
        action="store_true",
        help="Also run Gemini-powered suggestions (slower, costs tokens)",
    )
    p_lint.set_defaults(func=cmd_lint)

    args = parser.parse_args()
    args.func(args)
