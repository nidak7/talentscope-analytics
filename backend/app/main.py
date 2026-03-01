import logging
import asyncio
from contextlib import asynccontextmanager

from apscheduler.schedulers.asyncio import AsyncIOScheduler
from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse

from app.admin.router import router as admin_router
from app.analytics_engine.skill_extractor import SkillExtractor
from app.auth_core.router import router as auth_router
from app.core.cache import AsyncTTLCache
from app.core.config import get_settings
from app.core.exceptions import AppException
from app.core.logging import setup_logging
from app.db.indexes import ensure_indexes
from app.db.mongo import mongo_manager
from app.ingestion.sync_engine import SyncEngine
from app.market_insights.router import router as insights_router

settings = get_settings()
setup_logging()
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    await mongo_manager.connect()
    db = mongo_manager.db
    if db is None:
        raise RuntimeError("MongoDB initialization failed")

    await ensure_indexes(db)
    cache = AsyncTTLCache(ttl_seconds=settings.cache_ttl_seconds)
    extractor = SkillExtractor()
    sync_engine = SyncEngine(db=db, extractor=extractor, cache=cache)

    app.state.db = db
    app.state.cache = cache
    app.state.sync_engine = sync_engine
    app.state.scheduler = None

    existing_job_count = await db["jobs"].count_documents({})
    if existing_job_count == 0 and settings.has_reliable_job_api_credentials:
        logger.info("No jobs found at startup. Triggering initial ingestion run.")
        asyncio.create_task(sync_engine.run(triggered_by="startup-bootstrap"))

    if settings.sync_interval_minutes > 0:
        scheduler = AsyncIOScheduler()
        scheduler.add_job(
            sync_engine.run,
            "interval",
            minutes=settings.sync_interval_minutes,
            kwargs={"triggered_by": "scheduler"},
            max_instances=1,
            coalesce=True,
            id="scheduled_adzuna_sync",
        )
        scheduler.start()
        app.state.scheduler = scheduler
        logger.info("Scheduled ingestion enabled (%s minutes)", settings.sync_interval_minutes)

    logger.info("TalentScope Analytics API started")
    try:
        yield
    finally:
        scheduler = app.state.scheduler
        if scheduler:
            scheduler.shutdown(wait=False)
        await mongo_manager.disconnect()
        logger.info("TalentScope Analytics API stopped")


def create_app() -> FastAPI:
    application = FastAPI(title=settings.app_name, version="1.0.0", lifespan=lifespan)

    application.add_middleware(
        CORSMiddleware,
        allow_origins=settings.cors_origin_list,
        allow_credentials=True,
        allow_methods=["*"],
        allow_headers=["*"],
    )

    @application.exception_handler(AppException)
    async def app_exception_handler(_: Request, exc: AppException) -> JSONResponse:
        return JSONResponse(status_code=exc.status_code, content={"detail": exc.message})

    @application.exception_handler(Exception)
    async def unexpected_exception_handler(_: Request, exc: Exception) -> JSONResponse:
        logger.exception("Unhandled error: %s", exc)
        return JSONResponse(status_code=500, content={"detail": "Internal server error"})

    @application.get("/health")
    async def health() -> dict[str, str]:
        return {"status": "ok"}

    application.include_router(auth_router, prefix=settings.api_v1_prefix)
    application.include_router(insights_router, prefix=settings.api_v1_prefix)
    application.include_router(admin_router, prefix=settings.api_v1_prefix)
    return application


app = create_app()
