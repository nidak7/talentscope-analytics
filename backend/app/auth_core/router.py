import os

from bson import ObjectId
from fastapi import APIRouter, Depends, HTTPException, status

from app.auth_core.deps import get_current_user
from app.auth_core.manager import AuthManager
from app.core.security import create_access_token
from app.db.mongo import get_db
from app.schemas.auth import (
    AuthSessionResponse,
    LoginRequest,
    SeedAdminRequest,
    SignupRequest,
    TokenResponse,
    UserOut,
)

router = APIRouter(prefix="/auth", tags=["Authentication"])


@router.post("/signup", response_model=AuthSessionResponse, status_code=status.HTTP_201_CREATED)
async def signup(payload: SignupRequest, db=Depends(get_db)) -> AuthSessionResponse:
    manager = AuthManager(db)
    user = await manager.signup(payload)
    token_value, expires_in = create_access_token(user.id)
    return AuthSessionResponse(
        token=TokenResponse(access_token=token_value, expires_in=expires_in),
        user=user,
    )


@router.post("/login", response_model=AuthSessionResponse)
async def login(payload: LoginRequest, db=Depends(get_db)) -> AuthSessionResponse:
    manager = AuthManager(db)
    user = await manager.authenticate(payload)
    token_value, expires_in = create_access_token(user.id)
    return AuthSessionResponse(
        token=TokenResponse(access_token=token_value, expires_in=expires_in),
        user=user,
    )


@router.post("/seed-admin", response_model=UserOut, status_code=status.HTTP_201_CREATED)
async def seed_admin(payload: SeedAdminRequest, db=Depends(get_db)) -> UserOut:
    configured_key = os.getenv("ADMIN_BOOTSTRAP_KEY", "")
    if not configured_key or payload.bootstrap_key != configured_key:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Invalid bootstrap key")

    manager = AuthManager(db)
    return await manager.signup(
        SignupRequest(full_name=payload.full_name, email=payload.email, password=payload.password),
        role="admin",
    )


@router.get("/me", response_model=UserOut)
async def me(current_user: UserOut = Depends(get_current_user)) -> UserOut:
    return current_user


@router.get("/bootstrap-status")
async def bootstrap_status(db=Depends(get_db)) -> dict[str, bool]:
    user_count = await db["users"].count_documents({})
    admin_count = await db["users"].count_documents({"role": "admin"})
    return {
        "has_users": user_count > 0,
        "has_admin": admin_count > 0,
        "first_user_will_be_admin": user_count == 0,
    }


@router.post("/claim-admin", response_model=UserOut)
async def claim_admin(current_user: UserOut = Depends(get_current_user), db=Depends(get_db)) -> UserOut:
    admin_count = await db["users"].count_documents({"role": "admin"})
    if admin_count > 0:
        raise HTTPException(status_code=status.HTTP_409_CONFLICT, detail="An admin account already exists")

    await db["users"].update_one({"_id": ObjectId(current_user.id)}, {"$set": {"role": "admin"}})
    updated_user = await db["users"].find_one({"_id": ObjectId(current_user.id)})
    if not updated_user:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="User not found")

    return UserOut(
        id=str(updated_user["_id"]),
        full_name=updated_user["full_name"],
        email=updated_user["email"],
        role=updated_user["role"],
        created_at=updated_user["created_at"],
    )
