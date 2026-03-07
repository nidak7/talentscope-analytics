from datetime import datetime

from pydantic import BaseModel


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
