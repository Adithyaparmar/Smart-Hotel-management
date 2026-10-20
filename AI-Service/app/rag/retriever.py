"""Top-k retrieval: embeds the incoming query and searches the vector store.
Falls back to returning the raw KNOWLEDGE_DOCUMENTS (untruncated) if the store
hasn't been ingested yet, so the concierge still has policy grounding even
before `python -m app.rag.ingest` has been run in a fresh environment."""
from __future__ import annotations

from app.config import settings
from app.rag.documents import KNOWLEDGE_DOCUMENTS
from app.rag.embeddings import embed_texts
from app.rag.vector_store import vector_store


async def retrieve_context(query: str, top_k: int | None = None) -> str:
    top_k = top_k or settings.rag_top_k

    if vector_store.is_empty():
        snippets = [f"[{d['title']}] {d['text']}" for d in KNOWLEDGE_DOCUMENTS[:top_k]]
        return "\n\n".join(snippets)

    try:
        [query_embedding] = await embed_texts([query])
    except Exception:
        # Embedding provider unavailable (e.g. no API key in local dev) —
        # degrade gracefully rather than failing the whole chat turn.
        snippets = [f"[{d['title']}] {d['text']}" for d in KNOWLEDGE_DOCUMENTS[:top_k]]
        return "\n\n".join(snippets)

    results = vector_store.search(query_embedding, top_k=top_k)
    snippets = [f"[{r.metadata.get('title', r.metadata.get('source'))}] {r.text}" for r, _score in results]
    return "\n\n".join(snippets)
