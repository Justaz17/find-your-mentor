from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime
from app.schemas.availability_slot import AvailabilitySlotCreate, AvailabilitySlotOut
from app.models.user import User
from app.models.mentor_profile import MentorProfile
from app.models.availability_slot import AvailabilitySlot, AvailabilitySlotStatus
from app.core.security import get_current_user
from app.db.database import get_db

router = APIRouter(prefix="/availability", tags=["availability"])


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
    Requires authentication and user must have a mentor profile.
    """
    # Check if user has mentor profile
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

    # Create slot
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
    "/mentors/{mentor_id}/availability", response_model=List[AvailabilitySlotOut]
)
def get_mentor_availability(mentor_id: int, db: Session = Depends(get_db)):
    """
    Get all open availability slots for a specific mentor.
    Public endpoint - no authentication required.
    """
    # Verify mentor exists
    mentor = db.query(MentorProfile).filter(MentorProfile.id == mentor_id).first()
    if not mentor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Mentor not found"
        )

    # Get only open slots
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
    "/mentors/me/availability/{slot_id}", status_code=status.HTTP_204_NO_CONTENT
)
def delete_availability_slot(
    slot_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Delete an availability slot.
    Requires authentication and user must own the slot.
    """
    # Get user's mentor profile
    mentor_profile = (
        db.query(MentorProfile).filter(MentorProfile.user_id == current_user.id).first()
    )

    if not mentor_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Mentor profile not found"
        )

    # Get the slot
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
            status_code=status.HTTP_404_NOT_FOUND, detail="Availability slot not found"
        )

    # Don't allow deleting booked slots
    if slot.status == AvailabilitySlotStatus.BOOKED:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST, detail="Cannot delete booked slots"
        )

    db.delete(slot)
    db.commit()

    return None
