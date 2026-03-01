from fastapi import APIRouter, Depends, Query, Request

from app.auth_core.deps import require_admin
from app.schemas.auth import UserOut
from app.schemas.sync import IngestionLogOut, SyncResponse

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.post("/sync", response_model=SyncResponse)
async def trigger_sync(request: Request, admin_user: UserOut = Depends(require_admin)) -> SyncResponse:
    engine = request.app.state.sync_engine
    return await engine.run(triggered_by=admin_user.email)


@router.get("/ingestion-logs", response_model=list[IngestionLogOut])
async def ingestion_logs(
    request: Request,
    limit: int = Query(default=20, ge=1, le=100),
    _: UserOut = Depends(require_admin),
) -> list[IngestionLogOut]:
    db = request.app.state.db
    cursor = db["ingestion_logs"].find({}).sort("started_at", -1).limit(limit)
    records = []
    async for row in cursor:
        records.append(
            IngestionLogOut(
                id=str(row.get("_id")),
                source=row.get("source", "adzuna"),
                status=row.get("status", "unknown"),
                started_at=row.get("started_at"),
                ended_at=row.get("ended_at"),
                triggered_by=row.get("triggered_by"),
                jobs_processed=row.get("jobs_processed", 0),
                errors=row.get("errors", []),
            )
        )
    return records

