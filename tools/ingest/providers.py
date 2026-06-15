"""
LLM provider abstraction for the ingest pipeline.

Switch provider via .env.local:
    LLM_PROVIDER=openai    # default — uses OPENAI_API_KEY
    LLM_PROVIDER=gemini    # uses GOOGLE_API_KEY

Override the model (optional):
    LLM_MODEL=gemini-2.0-flash-lite   # default for gemini
    LLM_MODEL=gpt-4o-mini             # default for openai

Both LLM_MODEL defaults are the cheapest/fastest tier for each provider — fine
for the per-note OCR cleanup step.

For heavier work that needs real reasoning (vault-wide re-processing,
content-aware link curation — see refresh_vault.py) call generate() with
model=reasoning_model(), or override the reasoning tier explicitly:
    LLM_REASONING_MODEL=gemini-2.5-pro
    LLM_REASONING_MODEL=gpt-5.4-2026-03-17
"""

import os


_DEFAULTS = {
    "gemini": "gemini-2.0-flash-lite",
    "openai": "gpt-5.4-mini-2026-03-17",
}

# Smarter, slower, pricier tier — used when a caller explicitly asks for
# reasoning. Override per-provider with LLM_REASONING_MODEL in .env.local.
_REASONING_DEFAULTS = {
    "gemini": "gemini-2.5-pro",
    "openai": "gpt-5.4-2026-03-17",
}


def _provider() -> str:
    return os.environ.get("LLM_PROVIDER", "openai").lower().strip()


def reasoning_model() -> str:
    """Return the reasoning-tier model id for the configured provider.

    Honours LLM_REASONING_MODEL if set; otherwise falls back to a sensible
    per-provider default. Pass the result to generate(prompt, model=...).
    """
    override = os.environ.get("LLM_REASONING_MODEL", "").strip()
    if override:
        return override
    provider = _provider()
    if provider not in _REASONING_DEFAULTS:
        raise ValueError(
            f"Unknown LLM_PROVIDER '{provider}'. Set it to 'gemini' or 'openai' in .env.local."
        )
    return _REASONING_DEFAULTS[provider]


def generate(prompt: str, model: str | None = None) -> str:
    """Send a prompt to the configured provider and return the text response.

    model: optional explicit model id. When omitted, the provider's cheap
    LLM_MODEL default is used (backward compatible).
    """
    provider = _provider()

    if provider == "gemini":
        return _gemini(prompt, model)
    elif provider == "openai":
        return _openai(prompt, model)
    else:
        raise ValueError(
            f"Unknown LLM_PROVIDER '{provider}'. Set it to 'gemini' or 'openai' in .env.local."
        )


def _gemini(prompt: str, model: str | None) -> str:
    from google import genai

    client = genai.Client(api_key=os.environ["GOOGLE_API_KEY"])
    model = model or os.environ.get("LLM_MODEL", _DEFAULTS["gemini"])
    response = client.models.generate_content(model=model, contents=prompt)
    return response.text.strip()


def _openai(prompt: str, model: str | None) -> str:
    from openai import OpenAI

    client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])
    model = model or os.environ.get("LLM_MODEL", _DEFAULTS["openai"])
    response = client.chat.completions.create(
        model=model,
        messages=[{"role": "user", "content": prompt}],
    )
    return response.choices[0].message.content.strip()
