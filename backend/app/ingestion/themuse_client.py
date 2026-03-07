import logging
from typing import Any

import httpx

logger = logging.getLogger(__name__)


class TheMuseClientError(Exception):
    pass


class TheMuseClient:
    def __init__(self) -> None:
        self.base_url = "https://www.themuse.com/api/public/jobs"
        self.headers = {
            "User-Agent": (
                "TalentScopeAnalytics/1.0 (+https://talentscope-analytics.vercel.app)"
            )
        }

    async def fetch_page(self, page: int = 1) -> list[dict[str, Any]]:
        params = {"page": page}
        async with httpx.AsyncClient(timeout=20, headers=self.headers) as client:
            response = await client.get(self.base_url, params=params)

        if response.status_code >= 400:
            logger.error("The Muse API failure %s: %s", response.status_code, response.text[:200])
            raise TheMuseClientError(f"The Muse request failed with status {response.status_code}")

        payload = response.json()
        data = payload.get("results", [])
        if not isinstance(data, list):
            return []
        return data
