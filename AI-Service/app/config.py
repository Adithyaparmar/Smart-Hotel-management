"""Centralized settings, loaded from environment variables (.env in dev)."""
from pydantic_settings import BaseSettings, SettingsConfigDict


class Settings(BaseSettings):
    model_config = SettingsConfigDict(env_file=".env", extra="ignore")

    port: int = 8000
    env: str = "development"

    internal_service_key: str = "dev_internal_key"
    node_backend_url: str = "http://localhost:5000"

    llm_provider: str = "gemini"  # "gemini" | "anthropic" | "openai"
    llm_model: str = "gemini-3.8-flash"
    gemini_api_key: str = ""
    anthropic_api_key: str = ""
    openai_api_key: str = ""

    embedding_provider: str = "openai"
    embedding_model: str = "text-embedding-3-small"
    openai_embedding_api_key: str = ""

    rag_top_k: int = 4
    vector_store_path: str = "./data/vector_store.json"

    @property
    def is_prod(self) -> bool:
        return self.env == "production"


settings = Settings()
