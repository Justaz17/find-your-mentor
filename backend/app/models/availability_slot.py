from sqlalchemy import Column, Integer, DateTime, String, ForeignKey, Enum as SQLEnum
from sqlalchemy.orm import relationship
from app.db.database import Base
from datetime import datetime, timezone
import enum


class AvailabilitySlotStatus(str, enum.Enum):
    """Status enum for availability slots"""

    AVAILABLE = "available"
    BOOKED = "booked"
    CANCELLED = "cancelled"


class AvailabilitySlot(Base):
    __tablename__ = "availability_slots"

    id = Column(Integer, primary_key=True, index=True)
    mentor_profile_id = Column(
        Integer, ForeignKey("mentor_profiles.id"), nullable=False
    )

    # IMPORTANT: Link to recurring pattern if this slot was auto-generated
    # NULL = mentor manually created this slot (ad-hoc)
    # NOT NULL = this slot was generated from a recurring pattern
    recurring_pattern_id = Column(
        Integer, ForeignKey("recurring_patterns.id"), nullable=True
    )

    start_time = Column(DateTime(timezone=True), nullable=False)
    end_time = Column(DateTime(timezone=True), nullable=False)

    # Updated status enum: available, booked, or cancelled
    status = Column(
        SQLEnum(AvailabilitySlotStatus),
        default=AvailabilitySlotStatus.AVAILABLE,
        nullable=False,
    )

    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(),
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(),
        onupdate=lambda: datetime.now(),
    )

    mentor_profile = relationship("MentorProfile", back_populates="availability_slots")
    booking = relationship("Booking", back_populates="availability_slot", uselist=False)
    recurring_pattern = relationship("RecurringPattern", viewonly=True)

    def __repr__(self):
        return f"<AvailabilitySlot {self.start_time} - {self.end_time}: {self.status}>"
