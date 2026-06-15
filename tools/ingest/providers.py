"""
LLM provider abstraction for the ingest pipeline.

Switch provider via .env.local:
    LLM_PROVIDER=openai    # default — uses OPENAI_API_KEY
    LLM_PROVIDER=gemini    # uses GOOGLE_API_KEY

Override the model (optional):
    LLM_MODEL=gemini-2.0-flash-lite   # default for gemini
    LLM_MODEL=gpt-4o-mini             # default for openai

Both defaults are the cheapest/fastest tier for each provider.
"""

import os


_DEFAULTS = {
    "gemini": "gemini-2.0-flash-lite",
    "openai": "gpt-5.4-mini-2026-03-17",
}

def generate(prompt: str) -> str:
    """Send a prompt to the configured provider and return the text response."""
    provider = os.environ.get("LLM_PROVIDER", "openai").lower().strip()

    if provider == "gemini":
        return _gemini(prompt)
    elif provider == "openai":
        return _openai(prompt)
    else:
        raise ValueError(
            f"Unknown LLM_PROVIDER '{provider}'. Set it to 'gemini' or 'openai' in .env.local."
        )


def _gemini(prompt: str) -> str:
    from google import genai

    client = genai.Client(api_key=os.environ["GOOGLE_API_KEY"])
    model = os.environ.get("LLM_MODEL", _DEFAULTS["gemini"])
    response = client.models.generate_content(model=model, contents=prompt)
    return response.text.strip()


def _openai(prompt: str) -> str:
    from openai import OpenAI

    client = OpenAI(api_key=os.environ["OPENAI_API_KEY"])
    model = os.environ.get("LLM_MODEL", _DEFAULTS["openai"])
    response = client.chat.completions.create(
        model=model,
        messages=[{"role": "user", "content": prompt}],
    )
    return response.choices[0].message.content.strip()