"""Embedding client abstraction. Swappable — currently targets OpenAI's
embeddings API since it's a common, cheap default; point EMBEDDING_PROVIDER /
EMBEDDING_MODEL at whatever your deployment uses. A local sentence-transformers
model is a drop-in alternative for fully self-hosted deployments (implement
`_embed_local` and switch on `settings.embedding_provider`)."""
from __future__ import annotations

from app.config import settings


async def embed_texts(texts: list[str]) -> list[list[float]]:
    if settings.embedding_provider == "openai":
        return await _embed_openai(texts)
    raise ValueError(f"Unsupported EMBEDDING_PROVIDER: {settings.embedding_provider}")


async def _embed_openai(texts: list[str]) -> list[list[float]]:
    from openai import AsyncOpenAI

    client = AsyncOpenAI(api_key=settings.openai_embedding_api_key or settings.openai_api_key)
    response = await client.embeddings.create(model=settings.embedding_model, input=texts)
    return [item.embedding for item in response.data]
