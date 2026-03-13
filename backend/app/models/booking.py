from sqlalchemy import Column, Integer, String, Float, ForeignKey, Text, DateTime
from sqlalchemy.orm import relationship
from app.db.database import Base
from datetime import datetime, timezone
from sqlalchemy.orm import joinedload


class Booking(Base):
    __tablename__ = "bookings"

    id = Column(Integer, primary_key=True, index=True)
    learner_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    mentor_service_id = Column(
        Integer, ForeignKey("mentor_services.id"), nullable=False
    )
    availability_slot_id = Column(
        Integer, ForeignKey("availability_slots.id"), nullable=False
    )

    # Learner provides context to help mentor prepare
    learner_note = Column(Text, nullable=True)

    # Booking status: confirmed, completed, cancelled_by_learner, cancelled_by_mentor, no_show
    status = Column(String, default="confirmed", nullable=False)

    # NEW: How will they connect?
    # ONLINE_VIDEO_CALL, IN_PERSON, ASYNC
    connection_method = Column(String(30), nullable=True)

    # NEW: Suggested platform based on skill/mentor
    # E.g., "GitHub, Discord" for developers
    # E.g., "Google Meet, Slack" for business consultants
    suggested_platform = Column(String(200), nullable=True)

    # Mock payment tracking
    payment_status = Column(
        String, default="paid", nullable=False
    )  # paid, refunded, partial_refund
    amount_paid = Column(Float, nullable=False)

    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    learner = relationship("User", back_populates="bookings")
    mentor_service = relationship("MentorService", back_populates="bookings")
    availability_slot = relationship("AvailabilitySlot", back_populates="booking")

    # NEW: Link to cancellation record if this booking was cancelled
    cancellation = relationship("Cancellation", back_populates="booking", uselist=False)

    # NEW: Link to reschedule request if someone asked to reschedule
    reschedule_request = relationship(
        "RescheduleRequest", back_populates="booking", uselist=False
    )

    def __repr__(self):
        return f"<Booking learner {self.learner_id} → service {self.mentor_service_id}: {self.status}>"
