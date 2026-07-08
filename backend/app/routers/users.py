from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import delete, select, or_
from app.database import get_db
from app.models.user import User
from app.models.meeting import Meeting, meeting_participants
from app.schemas.user import UserResponse, UserCreate
from app.dependencies import get_current_user, require_admin
from app.services.auth import get_password_hash

router = APIRouter(tags=["users"])


@router.get("/users", response_model=list[UserResponse])
async def get_users(
    search: str = Query(None, description="Search by username or full_name"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get users list with optional search filter."""
    query = select(User)

    if search:
        search_pattern = f"%{search}%"
        query = query.where(
            or_(
                User.username.ilike(search_pattern),
                User.full_name.ilike(search_pattern),
            )
        )

    result = await db.execute(query)
    users = result.scalars().all()

    return [
        UserResponse(
            id=u.id,
            username=u.username,
            full_name=u.full_name,
            is_admin=bool(u.is_admin),
        )
        for u in users
    ]


@router.post("/users", response_model=UserResponse, status_code=201)
async def create_user(
    body: UserCreate,
    db: AsyncSession = Depends(get_db),
    _admin: User = Depends(require_admin),
):
    """Register a new user (admin only)."""
    existing = await db.execute(select(User).where(User.username == body.username))
    if existing.scalar_one_or_none():
        raise HTTPException(status_code=409, detail="Пользователь с таким логином уже существует")

    user = User(
        username=body.username,
        password_hash=get_password_hash(body.password),
        full_name=body.full_name,
        is_admin=False,
    )
    db.add(user)
    await db.flush()
    await db.refresh(user)

    return UserResponse(
        id=user.id,
        username=user.username,
        full_name=user.full_name,
        is_admin=bool(user.is_admin),
    )


@router.delete("/users/{user_id}", status_code=204)
async def delete_user(
    user_id: str,
    db: AsyncSession = Depends(get_db),
    admin: User = Depends(require_admin),
):
    """Delete a user (admin only)."""
    if user_id == admin.id:
        raise HTTPException(status_code=403, detail="Нельзя удалить свой аккаунт")

    result = await db.execute(select(User).where(User.id == user_id))
    user = result.scalar_one_or_none()

    if not user:
        raise HTTPException(status_code=404, detail="Пользователь не найден")

    if user.is_admin:
        raise HTTPException(status_code=403, detail="Нельзя удалить администратора")

    # Сначала снимаем пользователя с чужих встреч, затем удаляем созданные им встречи,
    # и только после этого самого пользователя.
    await db.execute(
        delete(meeting_participants).where(meeting_participants.c.user_id == user_id)
    )

    created_meeting_ids = (
        await db.execute(select(Meeting.id).where(Meeting.creator_id == user_id))
    ).scalars().all()

    if created_meeting_ids:
        await db.execute(
            delete(meeting_participants).where(
                meeting_participants.c.meeting_id.in_(created_meeting_ids)
            )
        )
        await db.execute(delete(Meeting).where(Meeting.id.in_(created_meeting_ids)))

    await db.delete(user)
    await db.flush()
