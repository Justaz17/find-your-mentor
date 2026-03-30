from pydantic import BaseModel, field_validator
from typing import Optional
from datetime import datetime


class BookingCreate(BaseModel):
    mentor_service_id: int
    availability_slot_id: Optional[int] = None
    start_time: Optional[datetime] = None
    end_time: Optional[datetime] = None
    learner_note: Optional[str] = None

    @field_validator("learner_note")
    @classmethod
    def validate_note(cls, v):
        if v and len(v) > 1000:
            raise ValueError("Note cannot exceed 1000 characters")
        return v


class BookingMentorNote(BaseModel):
    mentor_note: str


class BookingOut(BaseModel):
    id: int
    learner_id: int
    learner_name: str
    mentor_id: int
    mentor_service_id: int
    service_title: str
    availability_slot_id: int
    slot_start: datetime
    slot_end: datetime
    learner_note: Optional[str]
    mentor_note: Optional[str] = None
    status: str
    payment_status: str
    amount_paid: float
    created_at: datetime

    class Config:
        from_attributes = True


class BookingCancel(BaseModel):
    message: str
    booking_id: int
    status: str
    refund_amount: float
