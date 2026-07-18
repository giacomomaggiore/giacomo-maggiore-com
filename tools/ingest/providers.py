"""OpenAI generation helpers for the ingest pipeline."""

import os


_DEFAULT_MODEL = "gpt-5.4-mini-2026-03-17"
_DEFAULT_REASONING_MODEL = "gpt-5.6-terra"
_DEFAULT_EMBEDDING_MODEL = "text-embedding-3-small"


def _require_openai_provider() -> None:
    provider = os.environ.get("LLM_PROVIDER", "openai").lower().strip()
    if provider != "openai":
        raise ValueError("LLM_PROVIDER must be 'openai'.")


def reasoning_model() -> str:
    """Return the configured OpenAI reasoning model."""
    _require_openai_provider()
    override = os.environ.get("LLM_REASONING_MODEL", "").strip()
    return override or _DEFAULT_REASONING_MODEL


def generate(prompt: str, model: str | None = None) -> str:
    """Send a prompt to OpenAI and return the text response."""
    _require_openai_provider()
    return _openai(prompt, model)


def embed(texts: list[str], model: str | None = None) -> list[list[float]]:
    """Return one embedding vector per input text, in the same order."""
    _require_openai_provider()
    from openai import OpenAI

    client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])
    model = model or os.environ.get("LLM_EMBEDDING_MODEL", _DEFAULT_EMBEDDING_MODEL)
    response = client.embeddings.create(model=model, input=texts)
    return [item.embedding for item in response.data]


def _openai(prompt: str, model: str | None) -> str:
    from openai import OpenAI

    client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])
    model = model or os.environ.get("LLM_MODEL", _DEFAULT_MODEL)
    response = client.chat.completions.create(
        model=model,
        messages=[{"role": "user", "content": prompt}],
    )
    return response.choices[0].message.content.strip()
