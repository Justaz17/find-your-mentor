from sqlalchemy import Column, Integer, String, ForeignKey, Boolean
from sqlalchemy.orm import relationship
from app.db.database import Base


class Skill(Base):
    __tablename__ = "skills"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, unique=True, nullable=False, index=True)
    category_id = Column(Integer, ForeignKey("categories.id"), nullable=True)

    # Relationships
    category = relationship("Category", back_populates="skills")
    mentor_skills = relationship("MentorSkill", back_populates="skill")
    learner_interests = relationship("LearnerInterest", back_populates="skill")

    def __repr__(self):
        return f"<Skill {self.name}>"


class MentorSkill(Base):
    __tablename__ = "mentor_skills"

    id = Column(Integer, primary_key=True, index=True)
    mentor_profile_id = Column(
        Integer, ForeignKey("mentor_profiles.id"), nullable=False
    )
    skill_id = Column(Integer, ForeignKey("skills.id"), nullable=False)
    is_primary = Column(Boolean, default=False)  # mentor's headline skills

    # Relationships
    mentor_profile = relationship("MentorProfile", back_populates="skills")
    skill = relationship("Skill", back_populates="mentor_skills")

    def __repr__(self):
        return f"<MentorSkill mentor={self.mentor_profile_id} skill={self.skill_id}>"
