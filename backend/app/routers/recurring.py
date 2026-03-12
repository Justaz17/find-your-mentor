from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timezone, timedelta, date
from app.schemas.recurring_pattern import (
    RecurringPatternCreate,
    RecurringPatternOut,
    RecurringPatternUpdate,
)
from app.models.user import User
from app.models.mentor_profile import MentorProfile
from app.models.recurring_pattern import RecurringPattern
from app.models.availability_slot import AvailabilitySlot, AvailabilitySlotStatus
from app.core.security import get_current_user
from app.db.database import get_db

router = APIRouter(prefix="/recurring", tags=["recurring"])


def generate_slots_from_pattern(
    pattern: RecurringPattern, db: Session
) -> List[AvailabilitySlot]:
    """
    Helper function: Create individual 1-hour slots from a recurring pattern.

    E.g., RecurringPattern "Every Monday 7-9pm" → creates two slots:
    - Monday 7-8pm
    - Monday 8-9pm

    Slots are generated from today until pattern.generate_until.
    """
    slots_created = []

    # Get current date
    today = datetime.now(timezone.utc).date()

    # Parse start and end times
    start_h, start_m = map(int, pattern.start_time.split(":"))
    end_h, end_m = map(int, pattern.end_time.split(":"))

    # Day mapping: MONDAY=0, TUESDAY=1, ..., SUNDAY=6
    day_map = {
        "MONDAY": 0,
        "TUESDAY": 1,
        "WEDNESDAY": 2,
        "THURSDAY": 3,
        "FRIDAY": 4,
        "SATURDAY": 5,
        "SUNDAY": 6,
    }
    target_day = day_map[pattern.day_of_week]

    # Find the next occurrence of this day
    current = today
    days_ahead = (target_day - current.weekday()) % 7
    if days_ahead == 0 and current > today:
        days_ahead = 7

    next_occurrence = current + timedelta(days=days_ahead)

    # Generate slots for each occurrence until generate_until
    while next_occurrence <= pattern.generate_until:
        # Generate 1-hour slots between start and end time
        current_hour = start_h
        current_min = start_m

        while (current_hour, current_min) < (end_h, end_m):
            # Calculate slot times
            slot_start_time = datetime(
                next_occurrence.year,
                next_occurrence.month,
                next_occurrence.day,
                current_hour,
                current_min,
                tzinfo=timezone.utc,
            )

            # Determine next hour (assume 1-hour slots)
            next_hour = current_hour + 1
            next_min = current_min
            if next_min >= 60:
                next_hour += 1
                next_min = 0

            # Don't create slot if it goes past end time
            if (next_hour, next_min) > (end_h, end_m):
                break

            slot_end_time = datetime(
                next_occurrence.year,
                next_occurrence.month,
                next_occurrence.day,
                next_hour,
                next_min,
                tzinfo=timezone.utc,
            )

            # Create slot
            new_slot = AvailabilitySlot(
                mentor_profile_id=pattern.mentor_profile_id,
                recurring_pattern_id=pattern.id,
                start_time=slot_start_time,
                end_time=slot_end_time,
                status=AvailabilitySlotStatus.AVAILABLE,
            )
            db.add(new_slot)
            slots_created.append(new_slot)

            # Move to next hour
            current_hour = next_hour
            current_min = next_min

        # Move to next week's occurrence
        next_occurrence += timedelta(days=7)

    db.commit()
    return slots_created


