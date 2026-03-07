from motor.motor_asyncio import AsyncIOMotorDatabase


async def ensure_indexes(db: AsyncIOMotorDatabase) -> None:
    await db["users"].create_index("email", unique=True, background=True)

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
