from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from app.schemas.booking import BookingCreate, BookingOut, BookingCancel
from app.models.booking import Booking
from app.models.mentor_service import MentorService
from app.models.availability_slot import AvailabilitySlot, AvailabilitySlotStatus
from app.models.user import User
from app.core.security import get_current_user
from app.db.database import get_db

router = APIRouter(prefix="/bookings", tags=["bookings"])


@router.post(
    "",
    response_model=BookingOut,
    status_code=status.HTTP_201_CREATED,
)
def create_booking(
    booking_data: BookingCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Book a session with timeline start/end times. Validates:
    - Service exists and is active
    - Availability slot exists for the given start/end times
    - Service duration fits in slot duration
    - Not booking own service
    - Slot is in the future
    - No duplicate bookings for same slot
    - Booking status set to 'pending' (waiting for mentor approval)
    """

    # Get the service
    service = (
        db.query(MentorService)
        .filter(
            MentorService.id == booking_data.mentor_service_id,
            MentorService.is_active == True,
        )
        .first()
    )
    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service not found or inactive",
        )

    # Can't book your own service
    if service.mentor_profile.user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot book your own service",
        )

    # Find the availability slot matching the start/end times
    # If availability_slot_id is provided (fallback), use it
    slot = None

    if booking_data.availability_slot_id and booking_data.availability_slot_id > 0:
        # Old method - direct slot ID
        slot = (
            db.query(AvailabilitySlot)
            .filter(
                AvailabilitySlot.id == booking_data.availability_slot_id,
                AvailabilitySlot.status == AvailabilitySlotStatus.AVAILABLE,
                AvailabilitySlot.mentor_profile_id == service.mentor_profile_id,
            )
            .first()
        )
    elif booking_data.start_time and booking_data.end_time:
        # New method - find slot by start/end times
        slot = (
            db.query(AvailabilitySlot)
            .filter(
                AvailabilitySlot.start_time == booking_data.start_time,
                AvailabilitySlot.end_time == booking_data.end_time,
                AvailabilitySlot.status == AvailabilitySlotStatus.AVAILABLE,
                AvailabilitySlot.mentor_profile_id == service.mentor_profile_id,
            )
            .first()
        )

    if not slot:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Slot not available or doesn't exist for the selected time",
        )

    # Check slot is in the future
    if slot.start_time <= datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot book a slot in the past",
        )

    # Validate service duration fits in slot duration
    slot_duration_minutes = int((slot.end_time - slot.start_time).total_seconds() / 60)
    if service.duration_minutes > slot_duration_minutes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Service duration ({service.duration_minutes}min) exceeds slot duration ({slot_duration_minutes}min)",
        )

    # Check for duplicate bookings (same learner, same slot)
    existing_booking = (
        db.query(Booking)
        .filter(
            Booking.learner_id == current_user.id,
            Booking.availability_slot_id == slot.id,
            Booking.status.in_(["confirmed", "completed"]),
        )
        .first()
    )
    if existing_booking:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You already have a booking for this time slot",
        )

    # Create booking with PENDING approval status
    new_booking = Booking(
        learner_id=current_user.id,
        mentor_service_id=service.id,
        availability_slot_id=slot.id,
        learner_note=booking_data.learner_note,
        status="pending",  # Waiting for mentor approval
        payment_status="pending",  # Payment pending until approved
        amount_paid=service.price,
    )

    # Mark slot as booked (no longer available)
    slot.status = AvailabilitySlotStatus.BOOKED

    db.add(new_booking)
    db.commit()
    db.refresh(new_booking)

    # TODO: Send notification to mentor about new pending booking
    # notification_service.notify_mentor(
    #     mentor_id=service.mentor_profile.user_id,
    #     message=f"{current_user.name} requested to book {service.title}",
    #     booking_id=new_booking.id,
    #     action_required=True,
    # )

    return {
        "id": new_booking.id,
        "learner_id": new_booking.learner_id,
        "learner_name": current_user.name,
        "mentor_service_id": new_booking.mentor_service_id,
        "service_title": service.title,
        "availability_slot_id": new_booking.availability_slot_id,
        "slot_start": slot.start_time,
        "slot_end": slot.end_time,
        "learner_note": new_booking.learner_note,
        "status": new_booking.status,
        "payment_status": new_booking.payment_status,
        "amount_paid": new_booking.amount_paid,
        "created_at": new_booking.created_at,
    }


@router.get("/me", response_model=List[BookingOut])
def get_my_bookings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get all bookings for the current user (as learner). Ordered by slot start time."""

    bookings = (
        db.query(Booking)
        .join(AvailabilitySlot)
        .filter(Booking.learner_id == current_user.id)
        .order_by(AvailabilitySlot.start_time.desc())
        .all()
    )

    return [
        {
            "id": b.id,
            "learner_id": b.learner_id,
            "learner_name": current_user.name,
            "mentor_service_id": b.mentor_service_id,
            "service_title": b.mentor_service.title,
            "availability_slot_id": b.availability_slot_id,
            "slot_start": b.availability_slot.start_time,
            "slot_end": b.availability_slot.end_time,
            "learner_note": b.learner_note,
            "status": b.status,
            "payment_status": b.payment_status,
            "amount_paid": b.amount_paid,
            "created_at": b.created_at,
        }
        for b in bookings
    ]


@router.get("/mentor/me", response_model=List[BookingOut])
def get_mentor_bookings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get all bookings for the current user (as mentor). Ordered by slot start time."""

    bookings = (
        db.query(Booking)
        .join(MentorService)
        .join(AvailabilitySlot)
        .filter(MentorService.mentor_profile.has(user_id=current_user.id))
        .order_by(AvailabilitySlot.start_time.desc())
        .all()
    )

    return [
        {
            "id": b.id,
            "learner_id": b.learner_id,
            "learner_name": (
                db.query(User).filter(User.id == b.learner_id).first().name
                if db.query(User).filter(User.id == b.learner_id).first()
                else "Unknown"
            ),
            "mentor_service_id": b.mentor_service_id,
            "service_title": b.mentor_service.title,
            "availability_slot_id": b.availability_slot_id,
            "slot_start": b.availability_slot.start_time,
            "slot_end": b.availability_slot.end_time,
            "learner_note": b.learner_note,
            "status": b.status,
            "payment_status": b.payment_status,
            "amount_paid": b.amount_paid,
            "created_at": b.created_at,
        }
        for b in bookings
    ]


@router.post("/{booking_id}/approve")
def approve_booking(
    booking_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Mentor approves a pending booking.
    Changes status from 'pending' to 'confirmed'.
    """
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found",
        )

    # Verify current user is the mentor for this booking
    if booking.mentor_service.mentor_profile.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only approve your own bookings",
        )

    # Only approve if status is pending
    if booking.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Booking status is {booking.status}, cannot approve",
        )

    booking.status = "confirmed"
    booking.payment_status = "pending"  # Still pending until session is complete
    db.commit()
    db.refresh(booking)

    # TODO: Send notification to learner
    # notification_service.notify_learner(
    #     learner_id=booking.learner_id,
    #     message=f"{current_user.name} approved your booking",
    # )

    return {
        "message": "Booking approved",
        "booking_id": booking.id,
        "status": booking.status,
    }


