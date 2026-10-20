"""Client for THE CONSIGLIERE's non-sensitive preference memory.

Memory here is intentionally narrow — room/view preferences, hospitality
preferences, and short conversation-context notes (see `AIMemoryCategory` in
the Prisma schema). Nothing health-, payment-, or identity-sensitive is ever
written here; that boundary is enforced on the Node side
(`aiTools.service.js#upsertUserMemory`), and this client passes categories
through rather than inventing new ones.
"""
from __future__ import annotations

from typing import Any

from app.services.node_client import node_client

ALLOWED_CATEGORIES = {
    "ROOM_PREFERENCE",
    "VIEW_PREFERENCE",
    "HOSPITALITY_PREFERENCE",
    "CONVERSATION_CONTEXT",
    "OTHER",
}


async def load_user_memories(user_id: str) -> list[dict[str, Any]]:
    return await node_client.get_memories(user_id)


async def remember(user_id: str, key: str, value: Any, category: str = "OTHER") -> dict[str, Any]:
    category = category if category in ALLOWED_CATEGORIES else "OTHER"
    return await node_client.upsert_memory(user_id, key, value, category)


def memories_as_context(memories: list[dict[str, Any]]) -> str:
    """Renders stored memories as a short bullet list for the system prompt."""
    if not memories:
        return "No stored preferences yet."
    lines = [f"- ({m.get('category', 'OTHER')}) {m.get('key')}: {m.get('value')}" for m in memories]
    return "\n".join(lines)
