import logging
from typing import Any

import httpx

from app.core.config import get_settings

logger = logging.getLogger(__name__)


class AdzunaClientError(Exception):
    pass


class AdzunaClient:
    def __init__(self) -> None:
        self.settings = get_settings()
        self.base_url = "https://api.adzuna.com/v1/api/jobs"

    async def search_jobs(self, page: int, keyword: str, country: str | None = None) -> list[dict[str, Any]]:
        params = {
            "app_id": self.settings.adzuna_app_id,
            "app_key": self.settings.adzuna_app_key,
            "what": keyword,
            "results_per_page": self.settings.adzuna_results_per_page,
            "sort_by": "date",
            "content-type": "application/json",
        }
        country_code = (country or self.settings.adzuna_country).lower()
        url = f"{self.base_url}/{country_code}/search/{page}"

        async with httpx.AsyncClient(timeout=20) as client:
            response = await client.get(url, params=params)

        if response.status_code >= 400:
            logger.error("Adzuna API failure %s: %s", response.status_code, response.text[:200])
            raise AdzunaClientError(f"Adzuna request failed with status {response.status_code}")

        payload = response.json()
        return payload.get("results", [])
