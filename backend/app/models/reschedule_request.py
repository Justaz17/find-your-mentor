from sqlalchemy import Column, Integer, ForeignKey, DateTime, String, Date, Text
from sqlalchemy.orm import relationship
from app.db.database import Base
from datetime import datetime, timezone


class RescheduleRequest(Base):
    """
    When a booking needs to be rescheduled, instead of auto-moving it,
    we create a request and both parties explicitly agree to a new time.

    Two scenarios:
    1. Mentor/Learner says "I can't make it, pick from these slots"
       → Provide list of suggested_slot_ids
    2. Mentor/Learner says "I'm free March 15-20, find a slot"
       → Provide preferred_date_start and preferred_date_end

    Other party then accepts the request with a confirmed slot, or rejects it.

    Auto-expires after 30 days if not responded to.
    """

    __tablename__ = "reschedule_requests"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=False)

    # Who initiated the reschedule? LEARNER or MENTOR?
    initiated_by = Column(String(10), nullable=False)

    # Original slot that's being rescheduled
    from_slot_id = Column(Integer, ForeignKey("availability_slots.id"), nullable=False)

    # Option 1: Proposer provides specific slot IDs they're willing to use
    # Stored as comma-separated string: "1,3,5" or JSON: [1,3,5]
    # The other party picks one of these
    suggested_slot_ids = Column(String(255), nullable=True)

    # Option 2: Proposer gives date range: "I'm free March 15-20"
    # System will return available slots in that range, proposer picks one
    preferred_date_start = Column(Date, nullable=True)
    preferred_date_end = Column(Date, nullable=True)

    # Why do they want to reschedule?
    reason = Column(Text, nullable=True)

    # Current status of this request
    status = Column(String(20), default="pending", nullable=False)
    # pending = waiting for other party to respond
    # accepted = other party accepted and picked a new slot
    # rejected = other party declined
    # expired = 30 days passed without response (auto-reject)

    # If accepted, which slot did they pick?
    accepted_slot_id = Column(
        Integer, ForeignKey("availability_slots.id"), nullable=True
    )

    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    # Auto-reject after 30 days
    expires_at = Column(DateTime(timezone=True), nullable=False)

    # Relationships
    booking = relationship("Booking", back_populates="reschedule_request")
    from_slot = relationship(
        "AvailabilitySlot", foreign_keys=[from_slot_id], viewonly=True
    )
    accepted_slot = relationship(
        "AvailabilitySlot", foreign_keys=[accepted_slot_id], viewonly=True
    )

    def __repr__(self):
        return f"<RescheduleRequest booking {self.booking_id} by {self.initiated_by}: {self.status}>"
