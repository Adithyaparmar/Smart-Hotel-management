"""One-off (or re-run-on-change) ingestion script: chunks KNOWLEDGE_DOCUMENTS,
embeds each chunk, and writes them into the vector store. Run this whenever the
hotel's policy documents change:

    python -m app.rag.ingest
"""
import asyncio
import uuid

from app.rag.chunking import chunk_text
from app.rag.documents import KNOWLEDGE_DOCUMENTS
from app.rag.embeddings import embed_texts
from app.rag.vector_store import VectorRecord, vector_store


async def ingest() -> None:
    all_chunks: list[str] = []
    all_metadata: list[dict] = []

    for doc in KNOWLEDGE_DOCUMENTS:
        for chunk in chunk_text(doc["text"]):
            all_chunks.append(chunk)
            all_metadata.append({"source": doc["source"], "title": doc["title"]})

    embeddings = await embed_texts(all_chunks)

    records = [
        VectorRecord(id=str(uuid.uuid4()), text=chunk, metadata=meta, embedding=emb)
        for chunk, meta, emb in zip(all_chunks, all_metadata, embeddings)
    ]

    vector_store.clear()
    vector_store.add(records)
    print(f"Ingested {len(records)} chunks from {len(KNOWLEDGE_DOCUMENTS)} documents.")


if __name__ == "__main__":
    asyncio.run(ingest())
