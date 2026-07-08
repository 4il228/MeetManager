from fastapi import APIRouter, HTTPException, Depends, Response, Request
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select
from slowapi import Limiter
from slowapi.util import get_remote_address
from app.database import get_db
from app.models.user import User
from app.schemas.auth import LoginRequest, LoginResponse, LogoutResponse, ErrorResponse
from app.schemas.user import UserResponse
from app.services.auth import verify_password, set_auth_cookies, clear_auth_cookies
from app.dependencies import get_current_user


router = APIRouter(prefix="/auth", tags=["auth"])

limiter = Limiter(key_func=get_remote_address)


@router.post(
    "/login",
    response_model=LoginResponse,
    responses={
        401: {"model": ErrorResponse, "description": "Неверный логин или пароль"},
        429: {"model": ErrorResponse, "description": "Слишком много попыток"},
    },
)
@limiter.limit("5/minute")
async def login(
    request: Request,
    body: LoginRequest,
    response: Response,
    db: AsyncSession = Depends(get_db),
):
    result = await db.execute(select(User).where(User.username == body.username))
    user = result.scalar_one_or_none()

    if not user or not verify_password(body.password, user.password_hash):
        raise HTTPException(status_code=401, detail="Неверный логин или пароль")

    set_auth_cookies(response, user)

    return LoginResponse(
        user=UserResponse(
            id=user.id,
            username=user.username,
            full_name=user.full_name,
            is_admin=bool(user.is_admin),
        )
    )


@router.post("/logout", response_model=LogoutResponse)
async def logout(response: Response):
    clear_auth_cookies(response)
    return LogoutResponse()


@router.get("/me", response_model=UserResponse)
async def get_me(current_user: User = Depends(get_current_user)):
    return UserResponse(
        id=current_user.id,
        username=current_user.username,
        full_name=current_user.full_name,
        is_admin=bool(current_user.is_admin),
    )
