import pytest
from mongomock_motor import AsyncMongoMockClient

from app.analytics_engine.skill_extractor import SkillExtractor
from app.core.cache import AsyncTTLCache
from app.ingestion.sync_engine import SyncEngine


@pytest.mark.asyncio
async def test_country_specific_sync_requires_reliable_api_credentials():
    db = AsyncMongoMockClient()["talentscope_test"]
    cache = AsyncTTLCache(ttl_seconds=60)
    engine = SyncEngine(db=db, extractor=SkillExtractor(), cache=cache)
    engine.settings.adzuna_app_id = "demo-id"
    engine.settings.adzuna_app_key = "demo-key"

    await db["jobs"].insert_one({"source": "seed", "external_id": "1", "title": "Old job"})

    response = await engine.run(
        triggered_by="admin@talentscope.app",
        country="in",
        max_jobs=1000,
        reset_existing=True,
    )

    assert response.status == "failed"
    assert response.jobs_processed == 0
    assert "IN-only sync requires working Adzuna credentials" in response.errors[0]
    assert await db["jobs"].count_documents({}) == 0


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
