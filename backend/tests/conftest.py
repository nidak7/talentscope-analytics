import os

import pytest
from fastapi import FastAPI
from fastapi.testclient import TestClient
from mongomock_motor import AsyncMongoMockClient

os.environ.setdefault("MONGO_URI", "mongodb://localhost:27017")
os.environ.setdefault("MONGO_DB_NAME", "talentscope_test")
os.environ.setdefault("JWT_SECRET_KEY", "test-secret-key")
os.environ.setdefault("JWT_ALGORITHM", "HS256")
os.environ.setdefault("ACCESS_TOKEN_MINUTES", "60")
os.environ.setdefault("ADZUNA_APP_ID", "dummy")
os.environ.setdefault("ADZUNA_APP_KEY", "dummy")
os.environ.setdefault("SYNC_KEYWORDS", "software engineer,data analyst")
os.environ.setdefault("CORS_ORIGINS", "http://localhost:5173")

from app.auth_core.router import router as auth_router  # noqa: E402
from app.core.config import get_settings  # noqa: E402
from app.db.mongo import get_db  # noqa: E402

get_settings.cache_clear()


@pytest.fixture
def client() -> TestClient:
    db = AsyncMongoMockClient()["talentscope_test"]

    app = FastAPI()
    app.include_router(auth_router, prefix="/api/v1")
    app.dependency_overrides[get_db] = lambda: db

    return TestClient(app)

