from pydantic import BaseModel
from typing import List, Optional


# ── Interest schemas ──────────────────────────────────────────────────────


class LearnerInterestCreate(BaseModel):
    skill_id: int
    current_level: Optional[str] = None  # "beginner", "intermediate", "advanced"
    target_level: Optional[str] = None


class LearnerInterestOut(BaseModel):
    id: int
    skill_id: int
    skill_name: str
    current_level: Optional[str] = None
    target_level: Optional[str] = None

    class Config:
        from_attributes = True


# ── Learner profile schemas ───────────────────────────────────────────────


class LearnerProfileCreate(BaseModel):
    bio: Optional[str] = None
    preferred_category_id: Optional[int] = None
    preferred_languages: Optional[str] = None
    preferred_session_format: Optional[str] = None  # "online", "in_person", "both"
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    experience_level: Optional[str] = None  # "beginner", "intermediate", "advanced"
    location: Optional[str] = None
    goal_tags: Optional[str] = None  # comma-separated
    goal_description: Optional[str] = None
    availability_preference: Optional[str] = None  # comma-separated
    # Interests submitted together with the profile
    interests: List[LearnerInterestCreate] = []


class LearnerProfileOut(BaseModel):
    id: int
    user_id: int
    bio: Optional[str] = None
    preferred_category_id: Optional[int] = None
    preferred_category_name: Optional[str] = None
    preferred_languages: Optional[str] = None
    preferred_session_format: Optional[str] = None
    min_price: Optional[float] = None
    max_price: Optional[float] = None
    experience_level: Optional[str] = None
    location: Optional[str] = None
    goal_tags: Optional[str] = None
    goal_description: Optional[str] = None
    availability_preference: Optional[str] = None
    interests: List[LearnerInterestOut] = []

    class Config:
        from_attributes = True
