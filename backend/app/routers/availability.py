from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from app.models.booking import Booking
from app.schemas.availability_slot import AvailabilitySlotCreate, AvailabilitySlotOut
from app.models.user import User
from app.models.mentor_profile import MentorProfile
from app.models.availability_slot import AvailabilitySlot, AvailabilitySlotStatus
from app.core.security import get_current_user
from app.db.database import get_db
from app.schemas.booking import (
    BookingCreate,
    BookingOut,
    BookingCancel,
    BookingMentorNote,
)

router = APIRouter(prefix="/availability", tags=["availability"])


@router.get(
    "/mentors/me/availability",
    response_model=List[AvailabilitySlotOut],
)
def get_my_availability(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get all availability slots for the current mentor.
    Returns both available and booked slots.
    """
    mentor_profile = (
        db.query(MentorProfile).filter(MentorProfile.user_id == current_user.id).first()
    )
    if not mentor_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mentor profile not found. Create a mentor profile first.",
        )

    slots = (
        db.query(AvailabilitySlot)
        .filter(AvailabilitySlot.mentor_profile_id == mentor_profile.id)
        .order_by(AvailabilitySlot.start_time)
        .all()
    )
    return slots


@router.post(
    "/mentors/me/availability",
    response_model=AvailabilitySlotOut,
    status_code=status.HTTP_201_CREATED,
)
def create_availability_slot(
    slot_data: AvailabilitySlotCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Create availability slot for current user's mentor profile.
    """
    mentor_profile = (
        db.query(MentorProfile).filter(MentorProfile.user_id == current_user.id).first()
    )
    if not mentor_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mentor profile not found. Create a mentor profile first.",
        )

    # Check for overlapping slots
    overlapping = (
        db.query(AvailabilitySlot)
        .filter(
            AvailabilitySlot.mentor_profile_id == mentor_profile.id,
            AvailabilitySlot.status == AvailabilitySlotStatus.AVAILABLE,
            AvailabilitySlot.start_time < slot_data.end_time,
            AvailabilitySlot.end_time > slot_data.start_time,
        )
        .first()
    )
    if overlapping:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Slot overlaps with existing availability",
        )

    new_slot = AvailabilitySlot(
        mentor_profile_id=mentor_profile.id,
        start_time=slot_data.start_time,
        end_time=slot_data.end_time,
        status=AvailabilitySlotStatus.AVAILABLE,
    )
    db.add(new_slot)
    db.commit()
    db.refresh(new_slot)
    return new_slot


@router.get(
    "/mentors/{mentor_id}/availability",
    response_model=List[AvailabilitySlotOut],
)
def get_mentor_availability(mentor_id: int, db: Session = Depends(get_db)):
    """
    Get all open availability slots for a specific mentor.
    Public endpoint.
    """
    mentor = db.query(MentorProfile).filter(MentorProfile.id == mentor_id).first()
    if not mentor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Mentor not found"
        )

    slots = (
        db.query(AvailabilitySlot)
        .filter(
            AvailabilitySlot.mentor_profile_id == mentor_id,
            AvailabilitySlot.status == AvailabilitySlotStatus.AVAILABLE,
        )
        .order_by(AvailabilitySlot.start_time)
        .all()
    )
    return slots


@router.delete(
    "/mentors/me/availability/{slot_id}",
    status_code=status.HTTP_204_NO_CONTENT,
)
def delete_availability_slot(
    slot_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Delete an availability slot. Must own the slot.
    """
    mentor_profile = (
        db.query(MentorProfile).filter(MentorProfile.user_id == current_user.id).first()
    )
    if not mentor_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Mentor profile not found"
        )

    slot = (
        db.query(AvailabilitySlot)
        .filter(
            AvailabilitySlot.id == slot_id,
            AvailabilitySlot.mentor_profile_id == mentor_profile.id,
        )
        .first()
    )
    if not slot:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Slot not found"
        )

    if slot.status == AvailabilitySlotStatus.BOOKED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot delete booked slots"
        )

    db.delete(slot)
    db.commit()
    return None


@router.patch("/{booking_id}/mentor-note")
def add_mentor_note(
    booking_id: int,
    note_data: BookingMentorNote,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Mentor adds a private note on a booking.
    """
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found"
        )

    if booking.mentor_service.mentor_profile.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN, detail="Not your booking"
        )

    booking.mentor_note = note_data.mentor_note.strip()
    db.commit()
    return {"message": "Note saved", "booking_id": booking_id}
