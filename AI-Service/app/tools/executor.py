"""Executes a tool the LLM decided to call — by delegating to the Node backend,
which is the only thing with a database connection. This module never talks to
Postgres and never talks to the LLM; it's purely the bridge between them.

Every call (including the first, unconfirmed proposal of a sensitive action)
goes to Node — never short-circuited locally — because Node is the system of
record for what was actually proposed to the guest. That's what lets Node
reject a "confirmed" call that doesn't match a proposal it actually staged,
instead of trusting whatever params the LLM regenerates on a later turn.
"""
from __future__ import annotations

from typing import Any

from app.services.node_client import node_client
from app.tools.definitions import TOOLS_BY_NAME


async def execute_tool(
    tool_name: str, params: dict[str, Any], user_id: str, user_role: str, conversation_id: str
) -> dict[str, Any]:
    if tool_name not in TOOLS_BY_NAME:
        return {"error": f"Unknown tool: {tool_name}"}

    return await node_client.run_tool(tool_name, params, user_id, user_role, conversation_id)
