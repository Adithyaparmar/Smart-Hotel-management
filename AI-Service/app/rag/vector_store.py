"""Minimal file-backed vector store for local development — cosine similarity
over a JSON-persisted list of {id, text, metadata, embedding}. This keeps the
RAG pipeline runnable with zero extra infrastructure. For production, swap this
module for a managed/scalable option (pgvector alongside the existing Postgres
instance, Pinecone, Qdrant, Weaviate, ...) behind the same `add`/`search`
interface so nothing else in `app/rag` has to change.
"""
from __future__ import annotations

import json
import os
from dataclasses import dataclass, field

import numpy as np

from app.config import settings


@dataclass
class VectorRecord:
    id: str
    text: str
    metadata: dict = field(default_factory=dict)
    embedding: list[float] = field(default_factory=list)


class VectorStore:
    def __init__(self, path: str = settings.vector_store_path) -> None:
        self.path = path
        self._records: list[VectorRecord] = []
        self._load()

    def _load(self) -> None:
        if os.path.exists(self.path):
            with open(self.path, "r", encoding="utf-8") as f:
                raw = json.load(f)
            self._records = [VectorRecord(**r) for r in raw]

    def _persist(self) -> None:
        os.makedirs(os.path.dirname(self.path) or ".", exist_ok=True)
        with open(self.path, "w", encoding="utf-8") as f:
            json.dump([r.__dict__ for r in self._records], f)

    def is_empty(self) -> bool:
        return len(self._records) == 0

    def add(self, records: list[VectorRecord]) -> None:
        self._records.extend(records)
        self._persist()

    def clear(self) -> None:
        self._records = []
        self._persist()

    def search(self, query_embedding: list[float], top_k: int = 4) -> list[tuple[VectorRecord, float]]:
        if not self._records:
            return []

        query = np.array(query_embedding)
        query_norm = np.linalg.norm(query) or 1e-9

        scored = []
        for record in self._records:
            emb = np.array(record.embedding)
            denom = (np.linalg.norm(emb) * query_norm) or 1e-9
            similarity = float(np.dot(query, emb) / denom)
            scored.append((record, similarity))

        scored.sort(key=lambda pair: pair[1], reverse=True)
        return scored[:top_k]


vector_store = VectorStore()
