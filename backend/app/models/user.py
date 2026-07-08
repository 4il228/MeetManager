import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, Boolean
from sqlalchemy.orm import relationship
from app.database import Base


class User(Base):
    __tablename__ = "users"

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    username = Column(String(100), unique=True, nullable=False)
    password_hash = Column(String(255), nullable=False)
    full_name = Column(Text, nullable=False)
    is_admin = Column(Boolean, nullable=False, default=False)
    created_at = Column(Text, default=lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"))

    meetings_created = relationship("Meeting", back_populates="creator", foreign_keys="Meeting.creator_id")
    meetings_participated = relationship("Meeting", secondary="meeting_participants", back_populates="participants")
