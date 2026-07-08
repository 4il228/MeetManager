from pydantic import BaseModel, Field


class LoginRequest(BaseModel):
    username: str = Field(..., min_length=1, max_length=100)
    password: str = Field(..., min_length=1)


class LoginResponse(BaseModel):
    user: "UserResponse"


class LogoutResponse(BaseModel):
    detail: str = "ok"


class ErrorResponse(BaseModel):
    detail: str


from app.schemas.user import UserResponse  # noqa: E402

LoginResponse.model_rebuild()