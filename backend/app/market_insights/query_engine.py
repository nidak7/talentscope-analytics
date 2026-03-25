import math
import re
from datetime import UTC, datetime, timedelta
from statistics import median

from bson import ObjectId
from motor.motor_asyncio import AsyncIOMotorDatabase

from app.core.cache import AsyncTTLCache
from app.schemas.dashboard import DashboardStats, RemoteRatio, SalaryBin, SkillCount, TrendPoint
from app.schemas.job_feed import LiveJobOut
from app.schemas.role_intelligence import RoleIntelligenceResponse, SalarySnapshot
from app.schemas.skill_gap import MissingSkill, SkillGapResponse


class MarketInsightsEngine:
    def __init__(self, db: AsyncIOMotorDatabase, cache: AsyncTTLCache) -> None:
        self.db = db
        self.cache = cache

    async def dashboard(self) -> DashboardStats:
        cache_key = "dashboard:default"
        cached = await self.cache.get(cache_key)
        if cached:
            return cached

        total_jobs = await self.db["jobs"].count_documents({})
        top_skills = await self._top_skills(limit=10)
        salary_distribution = await self._salary_distribution()
        remote_ratio = await self._remote_ratio()
        hiring_trend = await self._hiring_trend(days=45)
        market_heat = self._market_heat_score(total_jobs, remote_ratio.remote, salary_distribution)

        snapshot = DashboardStats(
            total_jobs=total_jobs,
            top_skills=top_skills,
            salary_distribution=salary_distribution,
            remote_ratio=remote_ratio,
            hiring_trend=hiring_trend,
            market_heat_score=market_heat,
        )
        await self.cache.set(cache_key, snapshot)
        return snapshot

    async def role_intelligence(self, title: str) -> RoleIntelligenceResponse:
        normalized = title.strip().lower()
        cache_key = f"role:{normalized}"
        cached = await self.cache.get(cache_key)
        if cached:
            return cached

        query = self._title_query(normalized)
        total_jobs = await self.db["jobs"].count_documents(query)

        top_skills = await self._top_skills(limit=8, query=query)
        top_locations = await self._top_locations(limit=8, query=query)
        hiring_trend = await self._hiring_trend(days=45, query=query)
        salary = await self._salary_snapshot(query=query)

        remote_count = await self.db["jobs"].count_documents({**query, "is_remote": True})
        market_heat = self._role_market_heat_score(total_jobs, remote_count, salary.median)

        response = RoleIntelligenceResponse(
            role=title,
            total_jobs=total_jobs,
            salary=salary,
            top_skills=top_skills,
            top_locations=top_locations,
            hiring_trend=hiring_trend,
            market_heat_score=market_heat,
        )
        await self.cache.set(cache_key, response)
        return response

    async def skill_gap(self, known_skills: list[str], role: str | None = None) -> SkillGapResponse:
        normalized_known = sorted({skill.strip().lower() for skill in known_skills if skill.strip()})
        role_key = role.strip().lower() if role else "all"
        cache_key = f"skill-gap:{role_key}:{','.join(normalized_known)}"
        cached = await self.cache.get(cache_key)
        if cached:
            return cached

        query = {}
        if role:
            query = self._title_query(role.strip())

        top_skills = await self._top_skills(limit=15, query=query)
        demand_total = sum(item.count for item in top_skills)

        matched = [item.skill for item in top_skills if item.skill in normalized_known]
        missing = [
            MissingSkill(skill=item.skill, demand_count=item.count)
            for item in top_skills
            if item.skill not in normalized_known
        ]

        matched_demand = sum(item.count for item in top_skills if item.skill in normalized_known)
        demand_score = round((matched_demand / demand_total) * 100, 2) if demand_total else 0.0
        market_heat = round(min(100.0, 20 + math.log1p(demand_total) * 15), 2)

        response = SkillGapResponse(
            matched_skills=matched,
            missing_skills=missing,
            demand_score=demand_score,
            market_heat_score=market_heat,
        )
        await self.cache.set(cache_key, response)
        return response

    async def live_jobs(self, limit: int = 20, title: str | None = None) -> list[LiveJobOut]:
        normalized_title = (title or "").strip().lower()
        cache_key = f"live-jobs:{limit}:{normalized_title}"
        cached = await self.cache.get(cache_key)
        if cached:
            return cached

        query: dict = {}
        if normalized_title:
            query = self._title_query(normalized_title)

        cursor = (
            self.db["jobs"]
            .find(
                query,
                {
                    "title": 1,
                    "company": 1,
                    "location": 1,
                    "salary_min": 1,
                    "salary_max": 1,
                    "is_remote": 1,
                    "posted_date": 1,
                    "url": 1,
                    "skills": 1,
                },
            )
            .sort("posted_date", -1)
            .limit(limit)
        )

        records: list[LiveJobOut] = []
        async for row in cursor:
            posted_date = row.get("posted_date")
            if isinstance(posted_date, datetime):
                posted_date_value = posted_date.date().isoformat()
            else:
                posted_date_value = datetime.now(tz=UTC).date().isoformat()

            row_id = row.get("_id")
            if isinstance(row_id, ObjectId):
                record_id = str(row_id)
            else:
                record_id = str(row_id or "")

            records.append(
                LiveJobOut(
                    id=record_id,
                    title=row.get("title", ""),
                    company=row.get("company"),
                    location=row.get("location"),
                    salary_min=row.get("salary_min"),
                    salary_max=row.get("salary_max"),
                    is_remote=bool(row.get("is_remote", False)),
                    posted_date=posted_date_value,
                    url=row.get("url", ""),
                    skills=row.get("skills", []),
                )
            )

        await self.cache.set(cache_key, records)
        return records

    async def _top_skills(self, limit: int, query: dict | None = None) -> list[SkillCount]:
        pipeline = []
        if query:
            pipeline.append({"$match": query})
        pipeline.extend(
            [
                {"$match": {"skills": {"$nin": [None, ""]}}},
                {"$unwind": "$skills"},
                {"$group": {"_id": "$skills", "count": {"$sum": 1}}},
                {"$sort": {"count": -1}},
                {"$limit": limit},
            ]
        )
        rows = await self.db["jobs"].aggregate(pipeline).to_list(length=limit)
        return [SkillCount(skill=row["_id"], count=row["count"]) for row in rows]

    async def _top_locations(self, limit: int, query: dict | None = None) -> list[SkillCount]:
        pipeline = []
        if query:
            pipeline.append({"$match": query})
        pipeline.extend(
            [
                {"$match": {"location": {"$nin": [None, ""]}}},
                {"$group": {"_id": "$location", "count": {"$sum": 1}}},
                {"$sort": {"count": -1}},
                {"$limit": limit},
            ]
        )
        rows = await self.db["jobs"].aggregate(pipeline).to_list(length=limit)
        return [SkillCount(skill=row["_id"], count=row["count"]) for row in rows]

    async def _hiring_trend(self, days: int, query: dict | None = None) -> list[TrendPoint]:
        end_date = datetime.now(tz=UTC)
        cutoff = end_date - timedelta(days=days)
        match_query = {"posted_date": {"$gte": cutoff}}
        if query:
            match_query = {**query, "posted_date": {"$gte": cutoff}}

        pipeline = [
            {"$match": match_query},
            {
                "$group": {
                    "_id": {"$dateToString": {"format": "%Y-%m-%d", "date": "$posted_date"}},
                    "count": {"$sum": 1},
                }
            },
            {"$sort": {"_id": 1}},
        ]
        rows = await self.db["jobs"].aggregate(pipeline).to_list(length=days + 5)

        counts_by_day = {row["_id"]: row["count"] for row in rows}
        output: list[TrendPoint] = []
        for offset in range(days, -1, -1):
            day = (end_date - timedelta(days=offset)).date().isoformat()
            output.append(TrendPoint(date=day, count=counts_by_day.get(day, 0)))
        return output

    async def _salary_distribution(self) -> list[SalaryBin]:
        total_jobs = await self.db["jobs"].count_documents({})
        cursor = self.db["jobs"].find(
            {"salary_min": {"$ne": None}, "salary_max": {"$ne": None}},
            {"salary_min": 1, "salary_max": 1},
        )
        salaries = []
        async for row in cursor:
            salaries.append((float(row["salary_min"]) + float(row["salary_max"])) / 2)

        buckets = {
            "0-6L": 0,
            "6L-10L": 0,
            "10L-20L": 0,
            "20L-35L": 0,
            "35L+": 0,
            "Not disclosed": 0,
        }
        for amount in salaries:
            if amount < 600_000:
                buckets["0-6L"] += 1
            elif amount < 1_000_000:
                buckets["6L-10L"] += 1
            elif amount < 2_000_000:
                buckets["10L-20L"] += 1
            elif amount < 3_500_000:
                buckets["20L-35L"] += 1
            else:
                buckets["35L+"] += 1

        disclosed = len(salaries)
        buckets["Not disclosed"] = max(total_jobs - disclosed, 0)
        return [SalaryBin(band=band, count=count) for band, count in buckets.items()]

    async def _salary_snapshot(self, query: dict | None = None) -> SalarySnapshot:
        cursor = self.db["jobs"].find(
            {
                **(query or {}),
                "salary_min": {"$ne": None},
                "salary_max": {"$ne": None},
            },
            {"salary_min": 1, "salary_max": 1},
        )
        mids = []
        salary_min: float | None = None
        salary_max: float | None = None

        async for row in cursor:
            current_min = float(row["salary_min"])
            current_max = float(row["salary_max"])
            mids.append((current_min + current_max) / 2)
            salary_min = current_min if salary_min is None else min(salary_min, current_min)
            salary_max = current_max if salary_max is None else max(salary_max, current_max)

        return SalarySnapshot(
            min=round(salary_min, 2) if salary_min is not None else None,
            max=round(salary_max, 2) if salary_max is not None else None,
            median=round(median(mids), 2) if mids else None,
        )

    async def _remote_ratio(self) -> RemoteRatio:
        pipeline = [{"$group": {"_id": "$is_remote", "count": {"$sum": 1}}}]
        rows = await self.db["jobs"].aggregate(pipeline).to_list(length=5)
        remote = next((row["count"] for row in rows if row["_id"] is True), 0)
        onsite = next((row["count"] for row in rows if row["_id"] is False), 0)
        unknown = sum(row["count"] for row in rows if row["_id"] not in (True, False))
        return RemoteRatio(remote=remote, onsite=onsite, hybrid_or_unknown=unknown)

    @staticmethod
    def _market_heat_score(total_jobs: int, remote_count: int, salary_distribution: list[SalaryBin]) -> float:
        salary_volume = sum(bin_item.count for bin_item in salary_distribution)
        remote_boost = (remote_count / total_jobs) * 25 if total_jobs else 0
        volume_signal = math.log1p(total_jobs) * 12
        salary_signal = math.log1p(salary_volume + 1) * 10
        return round(min(100.0, volume_signal + salary_signal + remote_boost), 2)

    @staticmethod
    def _role_market_heat_score(total_jobs: int, remote_count: int, median_salary: float | None) -> float:
        volume_signal = math.log1p(total_jobs) * 14
        remote_boost = (remote_count / total_jobs) * 25 if total_jobs else 0
        salary_boost = min((median_salary or 0) / 300_000, 18)
        return round(min(100.0, volume_signal + remote_boost + salary_boost), 2)

    @staticmethod
    def _title_query(value: str) -> dict:
        escaped = re.escape(value.strip())
        return {"title": {"$regex": escaped, "$options": "i"}}
