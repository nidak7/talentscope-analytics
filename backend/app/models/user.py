from datetime import UTC, datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, Field


class UserDocument(BaseModel):
    id: str | None = Field(default=None, alias="_id")
    email: EmailStr
    full_name: str
    hashed_password: str
    role: Literal["admin", "user"] = "user"
    created_at: datetime = Field(default_factory=lambda: datetime.now(tz=UTC))

    model_config = {"populate_by_name": True}

