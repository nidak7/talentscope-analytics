from datetime import UTC, datetime

from bson import ObjectId
from fastapi import HTTPException, status
from motor.motor_asyncio import AsyncIOMotorDatabase
from pymongo.errors import DuplicateKeyError

from app.core.security import hash_password, verify_password
from app.schemas.auth import LoginRequest, SignupRequest, UserOut


class AuthManager:
    def __init__(self, db: AsyncIOMotorDatabase) -> None:
        self.users = db["users"]

    async def signup(self, payload: SignupRequest, role: str = "user") -> UserOut:
        existing = await self.users.find_one({"email": payload.email.lower()})
        if existing:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email is already registered",
            )

        user_count = await self.users.count_documents({})
        assigned_role = "admin" if user_count == 0 and role == "user" else role

        user_doc = {
            "full_name": payload.full_name.strip(),
            "email": payload.email.lower(),
            "hashed_password": hash_password(payload.password),
            "role": assigned_role,
            "created_at": datetime.now(tz=UTC),
        }

        try:
            result = await self.users.insert_one(user_doc)
        except DuplicateKeyError as exc:
            raise HTTPException(
                status_code=status.HTTP_409_CONFLICT,
                detail="Email is already registered",
            ) from exc

        return UserOut(id=str(result.inserted_id), **{k: v for k, v in user_doc.items() if k != "hashed_password"})

    async def authenticate(self, payload: LoginRequest) -> UserOut:
        user = await self.users.find_one({"email": payload.email.lower()})
        if not user or not verify_password(payload.password, user["hashed_password"]):
            raise HTTPException(
                status_code=status.HTTP_401_UNAUTHORIZED,
                detail="Invalid email or password",
            )

        return UserOut(
            id=str(user["_id"]),
            full_name=user["full_name"],
            email=user["email"],
            role=user["role"],
            created_at=user["created_at"],
        )

    async def find_by_id(self, user_id: str) -> UserOut:
        if not ObjectId.is_valid(user_id):
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token subject")

        user = await self.users.find_one({"_id": ObjectId(user_id)})
        if not user:
            raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="User not found")

        return UserOut(
            id=str(user["_id"]),
            full_name=user["full_name"],
            email=user["email"],
            role=user["role"],
            created_at=user["created_at"],
        )
