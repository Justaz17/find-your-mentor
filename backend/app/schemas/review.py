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
        # Round to nearest 0.5
        return round(v * 2) / 2


class ReviewOut(BaseModel):
    id: int
    mentor_profile_id: int
    reviewer_id: int
    reviewer_name: str
    rating: float
    comment: Optional[str]
    created_at: datetime

    class Config:
        from_attributes = True
