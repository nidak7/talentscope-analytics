from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo.errors import OperationFailure


async def _ensure_unique_user_email_index(db: AsyncIOMotorDatabase) -> None:
    users = db["users"]
    existing_indexes: dict[str, dict] = {}

    async for index in users.list_indexes():
        existing_indexes[index["name"]] = index

    stale_index = existing_indexes.get("email_1")
    if stale_index and not stale_index.get("unique", False):
        await users.drop_index("email_1")

    try:
        await users.create_index("email", unique=True, background=True, name="uniq_users_email")
    except OperationFailure as exc:
        # Atlas can retain a conflicting generated name from earlier local experiments.
        if exc.code != 86:
            raise
        if "email_1" in existing_indexes:
            await users.drop_index("email_1")
            await users.create_index("email", unique=True, background=True, name="uniq_users_email")
        else:
            raise


async def ensure_indexes(db: AsyncIOMotorDatabase) -> None:
    await _ensure_unique_user_email_index(db)

    await db["jobs"].create_index(
        [("source", 1), ("external_id", 1)],
        unique=True,
        background=True,
        name="uniq_source_external",
    )
    await db["jobs"].create_index("posted_date", background=True)
    await db["jobs"].create_index("is_remote", background=True)
    await db["jobs"].create_index("title", background=True)
    await db["jobs"].create_index("skills", background=True)
    await db["jobs"].create_index("location", background=True)
    await db["jobs"].create_index("ingested_at", background=True)

    await db["ingestion_logs"].create_index("started_at", background=True)
    await db["ingestion_logs"].create_index("status", background=True)
