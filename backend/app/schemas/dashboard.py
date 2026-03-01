from pydantic import BaseModel


class SkillCount(BaseModel):
    skill: str
    count: int


class SalaryBin(BaseModel):
    band: str
    count: int


class RemoteRatio(BaseModel):
    remote: int
    onsite: int
    hybrid_or_unknown: int


class TrendPoint(BaseModel):
    date: str
    count: int


class DashboardStats(BaseModel):
    total_jobs: int
    top_skills: list[SkillCount]
    salary_distribution: list[SalaryBin]
    remote_ratio: RemoteRatio
    hiring_trend: list[TrendPoint]
    market_heat_score: float

