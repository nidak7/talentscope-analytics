import pytest
from mongomock_motor import AsyncMongoMockClient

from app.analytics_engine.skill_extractor import SkillExtractor
from app.core.cache import AsyncTTLCache
from app.ingestion.sync_engine import SyncEngine


def test_curated_filter_keeps_india_tech_and_blocks_medical_roles():
    db = AsyncMongoMockClient()["talentscope_test"]
    cache = AsyncTTLCache(ttl_seconds=60)
    engine = SyncEngine(db=db, extractor=SkillExtractor(), cache=cache)

    assert engine._is_curated_job(
        {
            "title": "Software Engineer",
            "description": "Python backend role",
            "location": "Bengaluru, India",
            "skills": ["python", "sql"],
            "search_keyword": "software engineer",
        },
        "in",
    )

    assert not engine._is_curated_job(
        {
            "title": "Occupational Therapist",
            "description": "Clinical healthcare role",
            "location": "Mumbai, India",
            "skills": [],
            "search_keyword": None,
        },
        "in",
    )


@pytest.mark.asyncio
async def test_country_specific_sync_uses_curated_public_fallback_without_credentials(monkeypatch):
    db = AsyncMongoMockClient()["talentscope_test"]
    cache = AsyncTTLCache(ttl_seconds=60)
    engine = SyncEngine(db=db, extractor=SkillExtractor(), cache=cache)
    engine.settings.adzuna_app_id = "demo-id"
    engine.settings.adzuna_app_key = "demo-key"

    await db["jobs"].insert_one({"source": "seed", "external_id": "1", "title": "Old job"})

    async def fake_public_sync(max_jobs: int | None = None, country_code: str = "in"):
        await db["jobs"].insert_one(
            {
                "source": "remotive",
                "external_id": "fresh-1",
                "title": "Software Engineer",
                "country": "IN",
            }
        )
        return 1, []

    monkeypatch.setattr(engine, "_sync_from_public_feed", fake_public_sync)

    response = await engine.run(
        triggered_by="admin@talentscope.app",
        country="in",
        max_jobs=1000,
        reset_existing=True,
    )

    assert response.status == "partial"
    assert response.jobs_processed == 1
    assert "Adzuna credentials missing. Running curated public fallback for IN." in response.errors[0]
    assert await db["jobs"].count_documents({}) == 1


@pytest.mark.asyncio
async def test_country_specific_sync_uses_requested_country_and_limit(monkeypatch):
    db = AsyncMongoMockClient()["talentscope_test"]
    cache = AsyncTTLCache(ttl_seconds=60)
    engine = SyncEngine(db=db, extractor=SkillExtractor(), cache=cache)
    engine.settings.adzuna_app_id = "real-id"
    engine.settings.adzuna_app_key = "real-key"

    captured: dict[str, object] = {}

    async def fake_adzuna_sync(country_code: str, max_jobs: int | None = None):
        captured["country_code"] = country_code
        captured["max_jobs"] = max_jobs
        return 250, []

    monkeypatch.setattr(engine, "_sync_from_adzuna", fake_adzuna_sync)

    response = await engine.run(
        triggered_by="admin@talentscope.app",
        country="in",
        max_jobs=1000,
    )

    assert response.status == "partial"
    assert response.jobs_processed == 250
    assert captured == {"country_code": "in", "max_jobs": 1000}
    assert "Requested up to 1000 jobs for IN, but the source returned 250." in response.errors


@pytest.mark.asyncio
async def test_adzuna_sync_expands_page_limit_for_large_requested_dataset(monkeypatch):
    db = AsyncMongoMockClient()["talentscope_test"]
    cache = AsyncTTLCache(ttl_seconds=60)
    engine = SyncEngine(db=db, extractor=SkillExtractor(), cache=cache)
    engine.settings.adzuna_results_per_page = 50
    engine.settings.adzuna_pages_per_sync = 2
    engine.settings.sync_keywords = "software engineer,data analyst"

    visited_pages: list[int] = []

    async def fake_search_jobs(page: int, keyword: str, country: str | None = None):
        visited_pages.append(page)
        return []

    monkeypatch.setattr(engine.adzuna_client, "search_jobs", fake_search_jobs)

    jobs_processed, errors = await engine._sync_from_adzuna(country_code="in", max_jobs=1000)

    assert jobs_processed == 0
    assert errors == []
    assert max(visited_pages) == 10
