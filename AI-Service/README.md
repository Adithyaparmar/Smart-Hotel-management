# The Consigliere — AI Concierge Service

Separate Python/FastAPI microservice implementing Luxury Mafia Hotel's AI
concierge: RAG-grounded, tool-calling LLM orchestration. This service **never
connects to PostgreSQL**. Every fact or action it needs — room search,
pricing, booking, cancellation, a guest's own booking history — goes through
a controlled tool call back into the Node backend's internal API
(`POST /api/internal/ai/tools/run`), which re-applies the exact same
authorization rules as the public REST API.

```
Node backend  ──POST /api/orchestrate (x-internal-key)──►  FastAPI (this service)
                                                                   │
                                                     RAG retrieval + LLM call
                                                                   │
                                                     LLM requests a tool call
                                                                   │
                                                     ◄── POST /api/internal/ai/tools/run
                                                          (x-internal-key, userId, userRole)
Node backend (executes the tool against Postgres,
 under the same auth rules as the public API) ────►  result returned to FastAPI
                                                                   │
                                                     LLM incorporates result,
                                                     produces final reply
                                                                   │
Node backend  ◄────────────────────────────────────  { reply, toolCalls, ... }
```

## Setup

```bash
python -m venv .venv
source .venv/bin/activate        # Windows: .venv\Scripts\activate
pip install -r requirements.txt
cp .env.example .env
# fill in: an LLM provider key, and INTERNAL_SERVICE_KEY matching the Node
# backend's AI_SERVICE_INTERNAL_KEY exactly
```

## Ingest the RAG knowledge base (optional but recommended)

The service works with zero setup (it falls back to the raw policy documents
if the vector store is empty), but for real semantic retrieval, embed and
index them once:

```bash
python -m app.rag.ingest
```

Re-run this whenever `app/rag/documents.py` changes (or move to loading these
documents from a CMS/admin-managed source and re-ingesting on save).

## Run

```bash
uvicorn app.main:app --reload --port 8000
```

## Folder structure

```
app/
├── api/            FastAPI routers — chat.py (/api/orchestrate), health.py, deps.py (internal-key auth)
├── agents/         concierge_agent.py — the orchestration loop (system prompt + RAG + tool-calling)
├── tools/          definitions.py (tool JSON schemas), executor.py (delegates to Node)
├── rag/            documents.py (source knowledge), chunking.py, embeddings.py,
│                    vector_store.py (file-backed, swappable), ingest.py, retriever.py
├── memory/         memory_client.py — non-sensitive guest preference memory
├── models/         schemas.py — Pydantic request/response models
├── services/       llm_client.py (provider-agnostic, generic tool-calling turns),
│                    node_client.py (httpx client back to Node's internal API)
├── config.py       pydantic-settings, reads .env
└── main.py         FastAPI app
```

## The 10 controlled tools

Defined once in `app/tools/definitions.py`, shared between the LLM's tool
schema and Node's `aiTools.service.js` tool registry (the names must match
exactly on both sides):

`searchRooms`, `checkAvailability`, `getRoomDetails`, `calculateBookingPrice`,
`getHotelInformation`, `getHotelPolicies`, `getUserBookings`,
`getBookingStatus`, `createBooking` *(sensitive)*, `cancelBooking`
*(sensitive)*.

Sensitive tools only execute once `params.confirmed = true` — the executor
short-circuits with `{"requiresConfirmation": true, ...}` otherwise (and Node
enforces the same rule independently, in case a future orchestrator change
ever forgets to check). The orchestrator is instructed (system prompt) to
state the concrete details and get explicit guest confirmation across turns
before ever setting `confirmed: true`.

## RAG pipeline

`documents → chunking → embeddings → vector store → retrieval → LLM`, matching
the requested architecture:

- **Documents**: `app/rag/documents.py` — hotel policies, cancellation policy,
  check-in/out rules, amenities, room information, dining, facilities, FAQs.
- **Chunking**: sentence-aware, ~120-word chunks with overlap (`chunking.py`).
- **Embeddings**: provider-abstracted (`embeddings.py`), defaults to OpenAI
  embeddings; swap in a self-hosted model if you don't want an external
  embeddings dependency.
- **Vector store**: a small file-backed cosine-similarity store
  (`vector_store.py`) — enough to run locally with zero infra. Swap for
  pgvector (alongside the existing Postgres instance), Pinecone, Qdrant, etc.
  behind the same `add`/`search` interface for production.
- **Retrieval**: `retriever.py` — top-k (default 4) semantic search, with a
  graceful fallback to the raw documents if the store hasn't been ingested or
  the embeddings provider is unavailable.

## AI memory

`app/memory/memory_client.py` only ever reads/writes the categories defined on
the Node side: `ROOM_PREFERENCE`, `VIEW_PREFERENCE`, `HOSPITALITY_PREFERENCE`,
`CONVERSATION_CONTEXT`, `OTHER`. Nothing sensitive (health, payment, identity
documents) is ever stored here — see `aiTools.service.js` on the Node side for
where that boundary is actually enforced.

## Known simplifications (call these out if you extend this)

- Tool-call threading (Anthropic `tool_use`/`tool_result` blocks, OpenAI
  `tool_calls`/`tool` role) is handled correctly **within a single HTTP
  request's agentic loop**, but persisted conversation history
  (`AIMessage` rows in Postgres) only replays plain USER/ASSISTANT text across
  separate chat turns — not the intermediate tool-call scaffolding. This is
  sufficient for the model to stay grounded turn-to-turn, but if you need the
  model to "remember" the exact tool calls it made in a prior turn, persist
  and replay the full turn structure instead.
- The booking/cancellation confirmation flow is server-side authoritative:
  Node stages the exact proposed `{toolName, params}` in memory, keyed by
  `conversationId:toolName`, the moment a sensitive tool is first proposed
  (see `aiTools.service.js#executeTool`). A later "confirmed" call only
  executes if it matches that staged entry (same conversation, same tool,
  same user, not expired, one-time use) — and always runs against the
  originally staged params, never whatever the LLM resends. This is what
  stops a guest's "Yes" from being able to confirm a different or
  hallucinated action than the one actually shown to them. The store itself
  is an in-memory `Map` (single-process, 5-minute TTL) — fine for local/
  single-instance use; move it to Redis/DB keyed the same way before running
  multiple Node instances behind a load balancer.