@router.post("/{booking_id}/deny")
def deny_booking(
    booking_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Mentor denies a pending booking.
    Changes status to 'cancelled_by_mentor' and frees up the slot.
    """
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found",
        )

    # Verify current user is the mentor for this booking
    if booking.mentor_service.mentor_profile.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only deny your own bookings",
        )

    # Only deny if status is pending
    if booking.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Booking status is {booking.status}, cannot deny",
        )

    booking.status = "cancelled_by_mentor"
    # Free up the slot again
    booking.availability_slot.status = AvailabilitySlotStatus.AVAILABLE
    db.commit()
    db.refresh(booking)

    # TODO: Send notification to learner with refund details
    # notification_service.notify_learner(
    #     learner_id=booking.learner_id,
    #     message=f"{current_user.name} declined your booking request",
    # )

    return {
        "message": "Booking denied",
        "booking_id": booking.id,
        "status": booking.status,
    }


@router.post("/{booking_id}/cancel")
def cancel_booking(
    booking_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Learner cancels their booking.
    Applies cancellation policy based on time until session.
    """
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found",
        )

    # Verify current user is the learner
    if booking.learner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only cancel your own bookings",
        )

    # Can't cancel if already completed
    if booking.status in ["completed", "cancelled_by_learner", "cancelled_by_mentor"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Booking status is {booking.status}, cannot cancel",
        )

    # Calculate refund amount based on cancellation policy
    now = datetime.now(timezone.utc)
    slot_start = booking.availability_slot.start_time
    hours_until_session = (slot_start - now).total_seconds() / 3600

    if hours_until_session >= 24:
        # Full refund
        refund_amount = booking.amount_paid
        booking.payment_status = "refunded"
    elif hours_until_session >= 2:
        # 70% refund
        refund_amount = booking.amount_paid * 0.7
        booking.payment_status = "partial_refund"
    else:
        # No refund
        refund_amount = 0
        booking.payment_status = "pending"  # No refund

    booking.status = "cancelled_by_learner"
    # Free up the slot
    booking.availability_slot.status = AvailabilitySlotStatus.AVAILABLE

    db.commit()
    db.refresh(booking)

    # TODO: Send notification to mentor about cancellation
    # notification_service.notify_mentor(
    #     mentor_id=booking.mentor_service.mentor_profile.user_id,
    #     message=f"{current_user.name} cancelled their booking",
    # )

    return {
        "message": "Booking cancelled",
        "booking_id": booking.id,
        "status": booking.status,
        "refund_amount": refund_amount,
    }


@router.post("/{booking_id}/complete")
def complete_booking(
    booking_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Mentor marks a confirmed booking as completed.
    Changes payment_status from 'pending' to 'paid'.
    """
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Booking not found",
        )

    # Verify current user is the mentor
    if booking.mentor_service.mentor_profile.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only complete your own bookings",
        )

    # Only complete if status is confirmed
    if booking.status != "confirmed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Booking status is {booking.status}, cannot complete",
        )

    booking.status = "completed"
    booking.payment_status = "paid"
    db.commit()
    db.refresh(booking)

    # TODO: Send notification to learner
    # notification_service.notify_learner(
    #     learner_id=booking.learner_id,
    #     message=f"Your session with {booking.mentor_service.mentor_profile.user.name} is complete",
    # )

    return {
        "message": "Booking completed",
        "booking_id": booking.id,
        "status": booking.status,
    }
