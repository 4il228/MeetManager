from pydantic import BaseModel, Field, field_validator
import re


class UserResponse(BaseModel):
    id: str
    username: str
    full_name: str
    is_admin: bool = False


class UserCreate(BaseModel):
    username: str = Field(..., min_length=1, max_length=100)
    password: str = Field(..., min_length=8, max_length=128)
    full_name: str = Field(..., min_length=1, max_length=200)

    @field_validator("username")
    @classmethod
    def validate_username(cls, v: str) -> str:
        v = v.strip().lower()
        if not re.match(r"^[a-z0-9_]+$", v):
            raise ValueError("Логин может содержать только латинские буквы, цифры и _")
        return v

    @field_validator("full_name")
    @classmethod
    def validate_full_name(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("ФИО не может быть пустым")
        if re.search(r"<[^>]+>", v):
            raise ValueError("ФИО не может содержать HTML")
        return v

    @field_validator("password")
    @classmethod
    def validate_password(cls, v: str) -> str:
        if not re.search(r"[A-Za-z]", v) or not re.search(r"\d", v):
            raise ValueError("Пароль должен содержать буквы и цифры")
        return v
