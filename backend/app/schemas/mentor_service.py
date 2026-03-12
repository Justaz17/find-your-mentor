from pydantic import BaseModel, field_validator
from typing import Optional


class MentorServiceCreate(BaseModel):
    title: str
    description: Optional[str] = None
    duration_minutes: int
    price: float
    is_active: bool = True

    @field_validator("duration_minutes")
    @classmethod
    def validate_duration(cls, v):
        allowed = [30, 60, 90, 120]
        if v not in allowed:
            raise ValueError(f"Duration must be one of {allowed} minutes")
        return v

    @field_validator("price")
    # classMethods are used for validation when the validation logic is complex
    # or when you want to reuse the validation logic across multiple fields.
    # In this case, using a class method to validate the price field to ensure it is not negative and to round it to 2 decimal places.
    @classmethod
    def validate_price(cls, v):
        if v < 0:
            raise ValueError("Price cannot be negative")
        return round(v, 2)


class MentorServiceOut(BaseModel):
    id: int
    mentor_profile_id: int
    title: str
    description: Optional[str]
    duration_minutes: int
    price: float
    is_active: bool

    # Pydantic expects data as a dictionary,
    # but SQLAlchemy models are returned as objects.
    # This tells Pydantic to read data from the model's attributes.
    class Config:
        from_attributes = True


class MentorServiceUpdate(BaseModel):
    title: Optional[str] = None
    description: Optional[str] = None
    duration_minutes: Optional[int] = None
    price: Optional[float] = None
    is_active: Optional[bool] = None

    @field_validator("duration_minutes")
    @classmethod
    def validate_duration(cls, v):
        if v is not None:
            allowed = [30, 60, 90, 120]
            if v not in allowed:
                raise ValueError(f"Duration must be one of {allowed} minutes")
        return v
