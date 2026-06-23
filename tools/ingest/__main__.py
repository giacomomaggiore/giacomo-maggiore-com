import sys
from pathlib import Path

# Add the ingest/ directory to sys.path so sibling modules
# (cli, vault, link, etc.) can import each other with bare names.
sys.path.insert(0, str(Path(__file__).parent))

from cli import main

main()
