from sqlalchemy import Column, Integer, String, Float, ForeignKey, Text, DateTime
from sqlalchemy.orm import relationship
from app.db.database import Base
from datetime import datetime, timezone


class Review(Base):
    __tablename__ = "reviews"

    id = Column(Integer, primary_key=True, index=True)
    mentor_profile_id = Column(
        Integer, ForeignKey("mentor_profiles.id"), nullable=False
    )
    reviewer_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    rating = Column(Float, nullable=False)
    comment = Column(Text, nullable=True)
    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )
    mentor_reply = Column(Text, nullable=True)
    mentor_replied_at = Column(DateTime(timezone=True), nullable=True)
    is_disputed = Column(String, nullable=True)
    dispute_reason = Column(Text, nullable=True)

    mentor_profile = relationship("MentorProfile", back_populates="reviews")
    reviewer = relationship("User", back_populates="reviews_given")
