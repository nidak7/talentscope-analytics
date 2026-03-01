from fastapi import APIRouter, Depends, Query
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.auth_core.deps import get_current_user
from app.core.cache import AsyncTTLCache
from app.db.mongo import get_db
from app.dependencies import get_cache
from app.schemas.auth import UserOut
from app.schemas.dashboard import DashboardStats
from app.schemas.job_feed import LiveJobOut
from app.schemas.role_intelligence import RoleIntelligenceResponse
from app.schemas.skill_gap import SkillGapRequest, SkillGapResponse

from .query_engine import MarketInsightsEngine

router = APIRouter(prefix="/insights", tags=["Market Insights"])


def get_insights_engine(
    db: AsyncIOMotorDatabase = Depends(get_db),
    cache: AsyncTTLCache = Depends(get_cache),
) -> MarketInsightsEngine:
    return MarketInsightsEngine(db, cache)


@router.get("/dashboard", response_model=DashboardStats)
async def dashboard(
    _: UserOut = Depends(get_current_user),
    engine: MarketInsightsEngine = Depends(get_insights_engine),
) -> DashboardStats:
    return await engine.dashboard()


@router.get("/role-intelligence", response_model=RoleIntelligenceResponse)
async def role_intelligence(
    title: str = Query(min_length=2, max_length=120),
    _: UserOut = Depends(get_current_user),
    engine: MarketInsightsEngine = Depends(get_insights_engine),
) -> RoleIntelligenceResponse:
    return await engine.role_intelligence(title)


@router.post("/skill-gap", response_model=SkillGapResponse)
async def skill_gap(
    payload: SkillGapRequest,
    _: UserOut = Depends(get_current_user),
    engine: MarketInsightsEngine = Depends(get_insights_engine),
) -> SkillGapResponse:
    return await engine.skill_gap(payload.known_skills, payload.role)


@router.get("/live-jobs", response_model=list[LiveJobOut])
async def live_jobs(
    limit: int = Query(default=20, ge=5, le=100),
    title: str | None = Query(default=None, min_length=2, max_length=120),
    _: UserOut = Depends(get_current_user),
    engine: MarketInsightsEngine = Depends(get_insights_engine),
) -> list[LiveJobOut]:
    return await engine.live_jobs(limit=limit, title=title)
