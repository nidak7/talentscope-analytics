from pydantic import BaseModel

from app.schemas.dashboard import SkillCount, TrendPoint


class SalarySnapshot(BaseModel):
    min: float | None = None
    max: float | None = None
    median: float | None = None


class RoleIntelligenceResponse(BaseModel):
    role: str
    total_jobs: int
    salary: SalarySnapshot
    top_skills: list[SkillCount]
    top_locations: list[SkillCount]
    hiring_trend: list[TrendPoint]
    market_heat_score: float

