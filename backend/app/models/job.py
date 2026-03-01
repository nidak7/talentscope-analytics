from datetime import UTC, datetime

from pydantic import BaseModel, Field


class JobDocument(BaseModel):
    id: str | None = Field(default=None, alias="_id")
    source: str = "adzuna"
    external_id: str
    title: str
    company: str | None = None
    location: str | None = None
    country: str
    description: str
    url: str
    salary_min: float | None = None
    salary_max: float | None = None
    is_remote: bool = False
    search_keyword: str | None = None
    skills: list[str] = Field(default_factory=list)
    posted_date: datetime
    ingested_at: datetime = Field(default_factory=lambda: datetime.now(tz=UTC))

    model_config = {"populate_by_name": True}

