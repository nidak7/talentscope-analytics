from datetime import datetime
from typing import Literal

from pydantic import BaseModel, EmailStr, Field, field_validator


class SignupRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=80)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class LoginRequest(BaseModel):
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)


class UserOut(BaseModel):
    id: str
    full_name: str
    email: EmailStr
    role: Literal["admin", "user"]
    created_at: datetime


class TokenResponse(BaseModel):
    access_token: str
    token_type: str = "bearer"
    expires_in: int


class AuthSessionResponse(BaseModel):
    token: TokenResponse
    user: UserOut


class SeedAdminRequest(BaseModel):
    full_name: str = Field(min_length=2, max_length=80)
    email: EmailStr
    password: str = Field(min_length=8, max_length=128)
    bootstrap_key: str

    @field_validator("bootstrap_key")
    @classmethod
    def bootstrap_key_not_blank(cls, value: str) -> str:
        value = value.strip()
        if not value:
            raise ValueError("bootstrap_key cannot be blank")
        return value

