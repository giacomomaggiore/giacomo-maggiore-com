"""
LLM-powered markdown cleanup step for MinerU output.

Called once per note, immediately after MinerU converts the PDF.
Makes minimal changes: fixes OCR artifacts, markdown formatting, grammar,
and strips non-content noise. Never summarizes or rewrites meaning.
"""

from providers import generate


_PROMPT_TEMPLATE = """\
You are a copy-editor cleaning up a markdown document produced by an OCR pipeline.

Your task: return the same document with ONLY the following changes applied:

1. **Fix OCR and grammar errors** — correct misspellings, broken words split across lines, stray characters from OCR, grammatical mistakes. Change only what is clearly wrong; do not rephrase or paraphrase.

2. **Fix markdown formatting** — repair broken headings (e.g. `#Title` missing space, inconsistent heading levels), fix malformed lists, tables, code blocks, and LaTeX math blocks. Do not change the content, only the markup.

3. **Remove non-content noise** — delete the following if present:
   - Repeated page headers / footers / page numbers
   - Copyright lines, disclaimers, legal notices, cookie banners
   - Ads, navigation menus, "click here" links, subscription prompts
   - Boilerplate not part of the actual document (e.g. "Downloaded from...", "This article is protected by...")
   - Duplicate lines or paragraphs caused by OCR (same sentence appearing twice in a row)

4. **Do NOT**:
   - Summarize, shorten, or restructure sections
   - Change technical terms, proper nouns, numbers, or formulas
   - Add any new content or commentary
   - Remove figures, tables, equations, or citations that are part of the document

Return ONLY the cleaned markdown — no explanation, no preamble, no trailing note.

---

{content}
"""


def clean_markdown(content: str) -> str:
    """
    Send raw MinerU markdown through the LLM for cleanup.
    Returns the cleaned markdown string.
    """
    prompt = _PROMPT_TEMPLATE.format(content=content)
    return generate(prompt)