@router.post(
    "/mentors/me/recurring",
    response_model=RecurringPatternOut,
    status_code=status.HTTP_201_CREATED,
)
def create_recurring_pattern(
    pattern_data: RecurringPatternCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Create a recurring availability pattern.

    This creates the pattern and auto-generates 1-hour slots for all occurrences
    from today until the specified end date.

    Example:
    POST /recurring/mentors/me/recurring
    {
        "day_of_week": "MONDAY",
        "start_time": "19:00",
        "end_time": "21:00",
        "generate_until": "2026-05-31"
    }

    This creates a Monday 7-9pm pattern and generates slots:
    - Monday 7-8pm
    - Monday 8-9pm
    For every Monday from today until May 31st.
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

    # Check if pattern already exists for this day
    existing = (
        db.query(RecurringPattern)
        .filter(
            RecurringPattern.mentor_profile_id == mentor_profile.id,
            RecurringPattern.day_of_week == pattern_data.day_of_week,
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"You already have a recurring pattern for {pattern_data.day_of_week}",
        )

    # Create the pattern
    new_pattern = RecurringPattern(
        mentor_profile_id=mentor_profile.id,
        day_of_week=pattern_data.day_of_week,
        start_time=pattern_data.start_time,
        end_time=pattern_data.end_time,
        generate_until=pattern_data.generate_until,
        is_active=True,
    )
    db.add(new_pattern)
    db.flush()  # Get the ID

    # Generate slots from this pattern
    generate_slots_from_pattern(new_pattern, db)

    db.commit()
    db.refresh(new_pattern)

    return new_pattern


@router.get("/mentors/me/recurring", response_model=List[RecurringPatternOut])
def get_my_recurring_patterns(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get all recurring patterns for the current mentor.
    Requires authentication.
    """
    mentor_profile = (
        db.query(MentorProfile).filter(MentorProfile.user_id == current_user.id).first()
    )
    if not mentor_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mentor profile not found",
        )

    patterns = (
        db.query(RecurringPattern)
        .filter(RecurringPattern.mentor_profile_id == mentor_profile.id)
        .order_by(RecurringPattern.day_of_week)
        .all()
    )

    return patterns


@router.patch("/mentors/me/recurring/{pattern_id}", response_model=RecurringPatternOut)
def update_recurring_pattern(
    pattern_id: int,
    update_data: RecurringPatternUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Update a recurring pattern.

    Can:
    - Toggle is_active on/off (without deleting)
    - Extend generate_until date (to schedule further ahead)

    Existing slots are NOT modified when you update a pattern.
    Only new slots generated in the future will follow the new schedule.
    """
    mentor_profile = (
        db.query(MentorProfile).filter(MentorProfile.user_id == current_user.id).first()
    )
    if not mentor_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mentor profile not found",
        )

    pattern = (
        db.query(RecurringPattern)
        .filter(
            RecurringPattern.id == pattern_id,
            RecurringPattern.mentor_profile_id == mentor_profile.id,
        )
        .first()
    )
    if not pattern:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recurring pattern not found",
        )

    # Update only provided fields
    if update_data.is_active is not None:
        pattern.is_active = update_data.is_active

    if update_data.generate_until is not None:
        # If extending the date, generate new slots
        old_until = pattern.generate_until
        pattern.generate_until = update_data.generate_until

        if update_data.generate_until > old_until:
            # Generate slots from old_until+1 day to new generate_until
            # This is an optimization: only generate the new ones
            generate_slots_from_pattern(pattern, db)

    if update_data.start_time is not None:
        pattern.start_time = update_data.start_time
    if update_data.end_time is not None:
        pattern.end_time = update_data.end_time

    db.commit()
    db.refresh(pattern)

    return pattern


@router.delete(
    "/mentors/me/recurring/{pattern_id}", status_code=status.HTTP_204_NO_CONTENT
)
def delete_recurring_pattern(
    pattern_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Delete a recurring pattern.

    This also cascades to delete all future availability slots generated from this pattern
    (unless they're already booked).

    Booked slots will NOT be deleted - mentor still has to honor those bookings.
    """
    mentor_profile = (
        db.query(MentorProfile).filter(MentorProfile.user_id == current_user.id).first()
    )
    if not mentor_profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mentor profile not found",
        )

    pattern = (
        db.query(RecurringPattern)
        .filter(
            RecurringPattern.id == pattern_id,
            RecurringPattern.mentor_profile_id == mentor_profile.id,
        )
        .first()
    )
    if not pattern:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Recurring pattern not found",
        )

    # Delete only non-booked slots generated from this pattern
    slots_to_delete = (
        db.query(AvailabilitySlot)
        .filter(
            AvailabilitySlot.recurring_pattern_id == pattern_id,
            AvailabilitySlot.status == AvailabilitySlotStatus.AVAILABLE,
        )
        .all()
    )

    for slot in slots_to_delete:
        db.delete(slot)

    # Delete the pattern itself
    db.delete(pattern)
    db.commit()

    return None
