from sqlalchemy import Column, Integer, String
from app.db.database import Base
from sqlalchemy.orm import relationship


class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String, unique=True, index=True, nullable=False)
    name = Column(String, nullable=False)
    password_hash = Column(String, nullable=False)

    # Role: "learner", "mentor", "both"
    # All new registrations default to learner.
    # Becomes "mentor" when mentor profile is created.
    # Becomes "both" if they already had a learner profile when they create a mentor profile.
    role = Column(String, default="learner", nullable=False)

    # Relationships
    mentor_profile = relationship("MentorProfile", back_populates="user", uselist=False)
    learner_profile = relationship(
        "LearnerProfile", back_populates="user", uselist=False
    )
    reviews_given = relationship("Review", back_populates="reviewer")
    bookings = relationship("Booking", back_populates="learner")
