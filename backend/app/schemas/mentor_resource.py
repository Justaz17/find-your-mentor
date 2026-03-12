from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime


class MentorResourceCreate(BaseModel):
    title: str
    type: str  # video, link, note
    content: str
    is_public: bool = True

    @field_validator("type")
    @classmethod
    def validate_type(cls, v):
        allowed = ["video", "link", "note"]
        if v not in allowed:
            raise ValueError(f"Type must be one of {allowed}")
        return v

    @field_validator("content")
    @classmethod
    def validate_content(cls, v):
        if not v.strip():
            raise ValueError("Content cannot be empty")
        return v.strip()


class MentorResourceOut(BaseModel):
    id: int
    mentor_profile_id: int
    title: str
    type: str
    content: str
    is_public: bool
    created_at: datetime

    class Config:
        from_attributes = True
