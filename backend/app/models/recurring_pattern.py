from sqlalchemy import Column, Integer, String, Boolean, Date, ForeignKey, DateTime
from sqlalchemy.orm import relationship
from app.db.database import Base
from datetime import datetime, timezone


class RecurringPattern(Base):
    """
    Represents a recurring mentor availability pattern.
    E.g., "Every Monday 7-9pm" or "Every Wednesday 2-4pm"

    Mentors use this to auto-generate availability slots without manually creating
    50+ individual 1-hour slots per month.
    """

    __tablename__ = "recurring_patterns"

    id = Column(Integer, primary_key=True, index=True)
    mentor_profile_id = Column(
        Integer, ForeignKey("mentor_profiles.id"), nullable=False
    )

    # Day of week: MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY
    day_of_week = Column(String(10), nullable=False)

    # Time as strings: "19:00" (7pm), "21:00" (9pm)
    # Frontend will handle parsing/displaying as times
    start_time = Column(String(5), nullable=False)  # HH:MM format
    end_time = Column(String(5), nullable=False)  # HH:MM format

    # Can mentor toggle this pattern on/off without deleting it?
    is_active = Column(Boolean, default=True)

    # When to stop auto-generating slots from this pattern
    # E.g., mentor says "I can commit to Mondays 7-9pm until May 31st"
    generate_until = Column(Date, nullable=False)

    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(),
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(),
        onupdate=lambda: datetime.now(),
    )

    # Relationships
    mentor_profile = relationship("MentorProfile", back_populates="recurring_patterns")

    def __repr__(self):
        return f"<RecurringPattern {self.day_of_week} {self.start_time}-{self.end_time} until {self.generate_until}>"
