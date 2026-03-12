from pydantic import BaseModel, field_validator
from datetime import datetime
from typing import Optional


class AvailabilitySlotCreate(BaseModel):
    """Schema for creating an availability slot"""

    start_time: datetime
    end_time: datetime

    @field_validator("end_time")
    @classmethod
    def end_after_start(cls, v, info):
        """Validate that end_time is after start_time"""
        if "start_time" in info.data and v <= info.data["start_time"]:
            raise ValueError("end_time must be after start_time")
        return v


class AvailabilitySlotOut(BaseModel):
    """Schema for availability slot output"""

    id: int
    mentor_profile_id: int
    start_time: datetime
    end_time: datetime
    status: str
    created_at: datetime

    class Config:
        from_attributes = True


class AvailabilitySlotUpdate(BaseModel):
    """Schema for updating slot status"""

    status: str
