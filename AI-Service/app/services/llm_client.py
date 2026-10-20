"""Provider-agnostic LLM client.

Gemini is implemented against Google's Interactions REST API instead of the
provider SDK's Generate Content/Part helpers. This intentionally avoids
Gemini-3 thought-signature reconstruction and google-genai SDK model-shape
compatibility issues. Hotel tools are still executed exclusively by the
existing concierge executor/Node backend.
"""
from __future__ import annotations

import asyncio
import json
import re
import time
import uuid
from dataclasses import dataclass, field
from typing import Any

import httpx

from app.config import settings

Turn = dict[str, Any]


@dataclass
class LLMToolCall:
    id: str
    name: str
    arguments: dict[str, Any]


@dataclass
class LLMResponse:
    text: str
    tool_calls: list[LLMToolCall] = field(default_factory=list)
    stop_reason: str = "end_turn"


class LLMClient:
    def __init__(self) -> None:
        self.provider = settings.llm_provider

        # Gemini Interactions are chained only inside a single concierge
        # request. The generic agent already persists user/assistant text in
        # PostgreSQL, so long-term conversation history does not depend on
        # provider-specific state.
        self._gemini_interaction_by_call_id: dict[str, str] = {}

        # Flash-Lite is selected for this hotel concierge because it is designed
        # for high-volume agentic workloads. Keep calls serialized so a tool
        # round cannot accidentally burst the project quota.
        self._gemini_request_lock = asyncio.Lock()
        self._gemini_last_request_at = 0.0

    async def chat(self, system: str, turns: list[Turn], tools: list[dict[str, Any]]) -> LLMResponse:
        if self.provider == "anthropic":
            return await self._chat_anthropic(system, turns, tools)
        if self.provider == "openai":
            return await self._chat_openai(system, turns, tools)
        if self.provider == "gemini":
            return await self._chat_gemini(system, turns, tools)
        raise ValueError(f"Unsupported LLM_PROVIDER: {self.provider}")

    # ------------------------------------------------------------------ #
    # Anthropic
    # ------------------------------------------------------------------ #

    async def _chat_anthropic(self, system: str, turns: list[Turn], tools: list[dict[str, Any]]) -> LLMResponse:
        import anthropic

        client = anthropic.AsyncAnthropic(api_key=settings.anthropic_api_key)
        anthropic_tools = [
            {"name": t["name"], "description": t["description"], "input_schema": t["parameters"]}
            for t in tools
        ]

        messages = self._turns_to_anthropic(turns)

        response = await client.messages.create(
            model=settings.llm_model,
            max_tokens=1024,
            system=system,
            messages=messages,
            tools=anthropic_tools or None,
        )

        text_parts: list[str] = []
        tool_calls: list[LLMToolCall] = []
        for block in response.content:
            if block.type == "text":
                text_parts.append(block.text)
            elif block.type == "tool_use":
                tool_calls.append(LLMToolCall(id=block.id, name=block.name, arguments=block.input))

        return LLMResponse(text="\n".join(text_parts), tool_calls=tool_calls, stop_reason=response.stop_reason)

    @staticmethod
    def _turns_to_anthropic(turns: list[Turn]) -> list[dict[str, Any]]:
        messages: list[dict[str, Any]] = []
        pending_tool_results: list[dict[str, Any]] = []

        def flush_tool_results() -> None:
            if pending_tool_results:
                messages.append({"role": "user", "content": list(pending_tool_results)})
                pending_tool_results.clear()

        for turn in turns:
            role = turn["role"]

            if role == "user":
                flush_tool_results()
                messages.append({"role": "user", "content": turn["content"]})
            elif role == "assistant":
                flush_tool_results()
                blocks: list[dict[str, Any]] = []
                if turn.get("content"):
                    blocks.append({"type": "text", "text": turn["content"]})
                for tc in turn.get("tool_calls", []):
                    blocks.append({"type": "tool_use", "id": tc["id"], "name": tc["name"], "input": tc["arguments"]})
                messages.append({"role": "assistant", "content": blocks})
            elif role == "tool_result":
                pending_tool_results.append({
                    "type": "tool_result",
                    "tool_use_id": turn["tool_call_id"],
                    "content": json.dumps(turn["content"], default=str),
                })

        flush_tool_results()
        return messages

    # ------------------------------------------------------------------ #
    # OpenAI
    # ------------------------------------------------------------------ #

    async def _chat_openai(self, system: str, turns: list[Turn], tools: list[dict[str, Any]]) -> LLMResponse:
        from openai import AsyncOpenAI

        client = AsyncOpenAI(api_key=settings.openai_api_key)
        openai_tools = [
            {
                "type": "function",
                "function": {
                    "name": t["name"],
                    "description": t["description"],
                    "parameters": t["parameters"],
                },
            }
            for t in tools
        ]

        messages = [{"role": "system", "content": system}] + self._turns_to_openai(turns)

        response = await client.chat.completions.create(
            model=settings.llm_model,
            messages=messages,
            tools=openai_tools or None,
        )

        choice = response.choices[0]
        tool_calls: list[LLMToolCall] = []
        if choice.message.tool_calls:
            for tc in choice.message.tool_calls:
                tool_calls.append(
                    LLMToolCall(
                        id=tc.id,
                        name=tc.function.name,
                        arguments=json.loads(tc.function.arguments),
                    )
                )

        return LLMResponse(text=choice.message.content or "", tool_calls=tool_calls, stop_reason=choice.finish_reason)

    @staticmethod
    def _turns_to_openai(turns: list[Turn]) -> list[dict[str, Any]]:
        messages: list[dict[str, Any]] = []
        for turn in turns:
            role = turn["role"]
            if role == "user":
                messages.append({"role": "user", "content": turn["content"]})
            elif role == "assistant":
                msg: dict[str, Any] = {"role": "assistant", "content": turn.get("content") or None}
                if turn.get("tool_calls"):
                    msg["tool_calls"] = [
                        {
                            "id": tc["id"],
                            "type": "function",
                            "function": {"name": tc["name"], "arguments": json.dumps(tc["arguments"])},
                        }
                        for tc in turn["tool_calls"]
                    ]
                messages.append(msg)
            elif role == "tool_result":
                messages.append({
                    "role": "tool",
                    "tool_call_id": turn["tool_call_id"],
                    "content": json.dumps(turn["content"], default=str),
                })
        return messages

    # ------------------------------------------------------------------ #
    # Gemini — Interactions REST API
    # ------------------------------------------------------------------ #

    async def _chat_gemini(self, system: str, turns: list[Turn], tools: list[dict[str, Any]]) -> LLMResponse:
        if not settings.gemini_api_key:
            raise ValueError("GEMINI_API_KEY is not configured.")

        interaction_id = self._find_gemini_parent_interaction(turns)
        interaction_tools = [
            {
                "type": "function",
                "name": t["name"],
                "description": t["description"],
                "parameters": t["parameters"],
            }
            for t in tools
        ]

        if interaction_id:
            input_payload: Any = self._function_results_for_interaction(turns, interaction_id)
            if not input_payload:
                # Never send an unmatched function result. If the in-memory
                # interaction disappeared (e.g. service restart), rebuild a
                # fresh text request from the persisted conversation instead.
                interaction_id = None
                input_payload = self._turns_as_transcript(turns)
        else:
            input_payload = self._turns_as_transcript(turns)

        body: dict[str, Any] = {
            "model": settings.llm_model,
            "input": input_payload,
            "system_instruction": system,
            "store": True,
        }
        if interaction_id:
            body["previous_interaction_id"] = interaction_id
        if interaction_tools:
            body["tools"] = interaction_tools
        body["generation_config"] = {"max_output_tokens": 1024}

        data = await self._post_gemini_interaction(body)

        new_interaction_id = data.get("id")
        if not new_interaction_id:
            raise RuntimeError("Gemini Interactions API returned no interaction id.")

        text_parts: list[str] = []
        tool_calls: list[LLMToolCall] = []

        for step in data.get("steps", []) or []:
            step_type = step.get("type")
            if step_type == "function_call":
                name = step.get("name")
                call_id = step.get("id")
                if not name or not call_id:
                    raise RuntimeError(f"Gemini returned an invalid function_call step: {step}")
                arguments = step.get("arguments") or {}
                if not isinstance(arguments, dict):
                    try:
                        arguments = json.loads(arguments)
                    except (TypeError, json.JSONDecodeError) as exc:
                        raise RuntimeError(f"Gemini returned invalid arguments for {name}") from exc

                self._gemini_interaction_by_call_id[call_id] = new_interaction_id
                tool_calls.append(
                    LLMToolCall(id=call_id, name=name, arguments=dict(arguments))
                )
            elif step_type in {"model_output", "text"}:
                text_parts.extend(self._extract_step_text(step))

        # Current Responses/Interactions responses expose output_text. Keep it
        # as the authoritative final text and only fall back to step parsing.
        output_text = data.get("output_text")
        if isinstance(output_text, str) and output_text.strip():
            text_parts = [output_text]

        status = data.get("status") or "completed"
        return LLMResponse(
            text="\n".join(part for part in text_parts if part),
            tool_calls=tool_calls,
            stop_reason=str(status),
        )

    async def _post_gemini_interaction(self, body: dict[str, Any]) -> dict[str, Any]:
        url = "https://generativelanguage.googleapis.com/v1beta/interactions"
        headers = {
            "x-goog-api-key": settings.gemini_api_key,
            "Content-Type": "application/json",
        }

        async with self._gemini_request_lock:
            # Stay below the project's reported 5 RPM free-tier limit.
            gap = 5.0
            elapsed = time.monotonic() - self._gemini_last_request_at
            if elapsed < gap:
                await asyncio.sleep(gap - elapsed)

            async with httpx.AsyncClient(timeout=90.0) as client:
                for attempt in range(2):
                    try:
                        self._gemini_last_request_at = time.monotonic()
                        response = await client.post(url, headers=headers, json=body)

                        if response.status_code == 429:
                            detail = response.text
                            retry_seconds = self._parse_retry_after(response)
                            if attempt == 0:
                                await asyncio.sleep(max(13.0, min(retry_seconds, 90.0)))
                                continue
                            raise RuntimeError(
                                f"Gemini rate limit reached. Please wait about {round(retry_seconds)}s before trying again. "
                                f"Provider response: {detail}"
                            )

                        if response.status_code in {500, 502, 503, 504}:
                            detail = response.text
                            if attempt == 0:
                                await asyncio.sleep(3.0)
                                continue
                            raise RuntimeError(
                                f"Gemini Interactions API HTTP {response.status_code}: {detail}"
                            )

                        if response.status_code >= 400:
                            try:
                                detail = response.json()
                            except ValueError:
                                detail = response.text
                            raise RuntimeError(
                                f"Gemini Interactions API HTTP {response.status_code}: {detail}"
                            )

                        payload = response.json()
                        if not isinstance(payload, dict):
                            raise RuntimeError("Gemini Interactions API returned a non-object response.")
                        return payload
                    except httpx.HTTPError as exc:
                        if attempt == 0:
                            await asyncio.sleep(3.0)
                            continue
                        raise RuntimeError(f"Gemini Interactions API connection failed: {exc}") from exc

        raise RuntimeError("Gemini Interactions API request failed unexpectedly.")

    @staticmethod
    def _parse_retry_after(response: httpx.Response) -> float:
        header = response.headers.get("retry-after")
        if header:
            try:
                return max(1.0, float(header))
            except ValueError:
                pass

        match = re.search(r"retry in (\d+)s", response.text, flags=re.IGNORECASE)
        if match:
            return max(1.0, float(match.group(1)))

        return 60.0

    def _find_gemini_parent_interaction(self, turns: list[Turn]) -> str | None:
        # The agent's next LLM call contains tool_result turns generated from
        # the immediately preceding Gemini interaction. Use any matching call
        # id to continue that exact interaction chain.
        for turn in reversed(turns):
            if turn.get("role") == "tool_result":
                call_id = turn.get("tool_call_id")
                if call_id and call_id in self._gemini_interaction_by_call_id:
                    return self._gemini_interaction_by_call_id[call_id]
        return None

    def _function_results_for_interaction(self, turns: list[Turn], interaction_id: str) -> list[dict[str, Any]]:
        results: list[dict[str, Any]] = []
        for turn in turns:
            if turn.get("role") != "tool_result":
                continue
            call_id = turn.get("tool_call_id")
            if not call_id or self._gemini_interaction_by_call_id.get(call_id) != interaction_id:
                continue

            result = turn.get("content")
            if isinstance(result, str):
                result_text = result
            else:
                result_text = json.dumps(result, default=str)

            results.append(
                {
                    "type": "function_result",
                    "name": turn.get("name") or "",
                    "call_id": call_id,
                    "result": [{"type": "text", "text": result_text}],
                }
            )
        return results

    @staticmethod
    def _turns_as_transcript(turns: list[Turn]) -> str:
        """Create normal conversational history for a fresh Interaction.

        Internal assistant tool-call records/results are deliberately omitted.
        They are provider-internal execution details and are not needed on a
        later user turn because the resulting assistant text is persisted by
        the existing Node/DB conversation layer.
        """
        lines: list[str] = []
        for turn in turns:
            role = turn.get("role")
            if role == "user":
                lines.append(f"Guest: {str(turn.get('content', '')).strip()}")
            elif role == "assistant":
                content = str(turn.get("content", "")).strip()
                if content:
                    lines.append(f"Consigliere: {content}")

        return "\n\n".join(lines).strip() or "Guest: Hello"

    @staticmethod
    def _extract_step_text(step: dict[str, Any]) -> list[str]:
        content = step.get("content")
        if isinstance(content, str):
            return [content]
        if not isinstance(content, list):
            return []

        text_parts: list[str] = []
        for item in content:
            if isinstance(item, dict) and item.get("type") == "text" and isinstance(item.get("text"), str):
                text_parts.append(item["text"])
        return text_parts


llm_client = LLMClient()
