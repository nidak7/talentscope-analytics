from fastapi import APIRouter, Depends, Query, Request

from app.auth_core.deps import require_admin
from app.schemas.auth import UserOut
from app.schemas.sync import IngestionLogOut, ResetResponse, SyncRequest, SyncResponse

router = APIRouter(prefix="/admin", tags=["Admin"])


@router.post("/sync", response_model=SyncResponse)
async def trigger_sync(
    request: Request,
    payload: SyncRequest | None = None,
    admin_user: UserOut = Depends(require_admin),
) -> SyncResponse:
    engine = request.app.state.sync_engine
    return await engine.run(
        triggered_by=admin_user.email,
        country=payload.country if payload else None,
        max_jobs=payload.max_jobs if payload else None,
        reset_existing=payload.reset_existing if payload else False,
    )


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


@router.post("/reset-data", response_model=ResetResponse)
async def reset_data(request: Request, _: UserOut = Depends(require_admin)) -> ResetResponse:
    db = request.app.state.db
    jobs_result = await db["jobs"].delete_many({})
    logs_result = await db["ingestion_logs"].delete_many({})
    cache = request.app.state.cache
    await cache.invalidate_prefix("dashboard:")
    await cache.invalidate_prefix("role:")
    await cache.invalidate_prefix("skill-gap:")
    await cache.invalidate_prefix("live-jobs:")
    return ResetResponse(jobs_deleted=jobs_result.deleted_count, logs_deleted=logs_result.deleted_count)
