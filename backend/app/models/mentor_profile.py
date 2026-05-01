from sqlalchemy import Column, Integer, String, Boolean, ForeignKey, Text, Float
from sqlalchemy.orm import relationship
from app.db.database import Base


class MentorProfile(Base):
    __tablename__ = "mentor_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)
    bio = Column(Text, nullable=True)
    hourly_rate = Column(Float, nullable=True)
    is_visible = Column(Boolean, default=True)

    # Smart sort fields
    years_experience = Column(Integer, nullable=True)
    languages = Column(String, nullable=True)  # comma-separated e.g. "English,Spanish"
    session_format = Column(String, default="online")  # "online", "in_person", "both"
    location = Column(String, nullable=True)  # city or timezone string
    tags = Column(String, nullable=True)  # comma-separated controlled tags
    # e.g. "beginner_friendly,exam_prep,career_coaching"

    # Relationships - unchanged from original
    user = relationship("User", back_populates="mentor_profile")
    skills = relationship(
        "MentorSkill", back_populates="mentor_profile", cascade="all, delete-orphan"
    )
    availability_slots = relationship(
        "AvailabilitySlot",
        back_populates="mentor_profile",
        cascade="all, delete-orphan",
    )
    recurring_patterns = relationship(
        "RecurringPattern",
        back_populates="mentor_profile",
        cascade="all, delete-orphan",
    )
    reviews = relationship(
        "Review", back_populates="mentor_profile", cascade="all, delete-orphan"
    )
    services = relationship(
        "MentorService", back_populates="mentor_profile", cascade="all, delete-orphan"
    )
    resources = relationship(
        "MentorResource", back_populates="mentor_profile", cascade="all, delete-orphan"
    )

    def __repr__(self):
        return f"<MentorProfile user={self.user_id}>"
