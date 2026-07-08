from fastapi import APIRouter, Depends, HTTPException, Query
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from typing import List, Optional
from app.database import get_db
from app.models.user import User
from app.models.meeting import Meeting, meeting_participants
from app.schemas.meeting import (
    MeetingCreate,
    MeetingResponse,
    ParticipantResponse,
    CheckAvailabilityRequest,
    AvailabilityResponse,
    ConflictDetail,
)
from app.dependencies import get_current_user
from app.services.meetings import check_conflicts, create_meeting

router = APIRouter(tags=["meetings"])


@router.get("/meetings", response_model=List[MeetingResponse])
async def get_meetings(
    start_date: str = Query(..., description="Start date in ISO format"),
    end_date: str = Query(..., description="End date in ISO format"),
    user_id: Optional[str] = Query(None, description="Filter by user ID"),
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Get meetings for a date range, optionally filtered by user."""
    query = (
        select(Meeting)
        .where(Meeting.start_time < end_date)
        .where(Meeting.end_time > start_date)
    )
    
    if user_id:
        query = query.join(meeting_participants).where(
            meeting_participants.c.user_id == user_id
        )
    
    result = await db.execute(query)
    meetings = result.scalars().all()
    
    response = []
    for meeting in meetings:
        participants_result = await db.execute(
            select(User).join(meeting_participants).where(
                meeting_participants.c.meeting_id == meeting.id
            )
        )
        participants = participants_result.scalars().all()
        
        creator_result = await db.execute(
            select(User).where(User.id == meeting.creator_id)
        )
        creator = creator_result.scalar_one()
        
        response.append(
            MeetingResponse(
                id=meeting.id,
                title=meeting.title,
                creator_id=meeting.creator_id,
                creator_name=creator.full_name,
                start_time=meeting.start_time,
                end_time=meeting.end_time,
                participants=[
                    ParticipantResponse(id=p.id, full_name=p.full_name) for p in participants
                ],
            )
        )
    
    return response


@router.post("/meetings", response_model=MeetingResponse, status_code=201)
async def create_meeting_endpoint(
    meeting_data: MeetingCreate,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Create a new meeting."""
    meeting = await create_meeting(
        db=db,
        title=meeting_data.title,
        creator_id=current_user.id,
        start_time=meeting_data.start_time,
        end_time=meeting_data.end_time,
        participant_ids=meeting_data.participant_ids,
    )
    
    participants_result = await db.execute(
        select(User).join(meeting_participants).where(
            meeting_participants.c.meeting_id == meeting.id
        )
    )
    participants = participants_result.scalars().all()
    
    return MeetingResponse(
        id=meeting.id,
        title=meeting.title,
        creator_id=meeting.creator_id,
        creator_name=current_user.full_name,
        start_time=meeting.start_time,
        end_time=meeting.end_time,
        participants=[
            ParticipantResponse(id=p.id, full_name=p.full_name) for p in participants
        ],
    )


@router.delete("/meetings/{meeting_id}", status_code=204)
async def delete_meeting(
    meeting_id: str,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Delete a meeting (only creator can delete)."""
    result = await db.execute(select(Meeting).where(Meeting.id == meeting_id))
    meeting = result.scalar_one_or_none()
    
    if not meeting:
        raise HTTPException(status_code=404, detail="Meeting not found")
    
    if meeting.creator_id != current_user.id:
        raise HTTPException(status_code=403, detail="Only the creator can delete this meeting")
    
    await db.delete(meeting)
    await db.flush()


@router.post("/meetings/check-availability", response_model=AvailabilityResponse)
async def check_availability(
    request: CheckAvailabilityRequest,
    db: AsyncSession = Depends(get_db),
    current_user: User = Depends(get_current_user),
):
    """Check availability for participants."""
    conflicts = await check_conflicts(
        db=db,
        participant_ids=request.participant_ids,
        start_time=request.start_time,
        end_time=request.end_time,
    )
    
    available = [
        uid for uid in request.participant_ids
        if uid not in [c.user_id for c in conflicts]
    ]
    
    return AvailabilityResponse(
        available=available,
        busy=conflicts,
    )
