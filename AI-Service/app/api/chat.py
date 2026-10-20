from fastapi import APIRouter, Depends

from app.agents.concierge_agent import handle_conversation_turn
from app.api.deps import require_internal_key
from app.models.schemas import OrchestrateRequest, OrchestrateResponse

router = APIRouter(dependencies=[Depends(require_internal_key)])


@router.post("/orchestrate", response_model=OrchestrateResponse, response_model_by_alias=True)
async def orchestrate(request: OrchestrateRequest) -> OrchestrateResponse:
    """Called by the Node backend for every chat turn. See
    `app/agents/concierge_agent.py` for the full RAG + tool-calling loop."""
    return await handle_conversation_turn(request)
