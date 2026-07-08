from fastapi import APIRouter, Depends, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, or_
from app.database import get_db
from app.models.user import User
from app.schemas.user import UserResponse
from app.dependencies import get_current_user

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
    
    return [UserResponse(id=u.id, username=u.username, full_name=u.full_name) for u in users]
