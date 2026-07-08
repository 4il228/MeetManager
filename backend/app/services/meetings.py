from typing import List, Optional
from fastapi import HTTPException
from sqlalchemy.ext.asyncio import AsyncSession
from sqlalchemy import select, text
from app.models.meeting import Meeting, meeting_participants
from app.models.user import User
from app.schemas.meeting import ConflictDetail


async def check_conflicts(
    db: AsyncSession,
    participant_ids: List[str],
    start_time: str,
    end_time: str,
) -> List[ConflictDetail]:
    if not participant_ids:
        return []

    conflicts = []
    for user_id in participant_ids:
        result = await db.execute(
            text(
                """
                SELECT mp.user_id, u.full_name, m.title as meeting_title,
                       m.start_time, m.end_time
                FROM meeting_participants mp
                JOIN meetings m ON mp.meeting_id = m.id
                JOIN users u ON mp.user_id = u.id
                WHERE mp.user_id = :user_id
                AND m.start_time < :end_time
                AND m.end_time > :start_time
                """
            ),
            {"user_id": user_id, "start_time": start_time, "end_time": end_time},
        )

        for row in result:
            conflicts.append(
                ConflictDetail(
                    user_id=row[0],
                    full_name=row[1],
                    meeting_title=row[2],
                    start_time=row[3],
                    end_time=row[4],
                )
            )

    return conflicts


async def create_meeting(
    db: AsyncSession,
    title: str,
    creator_id: str,
    start_time: str,
    end_time: str,
    participant_ids: List[str],
) -> Meeting:
    await db.execute(text("PRAGMA busy_timeout = 5000"))

    all_participants = list(set(participant_ids + [creator_id]))

    conflicts = await check_conflicts(db, all_participants, start_time, end_time)
    if conflicts:
        raise HTTPException(
            status_code=409,
            detail={
                "detail": "Конфликт расписания",
                "conflicts": [c.model_dump() for c in conflicts],
            },
        )

    meeting = Meeting(
        title=title,
        creator_id=creator_id,
        start_time=start_time,
        end_time=end_time,
    )
    db.add(meeting)
    await db.flush()

    for user_id in all_participants:
        await db.execute(
            meeting_participants.insert().values(
                meeting_id=meeting.id,
                user_id=user_id,
            )
        )

    return meeting
