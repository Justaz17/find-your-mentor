from sqlalchemy import Column, Integer, String, Float, ForeignKey, Text, DateTime
from sqlalchemy.orm import relationship
from app.db.database import Base
from datetime import datetime, timezone


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

    learner_note = Column(Text, nullable=True)
    mentor_note = Column(Text, nullable=True)  # private mentor note per session

    status = Column(String, default="pending", nullable=False)
    connection_method = Column(String(30), nullable=True)
    suggested_platform = Column(String(200), nullable=True)

    payment_status = Column(String, default="pending", nullable=False)
    amount_paid = Column(Float, nullable=False)

    created_at = Column(
        DateTime(timezone=True), default=lambda: datetime.now(timezone.utc)
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    learner = relationship("User", back_populates="bookings")
    mentor_service = relationship("MentorService", back_populates="bookings")
    availability_slot = relationship("AvailabilitySlot", back_populates="booking")
    cancellation = relationship("Cancellation", back_populates="booking", uselist=False)
    reschedule_request = relationship(
        "RescheduleRequest", back_populates="booking", uselist=False
    )
