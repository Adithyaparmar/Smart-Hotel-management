"""Pydantic schemas shared across the AI service's API, agents and tools."""
from __future__ import annotations

from typing import Any, Literal, Optional

from pydantic import BaseModel, Field


class HistoryMessage(BaseModel):
    role: Literal["USER", "ASSISTANT", "SYSTEM", "TOOL"]
    content: str


class OrchestrateRequest(BaseModel):
    """What the Node backend sends for every chat turn. `userId`/`userRole` are the
    backend's own verified identity for the human at the other end of the chat —
    this is the *only* identity the AI service ever acts under; it is never
    something the AI service itself decides or that arrives from the browser."""

    conversation_id: str = Field(alias="conversationId")
    user_id: str = Field(alias="userId")
    user_role: str = Field(alias="userRole")
    user_first_name: Optional[str] = Field(default=None, alias="userFirstName")
    message: str
    history: list[HistoryMessage] = Field(default_factory=list)

    class Config:
        populate_by_name = True


class ToolCallRecord(BaseModel):
    tool_name: str
    params: dict[str, Any]
    result: Optional[Any] = None
    required_confirmation: bool = False


class OrchestrateResponse(BaseModel):
    reply: str
    requires_confirmation: bool = Field(default=False, alias="requiresConfirmation")
    pending_action: Optional[dict[str, Any]] = Field(default=None, alias="pendingAction")
    tool_calls: list[ToolCallRecord] = Field(default_factory=list, alias="toolCalls")

    class Config:
        populate_by_name = True
        allow_population_by_field_name = True


class ToolDefinition(BaseModel):
    name: str
    description: str
    parameters: dict[str, Any]
    requires_confirmation: bool = False
