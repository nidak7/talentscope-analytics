import logging
import re
from datetime import UTC, datetime
from typing import Any

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.analytics_engine.skill_extractor import SkillExtractor
from app.core.cache import AsyncTTLCache
from app.core.config import get_settings
from app.ingestion.adzuna_client import AdzunaClient, AdzunaClientError
from app.schemas.sync import SyncResponse

logger = logging.getLogger(__name__)


class SyncEngine:
    def __init__(self, db: AsyncIOMotorDatabase, extractor: SkillExtractor, cache: AsyncTTLCache) -> None:
        self.db = db
        self.extractor = extractor
        self.cache = cache
        self.settings = get_settings()
        self.client = AdzunaClient()

    async def run(self, triggered_by: str | None = None) -> SyncResponse:
        started_at = datetime.now(tz=UTC)
        log_doc = {
            "source": "adzuna",
            "status": "running",
            "started_at": started_at,
            "ended_at": None,
            "triggered_by": triggered_by,
            "jobs_processed": 0,
            "errors": [],
        }
        log_insert = await self.db["ingestion_logs"].insert_one(log_doc)
        errors: list[str] = []
        jobs_processed = 0

        for keyword in self.settings.sync_keyword_list:
            for page in range(1, self.settings.adzuna_pages_per_sync + 1):
                try:
                    records = await self.client.search_jobs(page=page, keyword=keyword)
                except AdzunaClientError as exc:
                    errors.append(f"{keyword} page {page}: {exc}")
                    continue
                except Exception as exc:
                    logger.exception("Unexpected ingestion error for keyword '%s' page %s", keyword, page)
                    errors.append(f"{keyword} page {page}: {type(exc).__name__}")
                    continue

                for raw_job in records:
                    normalized = self._normalize_job(raw_job, keyword)
                    await self.db["jobs"].update_one(
                        {"source": normalized["source"], "external_id": normalized["external_id"]},
                        {"$set": normalized},
                        upsert=True,
                    )
                    jobs_processed += 1

        status = "success" if not errors else ("partial" if jobs_processed > 0 else "failed")
        ended_at = datetime.now(tz=UTC)
        await self.db["ingestion_logs"].update_one(
            {"_id": log_insert.inserted_id},
            {
                "$set": {
                    "status": status,
                    "ended_at": ended_at,
                    "jobs_processed": jobs_processed,
                    "errors": errors,
                }
            },
        )

        # Invalidate cached analytics snapshots after fresh data ingestion.
        await self.cache.invalidate_prefix("dashboard:")
        await self.cache.invalidate_prefix("role:")
        await self.cache.invalidate_prefix("skill-gap:")

        return SyncResponse(
            status=status,
            jobs_processed=jobs_processed,
            errors=errors,
            started_at=started_at,
            ended_at=ended_at,
        )

    def _normalize_job(self, raw_job: dict[str, Any], keyword: str) -> dict[str, Any]:
        title = (raw_job.get("title") or "").strip()
        description = (raw_job.get("description") or "").strip()
        location = (raw_job.get("location") or {}).get("display_name")
        company = (raw_job.get("company") or {}).get("display_name")
        external_id = str(raw_job.get("id") or raw_job.get("redirect_url") or title)

        posted_date_raw = str(raw_job.get("created") or "")
        posted_date = self._parse_datetime(posted_date_raw) or datetime.now(tz=UTC)

        combined_text = f"{title}\n{description}"
        skills = self.extractor.extract(combined_text)
        is_remote = bool(
            re.search(r"\b(remote|work from home|wfh|hybrid)\b", combined_text, flags=re.IGNORECASE)
        )

        return {
            "source": "adzuna",
            "external_id": external_id,
            "title": title,
            "company": company,
            "location": location,
            "country": self.settings.adzuna_country.upper(),
            "description": description,
            "url": raw_job.get("redirect_url") or "",
            "salary_min": raw_job.get("salary_min"),
            "salary_max": raw_job.get("salary_max"),
            "is_remote": is_remote,
            "search_keyword": keyword,
            "skills": skills,
            "posted_date": posted_date,
            "ingested_at": datetime.now(tz=UTC),
        }

    @staticmethod
    def _parse_datetime(value: str) -> datetime | None:
        if not value:
            return None
        try:
            return datetime.fromisoformat(value.replace("Z", "+00:00"))
        except ValueError:
            return None
