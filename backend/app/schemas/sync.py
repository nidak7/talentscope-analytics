from datetime import datetime

from pydantic import BaseModel, Field, field_validator


class SyncRequest(BaseModel):
    country: str | None = Field(default=None, min_length=2, max_length=2)
    max_jobs: int | None = Field(default=None, ge=50, le=5000)
    reset_existing: bool = False

    @field_validator("country")
    @classmethod
    def normalize_country(cls, value: str | None) -> str | None:
        if value is None:
            return None
        return value.strip().lower()


class SyncResponse(BaseModel):
    status: str
    jobs_processed: int
    errors: list[str]
    started_at: datetime
    ended_at: datetime | None = None


class IngestionLogOut(BaseModel):
    id: str
    source: str
    status: str
    started_at: datetime
    ended_at: datetime | None = None
    triggered_by: str | None = None
    jobs_processed: int
    errors: list[str]


class ResetResponse(BaseModel):
    jobs_deleted: int
    logs_deleted: int
