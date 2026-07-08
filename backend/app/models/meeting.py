import uuid
from datetime import datetime
from sqlalchemy import Column, String, Text, ForeignKey, Table, CheckConstraint
from sqlalchemy.orm import relationship
from app.database import Base


meeting_participants = Table(
    "meeting_participants",
    Base.metadata,
    Column("meeting_id", String(36), ForeignKey("meetings.id", ondelete="CASCADE"), primary_key=True),
    Column("user_id", String(36), ForeignKey("users.id", ondelete="CASCADE"), primary_key=True),
)


class Meeting(Base):
    __tablename__ = "meetings"
    __table_args__ = (
        CheckConstraint(
            "datetime(replace(replace(end_time, 'T', ' '), 'Z', '')) > datetime(replace(replace(start_time, 'T', ' '), 'Z', ''))",
            name="check_end_time_after_start_time",
        ),
    )

    id = Column(String(36), primary_key=True, default=lambda: str(uuid.uuid4()))
    title = Column(Text, nullable=False)
    creator_id = Column(String(36), ForeignKey("users.id", ondelete="RESTRICT"), nullable=False)
    start_time = Column(Text, nullable=False)
    end_time = Column(Text, nullable=False)
    created_at = Column(Text, default=lambda: datetime.utcnow().strftime("%Y-%m-%dT%H:%M:%SZ"))

    creator = relationship("User", back_populates="meetings_created", foreign_keys=[creator_id])
    participants = relationship("User", secondary=meeting_participants, back_populates="meetings_participated")
