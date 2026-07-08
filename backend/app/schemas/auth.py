from pydantic import BaseModel, Field
from typing import Optional
import re


class LoginRequest(BaseModel):
    username: str = Field(..., min_length=1, max_length=100)
    password: str = Field(..., min_length=1)


class UserResponse(BaseModel):
    id: str
    username: str
    full_name: str

    class Config:
        from_attributes = True


class LoginResponse(BaseModel):
    user: UserResponse


class LogoutResponse(BaseModel):
    detail: str = "ok"


class ErrorResponse(BaseModel):
    detail: str
