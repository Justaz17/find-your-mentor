from sqlalchemy import Column, Integer, String, ForeignKey, Text, Float
from sqlalchemy.orm import relationship
from app.db.database import Base


class LearnerProfile(Base):
    __tablename__ = "learner_profiles"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), unique=True, nullable=False)

    # Explicit preference fields — these power smart sort
    bio = Column(Text, nullable=True)
    preferred_category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)
    preferred_languages = Column(
        String, nullable=True
    )  # comma-separated e.g. "English,Irish"
    preferred_session_format = Column(
        String, nullable=True
    )  # "online","in_person","both"
    min_price = Column(Float, nullable=True)
    max_price = Column(Float, nullable=True)
    experience_level = Column(
        String, nullable=True
    )  # "beginner","intermediate","advanced"
    location = Column(String, nullable=True)

    # Goals — structured tags + optional free text
    # comma-separated from: exam_prep, beginner_support, career_change, fitness,
    # conversational_fluency, portfolio_building, interview_prep
    goal_tags = Column(String, nullable=True)
    goal_description = Column(Text, nullable=True)  # free text, used as soft signal

    # Availability preference — soft signal for smart sort
    # comma-separated from: weekday_mornings, weekday_afternoons, weekday_evenings,
    # weekend_mornings, weekend_afternoons, weekend_evenings
    availability_preference = Column(String, nullable=True)

    # Relationships
    user = relationship("User", back_populates="learner_profile")
    preferred_category = relationship("Category")
    interests = relationship(
        "LearnerInterest",
        back_populates="learner_profile",
        cascade="all, delete-orphan",
    )

    def __repr__(self):
        return f"<LearnerProfile user={self.user_id}>"


class LearnerInterest(Base):
    """
    Tracks which specific skills a learner is interested in.
    Powers the skill_match score in smart sort.
    """

    __tablename__ = "learner_interests"

    id = Column(Integer, primary_key=True, index=True)
    learner_profile_id = Column(
        Integer, ForeignKey("learner_profiles.id"), nullable=False
    )
    skill_id = Column(Integer, ForeignKey("skills.id"), nullable=False)
    current_level = Column(
        String, nullable=True
    )  # "beginner","intermediate","advanced"
    target_level = Column(String, nullable=True)  # where they want to get to

    # Relationships
    learner_profile = relationship("LearnerProfile", back_populates="interests")
    skill = relationship("Skill", back_populates="learner_interests")

    def __repr__(self):
        return (
            f"<LearnerInterest learner={self.learner_profile_id} skill={self.skill_id}>"
        )
