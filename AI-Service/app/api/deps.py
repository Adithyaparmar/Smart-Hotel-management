"""Shared FastAPI dependencies — currently just the internal-service auth check."""
from fastapi import Header, HTTPException, status

from app.config import settings


async def require_internal_key(x_internal_key: str = Header(default="")) -> None:
    """Guards every route in this service. Only the Node backend should ever
    call this API — never the browser/frontend directly — verified by a
    shared secret, mirroring the check Node applies in the opposite direction
    (`internalAuth` middleware) for AI tool callbacks."""
    if not x_internal_key or x_internal_key != settings.internal_service_key:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid internal service key")
