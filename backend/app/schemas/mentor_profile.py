from pydantic import BaseModel
from typing import List, Optional


# ── Skill schemas ─────────────────────────────────────────────────────────


class SkillBase(BaseModel):
    name: str


class SkillOut(SkillBase):
    id: int
    category_id: Optional[int] = None

    class Config:
        from_attributes = True


class SkillWithCategory(SkillOut):
    category_name: Optional[str] = None

    class Config:
        from_attributes = True


# ── Category schemas ──────────────────────────────────────────────────────


class CategoryOut(BaseModel):
    id: int
    name: str
    description: Optional[str] = None
    icon: Optional[str] = None
    skills: List[SkillOut] = []

    class Config:
        from_attributes = True


# ── Mentor profile schemas ────────────────────────────────────────────────


class MentorProfileCreate(BaseModel):
    bio: Optional[str] = None
    hourly_rate: Optional[float] = None
    is_visible: bool = True
    skills: List[str] = []
    # New fields
    years_experience: Optional[int] = None
    languages: Optional[str] = None
    session_format: Optional[str] = "online"
    location: Optional[str] = None
    tags: Optional[str] = None


class MentorProfileOut(BaseModel):
    id: int
    user_id: int
    bio: Optional[str]
    hourly_rate: Optional[float]
    is_visible: bool
    years_experience: Optional[int] = None
    languages: Optional[str] = None
    session_format: Optional[str] = None
    location: Optional[str] = None
    tags: Optional[str] = None

    class Config:
        from_attributes = True


class MentorProfileWithSkills(MentorProfileOut):
    skills: List[SkillOut] = []
    user_name: str
    average_rating: Optional[float] = None
    total_reviews: int = 0

    class Config:
        from_attributes = True


# ── Search result schema ──────────────────────────────────────────────────
# Extends MentorProfileWithSkills with smart sort fields


class MentorSearchResult(MentorProfileWithSkills):
    relevance_score: Optional[float] = (
        None  # 0-100, only present when smart sort active
    )
    match_reasons: List[str] = []  # e.g. ["Matches your Python interest"]
    available_slot_count: int = 0

    class Config:
        from_attributes = True
