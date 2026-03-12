from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, Text
from sqlalchemy.orm import relationship
from app.db.database import Base


class MentorService(Base):
    __tablename__ = "mentor_services"

    id = Column(Integer, primary_key=True, index=True)
    mentor_profile_id = Column(
        Integer, ForeignKey("mentor_profiles.id"), nullable=False
    )
    title = Column(String(100), nullable=False)
    description = Column(Text, nullable=True)
    duration_minutes = Column(Integer, nullable=False)  # 30, 60, 120
    price = Column(Float, nullable=False)  # 0.00 for free consultations
    is_active = Column(Boolean, default=True)

    # Relationships
    mentor_profile = relationship("MentorProfile", back_populates="services")
    bookings = relationship("Booking", back_populates="mentor_service")
