from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Text, DateTime
from sqlalchemy.orm import relationship
from app.db.database import Base
from datetime import datetime, timezone


class MentorResource(Base):
    __tablename__ = "mentor_resources"

    id = Column(Integer, primary_key=True, index=True)
    mentor_profile_id = Column(
        Integer, ForeignKey("mentor_profiles.id"), nullable=False
    )
    title = Column(String(200), nullable=False)
    type = Column(String(20), nullable=False)  # video, link, note
    content = Column(Text, nullable=False)  # YouTube URL, link URL, or note text
    is_public = Column(
        Boolean, default=True
    )  # visible to everyone vs booked learners only
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(),
    )

    # Relationships
    mentor_profile = relationship("MentorProfile", back_populates="resources")
