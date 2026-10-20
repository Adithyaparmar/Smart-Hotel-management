"""Server-to-server client back into the Node backend's internal API.

This is the ONLY way the AI service ever touches hotel data — it never has a
database connection or credentials of its own. Every call carries the internal
service key (verified by Node's `internalAuth` middleware) plus the *human*
user's id/role, so Node can re-run its normal authorization rules exactly as it
would for a request coming through the public REST API.
"""
from __future__ import annotations

from typing import Any, Optional

import httpx

from app.config import settings


class NodeBackendClient:
    def __init__(self) -> None:
        self._client = httpx.AsyncClient(
            base_url=settings.node_backend_url,
            headers={"x-internal-key": settings.internal_service_key},
            timeout=15.0,
        )

    async def run_tool(
        self, tool_name: str, params: dict[str, Any], user_id: str, user_role: str, conversation_id: str
    ) -> dict[str, Any]:
        resp = await self._client.post(
            "/api/internal/ai/tools/run",
            json={
                "toolName": tool_name,
                "params": params,
                "userId": user_id,
                "userRole": user_role,
                "conversationId": conversation_id,
            },
        )
        resp.raise_for_status()
        return resp.json()["data"]

    async def get_memories(self, user_id: str) -> list[dict[str, Any]]:
        resp = await self._client.get(f"/api/internal/ai/memory/{user_id}")
        resp.raise_for_status()
        return resp.json()["data"]

    async def upsert_memory(
        self, user_id: str, key: str, value: Any, category: Optional[str] = None
    ) -> dict[str, Any]:
        resp = await self._client.post(
            "/api/internal/ai/memory",
            json={"userId": user_id, "key": key, "value": value, "category": category},
        )
        resp.raise_for_status()
        return resp.json()["data"]

    async def aclose(self) -> None:
        await self._client.aclose()


node_client = NodeBackendClient()
