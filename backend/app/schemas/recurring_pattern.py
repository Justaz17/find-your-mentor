from pydantic import BaseModel, Field, field_validator
from typing import Optional
from datetime import date


class RecurringPatternCreate(BaseModel):
    """
    Create a new recurring pattern.

    Example:
    {
        "day_of_week": "MONDAY",
        "start_time": "19:00",
        "end_time": "21:00",
        "generate_until": "2026-05-31"
    }
    """

    day_of_week: str = Field(
        ...,
        description="MONDAY, TUESDAY, WEDNESDAY, THURSDAY, FRIDAY, SATURDAY, SUNDAY",
    )
    start_time: str = Field(..., description="HH:MM format, e.g. 19:00")
    end_time: str = Field(..., description="HH:MM format, e.g. 21:00")
    generate_until: date = Field(
        ..., description="When to stop generating slots from this pattern"
    )

    @field_validator("day_of_week")
    @classmethod
    def validate_day(cls, v):
        valid_days = [
            "MONDAY",
            "TUESDAY",
            "WEDNESDAY",
            "THURSDAY",
            "FRIDAY",
            "SATURDAY",
            "SUNDAY",
        ]
        if v.upper() not in valid_days:
            raise ValueError(f"Day must be one of {valid_days}")
        return v.upper()

    @field_validator("start_time", "end_time")
    @classmethod
    def validate_time_format(cls, v):
        # Check HH:MM format
        if not isinstance(v, str) or len(v) != 5 or v[2] != ":":
            raise ValueError("Time must be in HH:MM format (e.g., 19:00)")
        try:
            hours, minutes = v.split(":")
            h = int(hours)
            m = int(minutes)
            if not (0 <= h < 24) or not (0 <= m < 60):
                raise ValueError("Invalid time values")
        except ValueError:
            raise ValueError("Time must be in HH:MM format with valid values")
        return v

    @field_validator("generate_until")
    @classmethod
    def validate_date(cls, v):
        # Must be in the future
        from datetime import datetime, timezone

        today = datetime.now().date()
        if v <= today:
            raise ValueError("generate_until must be in the future")
        return v


class RecurringPatternUpdate(BaseModel):
    """
    Update an existing recurring pattern.
    Can toggle is_active or update the generate_until date.
    """

    is_active: Optional[bool] = None
    generate_until: Optional[date] = None
    start_time: Optional[str] = None
    end_time: Optional[str] = None

    @field_validator("start_time", "end_time", mode="before")
    @classmethod
    def validate_time_format(cls, v):
        if v is None:
            return v
        # Check HH:MM format
        if not isinstance(v, str) or len(v) != 5 or v[2] != ":":
            raise ValueError("Time must be in HH:MM format (e.g., 19:00)")
        try:
            hours, minutes = v.split(":")
            h = int(hours)
            m = int(minutes)
            if not (0 <= h < 24) or not (0 <= m < 60):
                raise ValueError("Invalid time values")
        except ValueError:
            raise ValueError("Time must be in HH:MM format with valid values")
        return v


class RecurringPatternOut(BaseModel):
    """
    Response when creating/reading a recurring pattern.
    """

    id: int
    mentor_profile_id: int
    day_of_week: str
    start_time: str
    end_time: str
    is_active: bool
    generate_until: date

    class Config:
        from_attributes = True
