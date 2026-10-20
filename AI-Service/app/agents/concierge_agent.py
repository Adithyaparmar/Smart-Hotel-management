"""
THE CONSIGLIERE — orchestrator.

This is the agentic loop: build a grounded system prompt (persona + RAG +
stored preferences), give the LLM the controlled tool schemas, and let it
reason about what it needs. Every tool call is executed through
`app/tools/executor.py`, which delegates to the Node backend — this module
never queries a database directly, and the LLM itself never sees one.

Sensitive tools (createBooking, cancelBooking) come back from the executor as
`{"requiresConfirmation": True, ...}` until `params.confirmed` is set, so the
orchestrator naturally stops and asks the guest to confirm before looping back
in with the tool actually executed.
"""
from __future__ import annotations

import json
import uuid
from typing import Any

from app.memory.memory_client import load_user_memories, memories_as_context
from app.models.schemas import OrchestrateRequest, OrchestrateResponse, ToolCallRecord
from app.rag.retriever import retrieve_context
from app.services.llm_client import llm_client
from app.tools.definitions import tools_as_llm_schema
from app.tools.executor import execute_tool

MAX_TOOL_ITERATIONS = 5

SYSTEM_PROMPT_TEMPLATE = """You are THE CONSIGLIERE, the AI concierge of Luxury Mafia Hotel — a
premium hotel with an Italian old-money, private-club atmosphere. You are
impeccably polite, discreet, warm, and efficient, in the manner of a trusted
family consigliere: you speak with quiet confidence, never fawning, never
curt. You may use the occasional tasteful Italian phrase (grazie, prego,
benvenuto) but never overdo it, and never break character into anything
menacing — the "mafia" theme is aesthetic only.

You are speaking with {guest_name} (role: {user_role}).

RULES YOU MUST FOLLOW:
1. You have NO direct access to the hotel's database. Any fact about rooms,
   availability, prices, or bookings MUST come from a tool call — never
   invent or estimate one.
2. `createBooking` and `cancelBooking` are sensitive actions. Before calling
   either with confirmed=true, you must first clearly state the details
   (room, dates, price / cancellation policy outcome) in your reply and
   receive the guest's explicit confirmation in a PRIOR turn. Never set
   confirmed=true on the same turn you first propose the action.
3. Only use getUserBookings / getBookingStatus / createBooking / cancelBooking
   for the CURRENT guest — you cannot act on behalf of anyone else.
4. Always use calculateBookingPrice for any price you state — never do the
   arithmetic yourself.
5. Keep replies concise and concierge-appropriate — this is a chat widget,
   not a brochure.

Relevant hotel policy/knowledge for this conversation:
---
{rag_context}
---

What you know about this guest's preferences so far (non-sensitive only):
---
{memory_context}
---
"""


def _history_to_turns(history: list[dict[str, str]]) -> list[dict[str, Any]]:
    """Converts persisted AIMessage history (USER/ASSISTANT/SYSTEM/TOOL roles
    from Postgres) into generic turns for the LLM client. We intentionally
    only replay USER/ASSISTANT text here — full tool-call/tool-result replay
    across service restarts is out of scope for this reference implementation
    (the live in-turn loop below handles tool threading correctly within a
    single request); extend this if you need tool-call context to survive
    across conversation turns."""
    turns: list[dict[str, Any]] = []
    for msg in history:
        if msg["role"] == "USER":
            turns.append({"role": "user", "content": msg["content"]})
        elif msg["role"] == "ASSISTANT":
            turns.append({"role": "assistant", "content": msg["content"]})
    return turns


async def handle_conversation_turn(request: OrchestrateRequest) -> OrchestrateResponse:
    rag_context = await retrieve_context(request.message)
    memories = await load_user_memories(request.user_id)
    memory_context = memories_as_context(memories)

    system_prompt = SYSTEM_PROMPT_TEMPLATE.format(
        guest_name=request.user_first_name or "Guest",
        user_role=request.user_role,
        rag_context=rag_context,
        memory_context=memory_context,
    )

    turns = _history_to_turns([m.model_dump() for m in request.history])
    turns.append({"role": "user", "content": request.message})

    tools_schema = tools_as_llm_schema()
    tool_call_log: list[ToolCallRecord] = []

    for _iteration in range(MAX_TOOL_ITERATIONS):
        response = await llm_client.chat(system=system_prompt, turns=turns, tools=tools_schema)

        if not response.tool_calls:
            return OrchestrateResponse(reply=response.text or "Prego, how may I assist you today?", tool_calls=tool_call_log)

        # Record the assistant's tool-call turn so the next LLM call has full context.
        turns.append({
            "role": "assistant",
            "content": response.text,
            "tool_calls": [{"id": tc.id, "name": tc.name, "arguments": tc.arguments} for tc in response.tool_calls],
        })

        pending_confirmation: dict[str, Any] | None = None

        for tool_call in response.tool_calls:
            result = await execute_tool(
                tool_call.name, tool_call.arguments, request.user_id, request.user_role, request.conversation_id
            )

            tool_call_log.append(ToolCallRecord(
                tool_name=tool_call.name,
                params=tool_call.arguments,
                result=result,
                required_confirmation=bool(result.get("requiresConfirmation")),
            ))

            if result.get("requiresConfirmation"):
                pending_confirmation = {"toolName": tool_call.name, "params": result.get("params", tool_call.arguments)}

            turns.append({
                "role": "tool_result",
                "tool_call_id": tool_call.id,
                "name": tool_call.name,
                "content": result,
            })

        if pending_confirmation:
            # Ask the LLM to phrase the confirmation request to the guest, now
            # that it has the tool result (e.g. the calculated price) in context.
            final = await llm_client.chat(system=system_prompt, turns=turns, tools=tools_schema)
            return OrchestrateResponse(
                reply=final.text or "Could you confirm you'd like me to proceed?",
                requires_confirmation=True,
                pending_action=pending_confirmation,
                tool_calls=tool_call_log,
            )

    # Exhausted iterations without a final answer — fail safe rather than loop forever.
    return OrchestrateResponse(
        reply="My apologies — let me have the front desk follow up with you directly on this one.",
        tool_calls=tool_call_log,
    )
