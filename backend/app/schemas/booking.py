from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime


class BookingCreate(BaseModel):
    """Schema for creating a booking - supports both slot ID and start/end times"""

    mentor_service_id: int

    # Option 1: Old method - direct slot ID
    availability_slot_id: Optional[int] = None

    # Option 2: New method - start/end times from timeline
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None

    learner_note: Optional[str] = None

    @field_validator("learner_note")
    @classmethod
    def validate_note(cls, v):
        """Validate learner note is not too long"""
        if v and len(v) > 1000:
            raise ValueError("Note cannot exceed 1000 characters")
        return v

    @field_validator("end_time")
    @classmethod
    def validate_times(cls, v, info):
        """Validate that either slot_id OR start/end times are provided"""
        if "availability_slot_id" in info.data:
            slot_id = info.data.get("availability_slot_id")
            start_time = info.data.get("start_time")

            # Must provide either slot_id OR both start/end times
            if not slot_id and not start_time:
                raise ValueError(
                    "Either availability_slot_id or start_time/end_time must be provided"
                )

            # If using start/end times, end must be after start
            if start_time and v and v <= start_time:
                raise ValueError("end_time must be after start_time")

        return v


class BookingOut(BaseModel):
    """Schema for booking output"""

    id: int
    mentor_id: int
    mentor_profile_id: int
    learner_id: int
    learner_name: str
    mentor_service_id: int
    service_title: str
    availability_slot_id: int
    slot_start: datetime
    slot_end: datetime
    learner_confirmed: bool = False
    mentor_confirmed: bool = False
    start_time: Optional[datetime] = (
        None  # the actual booked time within the availability window
    )
    end_time: Optional[datetime] = (
        None  # the actual booked time within the availability window
    )
    learner_note: Optional[str]
    status: (
        str  # pending, confirmed, completed, cancelled_by_learner, cancelled_by_mentor
    )
    payment_status: str  # pending, paid, refunded, partial_refund
    amount_paid: float
    created_at: datetime

    class Config:
        from_attributes = True


class BookingCancel(BaseModel):
    """Schema for cancellation response"""

    message: str
    booking_id: int
    status: str
    refund_amount: float
