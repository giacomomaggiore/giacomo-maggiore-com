"""
Runs MinerU on one or more PDFs and writes the resulting markdown (with
frontmatter) into wiki/private/<topic>/<stem>.md.

MinerU runs fully locally — no cloud call for parsing.
LLM is called twice per PDF: once to infer the topic, once to clean up the markdown.
"""

import datetime
import shutil
import subprocess
import tempfile
from pathlib import Path

import frontmatter
from cleanup import clean_markdown
from providers import generate

MINERU_BIN = "/opt/anaconda3/bin/mineru"

def _infer_topic(stem: str, preview: str) -> str:
    """Ask the configured LLM for a short topic folder name (e.g. 'finance', 'econometrics')."""
    return generate(
        "Given this academic paper filename and the first lines of its content, "
        "suggest a single short topic folder name: lowercase, no spaces, hyphens allowed.\n"
        "Output the folder name only — nothing else.\n\n"
        f"Filename: {stem}\n"
        f"Content preview:\n{preview[:600]}\n\n"
        "Examples of good names: finance, econometrics, machine-learning, supply-chain, sustainability"
    ).lower().replace(" ", "-")


def run_pdf(
    pdf_path: Path,
    private_dir: Path,
    topic: str | None,
    repo_root: Path,
) -> tuple[Path, str]:
    """
    Convert one PDF with MinerU and write the result to wiki/private/<topic>/<stem>.md.
    Returns (note_path, topic).
    """
    print(f"    Running MinerU on {pdf_path.name} ...")
    with tempfile.TemporaryDirectory() as tmp:
        tmp_out = Path(tmp)
        subprocess.run(
            [
                MINERU_BIN,
                "-p", str(pdf_path),
                "-o", str(tmp_out),
                "-m", "auto",
                "-l", "en",
            ],
            check=True,
            capture_output=True,  # suppress MinerU's own verbose output
        )

        # MinerU nests output: <tmp>/<stem>/<method>/<stem>.md
        # Search recursively to be robust to version differences.
        md_files = [f for f in tmp_out.rglob("*.md") if not f.name.startswith("_")]
        if not md_files:
            raise RuntimeError(f"MinerU produced no markdown for {pdf_path.name}")

        # If multiple .md files, pick the largest (most complete content)
        md_file = max(md_files, key=lambda f: f.stat().st_size)
        raw_content = md_file.read_text(encoding="utf-8")

        # Infer topic via LLM if not provided
        if not topic:
            print(f"    Inferring topic via LLM ...")
            topic = _infer_topic(pdf_path.stem, raw_content)

        # Clean up OCR artifacts, formatting, grammar, and non-content noise
        print(f"    Cleaning markdown via LLM ...")
        content = clean_markdown(raw_content)

        # Build a clean title from the filename
        title = pdf_path.stem.replace("-", " ").replace("_", " ").title()

        # Prepare destination — use the title as the filename so [[wikilinks]] resolve in Obsidian
        dest_dir = private_dir / topic
        dest_dir.mkdir(parents=True, exist_ok=True)
        dest = dest_dir / (title + ".md")

        # Copy images to <topic>/images/ (MinerU already uses this name)
        img_dir = md_file.parent / "images"
        if img_dir.exists():
            dest_img_dir = dest_dir / "images"
            if dest_img_dir.exists():
                shutil.rmtree(dest_img_dir)
            shutil.copytree(img_dir, dest_img_dir)

        # Write with frontmatter
        post = frontmatter.Post(
            content,
            title=title,
            date=datetime.date.today().isoformat(),
            source=str(pdf_path.relative_to(repo_root)),
            topic=topic,
        )
        dest.write_text(frontmatter.dumps(post), encoding="utf-8")

    return dest, topic
