import re
from pydantic import BaseModel, field_validator, model_validator
from typing import List
from datetime import datetime, timezone, timedelta


class ParticipantResponse(BaseModel):
    id: str
    full_name: str


class MeetingResponse(BaseModel):
    id: str
    title: str
    creator_id: str
    creator_name: str
    start_time: str
    end_time: str
    participants: List[ParticipantResponse]


class MeetingCreate(BaseModel):
    title: str
    start_time: str
    end_time: str
    participant_ids: List[str] = []

    @field_validator("title")
    @classmethod
    def validate_title(cls, v: str) -> str:
        v = v.strip()
        if not v:
            raise ValueError("Title cannot be empty")
        if len(v) > 200:
            raise ValueError("Title must be 200 characters or less")
        if re.search(r"<[^>]+>", v):
            raise ValueError("Title cannot contain HTML tags")
        return v

    @field_validator("start_time", "end_time")
    @classmethod
    def validate_datetime(cls, v: str) -> str:
        try:
            datetime.fromisoformat(v.replace("Z", "+00:00"))
        except ValueError:
            raise ValueError("Invalid datetime format. Use YYYY-MM-DDTHH:MM:SSZ")
        return v

    @model_validator(mode="after")
    def validate_times(self) -> "MeetingCreate":
        start = datetime.fromisoformat(self.start_time.replace("Z", "+00:00"))
        end = datetime.fromisoformat(self.end_time.replace("Z", "+00:00"))
        now = datetime.now(timezone.utc)

        if start < now - timedelta(seconds=60):
            raise ValueError("start_time cannot be in the past")

        if end <= start:
            raise ValueError("end_time must be after start_time")

        duration = end - start
        if duration < timedelta(minutes=15):
            raise ValueError("Meeting must be at least 15 minutes long")
        if duration > timedelta(hours=24):
            raise ValueError("Meeting cannot be longer than 24 hours")

        return self


class CheckAvailabilityRequest(BaseModel):
    start_time: str
    end_time: str
    participant_ids: List[str]

    @field_validator("start_time", "end_time")
    @classmethod
    def validate_datetime(cls, v: str) -> str:
        try:
            datetime.fromisoformat(v.replace("Z", "+00:00"))
        except ValueError:
            raise ValueError("Invalid datetime format. Use YYYY-MM-DDTHH:MM:SSZ")
        return v


class ConflictDetail(BaseModel):
    user_id: str
    full_name: str
    meeting_title: str
    start_time: str
    end_time: str


class AvailabilityResponse(BaseModel):
    available: List[str]
    busy: List[ConflictDetail]
