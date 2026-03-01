import logging
from typing import Any

import httpx

logger = logging.getLogger(__name__)


class ArbeitnowClientError(Exception):
    pass


class ArbeitnowClient:
    """Public job feed client used as a fallback when premium providers are unavailable."""

    def __init__(self) -> None:
        self.base_url = "https://www.arbeitnow.com/api/job-board-api"

    async def fetch_page(self, page: int = 1) -> list[dict[str, Any]]:
        params = {"page": page}
        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.get(self.base_url, params=params)

        if response.status_code >= 400:
            logger.error("Arbeitnow API failure %s: %s", response.status_code, response.text[:200])
            raise ArbeitnowClientError(f"Arbeitnow request failed with status {response.status_code}")

        payload = response.json()
        data = payload.get("data", [])
        if not isinstance(data, list):
            return []
        return data

