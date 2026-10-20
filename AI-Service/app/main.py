"""
THE CONSIGLIERE — AI microservice entrypoint.

Deliberately separate from the Node/Express backend (per the architecture
spec): this service owns LLM orchestration and RAG, and NEVER connects to
PostgreSQL directly. Every hotel fact or action it needs goes through the Node
backend's internal, authenticated tool-execution API, so authorization always
happens in one place.
"""
from contextlib import asynccontextmanager

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.api import chat, health
from app.config import settings
from app.services.node_client import node_client


@asynccontextmanager
async def lifespan(app: FastAPI):
    yield
    await node_client.aclose()


app = FastAPI(
    title="Luxury Mafia Hotel — The Consigliere AI Service",
    version="1.0.0",
    lifespan=lifespan,
)

# This service is reached only by the Node backend (server-to-server), so CORS
# is intentionally tight — no browser origin should ever call it directly.
app.add_middleware(
    CORSMiddleware,
    allow_origins=[],
    allow_credentials=False,
    allow_methods=["POST", "GET"],
    allow_headers=["*"],
)

app.include_router(health.router, prefix="/api")
app.include_router(chat.router, prefix="/api")
