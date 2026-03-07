import logging
import re
from datetime import UTC, datetime
from html import unescape
from typing import Any

from motor.motor_asyncio import AsyncIOMotorDatabase

from app.analytics_engine.skill_extractor import SkillExtractor
from app.analytics_engine.skill_catalog import SKILL_CANONICAL_MAP
from app.core.cache import AsyncTTLCache
from app.core.config import get_settings
from app.ingestion.adzuna_client import AdzunaClient, AdzunaClientError
from app.ingestion.arbeitnow_client import ArbeitnowClient, ArbeitnowClientError
from app.ingestion.remotive_client import RemotiveClient, RemotiveClientError
from app.ingestion.themuse_client import TheMuseClient, TheMuseClientError
from app.schemas.sync import SyncResponse

logger = logging.getLogger(__name__)


class SyncEngine:
    def __init__(self, db: AsyncIOMotorDatabase, extractor: SkillExtractor, cache: AsyncTTLCache) -> None:
        self.db = db
        self.extractor = extractor
        self.cache = cache
        self.settings = get_settings()
        self.adzuna_client = AdzunaClient()
        self.arbeitnow_client = ArbeitnowClient()
        self.remotive_client = RemotiveClient()
        self.themuse_client = TheMuseClient()

    async def run(
        self,
        triggered_by: str | None = None,
        *,
        country: str | None = None,
        max_jobs: int | None = None,
        reset_existing: bool = False,
    ) -> SyncResponse:
        started_at = datetime.now(tz=UTC)
        country_code = (country or self.settings.adzuna_country).lower()
        country_specific_sync = country is not None
        source_label = "adzuna" if self.settings.has_reliable_job_api_credentials else "public-feeds"
        log_doc = {
            "source": f"{source_label}:{country_code.upper()}",
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

        if reset_existing:
            cleared_result = await self.db["jobs"].delete_many({})
            logger.info("Cleared %s existing jobs before sync", cleared_result.deleted_count)

        if country_specific_sync and not self.settings.has_reliable_job_api_credentials:
            errors.append(
                f"{country_code.upper()}-only sync requires working Adzuna credentials. "
                "The current deployment is using public fallback feeds, which cannot provide a reliable country-specific dataset."
            )

        if self.settings.has_reliable_job_api_credentials:
            adzuna_count, adzuna_errors = await self._sync_from_adzuna(country_code=country_code, max_jobs=max_jobs)
            jobs_processed += adzuna_count
            errors.extend(adzuna_errors)
        elif not country_specific_sync:
            errors.append("Adzuna credentials missing. Falling back to public job feed.")

        # Ensure the product has data even when premium credentials are absent or temporarily failing.
        if jobs_processed == 0 and not country_specific_sync:
            public_count, public_errors = await self._sync_from_public_feed(max_jobs=max_jobs)
            jobs_processed += public_count
            errors.extend(public_errors)

        if max_jobs and jobs_processed < max_jobs and self.settings.has_reliable_job_api_credentials:
            errors.append(
                f"Requested up to {max_jobs} jobs for {country_code.upper()}, but the source returned {jobs_processed}."
            )
        elif max_jobs and jobs_processed < max_jobs and not self.settings.has_reliable_job_api_credentials and not country_specific_sync:
            errors.append(
                f"Requested up to {max_jobs} jobs, but the public fallback feed returned {jobs_processed}."
            )

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

        await self.cache.invalidate_prefix("dashboard:")
        await self.cache.invalidate_prefix("role:")
        await self.cache.invalidate_prefix("skill-gap:")
        await self.cache.invalidate_prefix("live-jobs:")

        return SyncResponse(
            status=status,
            jobs_processed=jobs_processed,
            errors=errors,
            started_at=started_at,
            ended_at=ended_at,
        )

    async def _sync_from_adzuna(self, country_code: str, max_jobs: int | None = None) -> tuple[int, list[str]]:
        errors: list[str] = []
        jobs_processed = 0

        for keyword in self.settings.sync_keyword_list:
            for page in range(1, self.settings.adzuna_pages_per_sync + 1):
                if max_jobs is not None and jobs_processed >= max_jobs:
                    return jobs_processed, errors
                try:
                    records = await self.adzuna_client.search_jobs(page=page, keyword=keyword, country=country_code)
                except AdzunaClientError as exc:
                    errors.append(f"Adzuna {keyword} page {page}: {exc}")
                    continue
                except Exception as exc:
                    logger.exception("Unexpected ingestion error for keyword '%s' page %s", keyword, page)
                    errors.append(f"Adzuna {keyword} page {page}: {type(exc).__name__}")
                    continue

                for raw_job in records:
                    normalized = self._normalize_adzuna_job(raw_job, keyword)
                    await self.db["jobs"].update_one(
                        {"source": normalized["source"], "external_id": normalized["external_id"]},
                        {"$set": normalized},
                        upsert=True,
                    )
                    jobs_processed += 1
                    if max_jobs is not None and jobs_processed >= max_jobs:
                        return jobs_processed, errors

        return jobs_processed, errors

    async def _sync_from_public_feed(self, max_jobs: int | None = None) -> tuple[int, list[str]]:
        errors: list[str] = []
        jobs_processed = 0

        public_sources = (
            ("arbeitnow", self.arbeitnow_client.fetch_page, self._normalize_arbeitnow_job, ArbeitnowClientError),
            ("remotive", self.remotive_client.fetch_page, self._normalize_remotive_job, RemotiveClientError),
            ("themuse", self.themuse_client.fetch_page, self._normalize_themuse_job, TheMuseClientError),
        )

        for source_name, fetch_page, normalize_job, handled_error in public_sources:
            for page in range(1, self.settings.fallback_public_pages + 1):
                if max_jobs is not None and jobs_processed >= max_jobs:
                    return jobs_processed, errors
                try:
                    records = await fetch_page(page)
                except handled_error as exc:
                    errors.append(f"{source_name.title()} page {page}: {exc}")
                    break
                except Exception as exc:
                    logger.exception("Unexpected public ingestion error for %s page %s", source_name, page)
                    errors.append(f"{source_name.title()} page {page}: {type(exc).__name__}")
                    break

                if not records:
                    break

                for raw_job in records:
                    normalized = normalize_job(raw_job)
                    if not normalized:
                        continue
                    await self.db["jobs"].update_one(
                        {"source": normalized["source"], "external_id": normalized["external_id"]},
                        {"$set": normalized},
                        upsert=True,
                    )
                    jobs_processed += 1
                    if max_jobs is not None and jobs_processed >= max_jobs:
                        return jobs_processed, errors

        if jobs_processed == 0 and not errors:
            errors.append("Public job feed returned zero records.")

        return jobs_processed, errors

    def _normalize_adzuna_job(self, raw_job: dict[str, Any], keyword: str) -> dict[str, Any]:
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

    def _normalize_arbeitnow_job(self, raw_job: dict[str, Any]) -> dict[str, Any] | None:
        title = (raw_job.get("title") or "").strip()
        if not title:
            return None

        raw_description = raw_job.get("description") or ""
        description = self._strip_html(raw_description).strip()
        tags = raw_job.get("tags") or []
        tags_text = " ".join([str(tag) for tag in tags if str(tag).strip()])
        combined_text = f"{title}\n{description}\n{tags_text}".strip()

        external_id = str(raw_job.get("slug") or raw_job.get("url") or title)
        company = (raw_job.get("company_name") or raw_job.get("company") or "").strip() or None
        location = (raw_job.get("location") or "").strip() or None
        url = (raw_job.get("url") or "").strip()
        is_remote = bool(raw_job.get("remote")) or bool(
            re.search(r"\b(remote|work from home|wfh|hybrid)\b", combined_text, flags=re.IGNORECASE)
        )

        posted_date = self._parse_arbeitnow_date(raw_job.get("created_at")) or datetime.now(tz=UTC)
        skills = self.extractor.extract(combined_text)
        skills = self._merge_tag_skills(skills, tags)
        search_keyword = self._match_keyword(combined_text)

        return {
            "source": "arbeitnow",
            "external_id": external_id,
            "title": title,
            "company": company,
            "location": location,
            "country": "GLOBAL",
            "description": description or title,
            "url": url,
            "salary_min": None,
            "salary_max": None,
            "is_remote": is_remote,
            "search_keyword": search_keyword,
            "skills": skills,
            "posted_date": posted_date,
            "ingested_at": datetime.now(tz=UTC),
        }

    def _normalize_remotive_job(self, raw_job: dict[str, Any]) -> dict[str, Any] | None:
        title = (raw_job.get("title") or "").strip()
        if not title:
            return None

        raw_description = raw_job.get("description") or ""
        description = self._strip_html(raw_description).strip()
        tags = self._coerce_text_list(raw_job.get("tags"))
        category = str(raw_job.get("category") or "").strip()
        location = str(raw_job.get("candidate_required_location") or "").strip() or None
        combined_text = f"{title}\n{description}\n{category}\n{' '.join(tags)}".strip()
        salary_min, salary_max = self._parse_salary_range(raw_job.get("salary"))

        external_id = str(raw_job.get("id") or raw_job.get("url") or title)
        company = (raw_job.get("company_name") or "").strip() or None
        url = (raw_job.get("url") or "").strip()
        posted_date = self._parse_datetime(str(raw_job.get("publication_date") or "")) or datetime.now(tz=UTC)
        skills = self.extractor.extract(combined_text)
        skills = self._merge_tag_skills(skills, [*tags, category])
        search_keyword = self._match_keyword(combined_text)

        return {
            "source": "remotive",
            "external_id": external_id,
            "title": title,
            "company": company,
            "location": location,
            "country": "GLOBAL",
            "description": description or title,
            "url": url,
            "salary_min": salary_min,
            "salary_max": salary_max,
            "is_remote": True,
            "search_keyword": search_keyword,
            "skills": skills,
            "posted_date": posted_date,
            "ingested_at": datetime.now(tz=UTC),
        }

    def _normalize_themuse_job(self, raw_job: dict[str, Any]) -> dict[str, Any] | None:
        title = (raw_job.get("name") or raw_job.get("short_name") or "").strip()
        if not title:
            return None

        raw_description = raw_job.get("contents") or ""
        description = self._strip_html(raw_description).strip()
        company = self._extract_named_value(raw_job.get("company"))
        locations = self._extract_named_values(raw_job.get("locations"))
        categories = self._extract_named_values(raw_job.get("categories"))
        levels = self._extract_named_values(raw_job.get("levels"))
        tags = self._extract_named_values(raw_job.get("tags"))

        location = ", ".join(locations[:2]) or None
        tag_terms = [*categories, *levels, *tags]
        combined_text = f"{title}\n{description}\n{' '.join(tag_terms)}\n{location or ''}".strip()

        refs = raw_job.get("refs") or {}
        external_id = str(raw_job.get("id") or refs.get("landing_page") or title)
        url = str(refs.get("landing_page") or "").strip()
        posted_date = self._parse_datetime(str(raw_job.get("publication_date") or "")) or datetime.now(tz=UTC)
        is_remote = bool(
            re.search(r"\b(remote|work from home|wfh|hybrid)\b", combined_text, flags=re.IGNORECASE)
        )
        skills = self.extractor.extract(combined_text)
        skills = self._merge_tag_skills(skills, tag_terms)
        search_keyword = self._match_keyword(combined_text)

        return {
            "source": "themuse",
            "external_id": external_id,
            "title": title,
            "company": company,
            "location": location,
            "country": "GLOBAL",
            "description": description or title,
            "url": url,
            "salary_min": None,
            "salary_max": None,
            "is_remote": is_remote,
            "search_keyword": search_keyword,
            "skills": skills,
            "posted_date": posted_date,
            "ingested_at": datetime.now(tz=UTC),
        }

    @staticmethod
    def _merge_tag_skills(extracted: list[str], tags: list[Any]) -> list[str]:
        normalized = {skill.lower() for skill in extracted}
        for raw in tags or []:
            tag = str(raw).strip().lower()
            if not tag:
                continue
            canonical = SKILL_CANONICAL_MAP.get(tag)
            if canonical:
                normalized.add(canonical)
        return sorted(normalized)

    @staticmethod
    def _coerce_text_list(value: Any) -> list[str]:
        if value is None:
            return []
        if isinstance(value, list):
            return [str(item).strip() for item in value if str(item).strip()]
        text = str(value).strip()
        return [text] if text else []

    @staticmethod
    def _extract_named_value(value: Any) -> str | None:
        values = SyncEngine._extract_named_values(value)
        return values[0] if values else None

    @staticmethod
    def _extract_named_values(value: Any) -> list[str]:
        if value is None:
            return []
        if isinstance(value, list):
            flattened: list[str] = []
            for item in value:
                flattened.extend(SyncEngine._extract_named_values(item))
            return flattened
        if isinstance(value, dict):
            name = str(value.get("name") or value.get("short_name") or "").strip()
            return [name] if name else []
        text = str(value).strip()
        return [text] if text else []

    @staticmethod
    def _parse_salary_range(raw_salary: Any) -> tuple[float | None, float | None]:
        text = str(raw_salary or "").strip().lower()
        if not text:
            return None, None

        multiplier = 1.0
        if "/hour" in text or " per hour" in text or " hourly" in text:
            multiplier = 2080.0
        elif "/day" in text or " per day" in text:
            multiplier = 260.0
        elif "/month" in text or " per month" in text:
            multiplier = 12.0

        matches = re.findall(r"(\d+(?:\.\d+)?)\s*([kKmM]?)", text.replace(",", ""))
        if not matches:
            return None, None

        values: list[float] = []
        for number_text, suffix in matches[:2]:
            value = float(number_text)
            if suffix.lower() == "k":
                value *= 1_000
            elif suffix.lower() == "m":
                value *= 1_000_000
            values.append(value * multiplier)

        if not values:
            return None, None
        if len(values) == 1:
            return values[0], values[0]
        return min(values), max(values)

    def _match_keyword(self, combined_text: str) -> str | None:
        text = combined_text.lower()
        for keyword in self.settings.sync_keyword_list:
            if keyword.lower() in text:
                return keyword
        return None

    @staticmethod
    def _strip_html(raw_html: str) -> str:
        text = re.sub(r"<[^>]+>", " ", raw_html)
        text = re.sub(r"\s+", " ", text)
        return unescape(text)

    @staticmethod
    def _parse_datetime(value: str) -> datetime | None:
        if not value:
            return None
        try:
            return datetime.fromisoformat(value.replace("Z", "+00:00"))
        except ValueError:
            return None

    @staticmethod
    def _parse_arbeitnow_date(value: Any) -> datetime | None:
        if value is None:
            return None

        if isinstance(value, (int, float)):
            try:
                return datetime.fromtimestamp(value, tz=UTC)
            except (OverflowError, OSError, ValueError):
                return None

        value_text = str(value).strip()
        if not value_text:
            return None

        if value_text.isdigit():
            try:
                return datetime.fromtimestamp(int(value_text), tz=UTC)
            except (OverflowError, OSError, ValueError):
                return None

        try:
            return datetime.fromisoformat(value_text.replace("Z", "+00:00"))
        except ValueError:
            return None
