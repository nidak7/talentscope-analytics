import asyncio
import time
from typing import Any


class AsyncTTLCache:
    def __init__(self, ttl_seconds: int) -> None:
        self.ttl_seconds = ttl_seconds
        self._cache: dict[str, tuple[float, Any]] = {}
        self._lock = asyncio.Lock()

    async def get(self, key: str) -> Any | None:
        async with self._lock:
            item = self._cache.get(key)
            if not item:
                return None

            expires_at, value = item
            if expires_at < time.time():
                self._cache.pop(key, None)
                return None
            return value

    async def set(self, key: str, value: Any) -> None:
        async with self._lock:
            self._cache[key] = (time.time() + self.ttl_seconds, value)

    async def invalidate_prefix(self, prefix: str) -> None:
        async with self._lock:
            keys_to_drop = [key for key in self._cache if key.startswith(prefix)]
            for key in keys_to_drop:
                self._cache.pop(key, None)

