from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime


class ReviewCreate(BaseModel):
    rating: float
    comment: Optional[str] = None

    @field_validator("rating")
    @classmethod
    def validate_rating(cls, v):
        if v < 1.0 or v > 5.0:
            raise ValueError("Rating must be between 1.0 and 5.0")
        return round(v * 2) / 2


class ReviewReply(BaseModel):
    mentor_reply: str


class ReviewDispute(BaseModel):
    dispute_reason: str


class ReviewOut(BaseModel):
    id: int
    mentor_profile_id: int
    reviewer_id: int
    reviewer_name: str
    rating: float
    comment: Optional[str]
    created_at: datetime
    mentor_reply: Optional[str] = None
    mentor_replied_at: Optional[datetime] = None
    is_disputed: Optional[str] = None

    class Config:
        from_attributes = True
