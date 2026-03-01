from datetime import UTC, datetime
from typing import Literal

from pydantic import BaseModel, Field


class IngestionLogDocument(BaseModel):
    id: str | None = Field(default=None, alias="_id")
    source: str = "adzuna"
    status: Literal["running", "success", "partial", "failed"] = "running"
    started_at: datetime = Field(default_factory=lambda: datetime.now(tz=UTC))
    ended_at: datetime | None = None
    triggered_by: str | None = None
    jobs_processed: int = 0
    errors: list[str] = Field(default_factory=list)

    model_config = {"populate_by_name": True}

