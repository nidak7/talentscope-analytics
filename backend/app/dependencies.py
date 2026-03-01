from fastapi import Request

from app.core.cache import AsyncTTLCache
from app.ingestion.sync_engine import SyncEngine


def get_cache(request: Request) -> AsyncTTLCache:
    return request.app.state.cache


def get_sync_engine(request: Request) -> SyncEngine:
    return request.app.state.sync_engine

