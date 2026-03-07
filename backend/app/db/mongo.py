from motor.motor_asyncio import AsyncIOMotorClient, AsyncIOMotorDatabase

try:
    from mongomock_motor import AsyncMongoMockClient
except ImportError:  # pragma: no cover
    AsyncMongoMockClient = None

from app.core.config import get_settings


class MongoManager:
    def __init__(self) -> None:
        self.client: AsyncIOMotorClient | None = None
        self.db: AsyncIOMotorDatabase | None = None

    async def connect(self) -> None:
        settings = get_settings()
        if settings.mongo_uri.startswith("mongomock://"):
            if AsyncMongoMockClient is None:
                raise RuntimeError("mongomock-motor is not installed")
            self.client = AsyncMongoMockClient()
        else:
            self.client = AsyncIOMotorClient(settings.mongo_uri)
        self.db = self.client[settings.mongo_db_name]

    async def disconnect(self) -> None:
        if self.client:
            self.client.close()
            self.client = None
            self.db = None


mongo_manager = MongoManager()


def get_db() -> AsyncIOMotorDatabase:
    if mongo_manager.db is None:
        raise RuntimeError("Database is not initialized")
    return mongo_manager.db
