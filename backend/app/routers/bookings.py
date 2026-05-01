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
from sqlalchemy.orm import Session, joinedload

router = APIRouter(prefix="/bookings", tags=["bookings"])


def booking_to_dict(b: Booking, learner_name: str) -> dict:
    return {
        "id": b.id,
        "learner_id": b.learner_id,
        "learner_name": learner_name,
        "mentor_id": b.mentor_service.mentor_profile.user_id,
        "mentor_profile_id": b.mentor_service.mentor_profile_id,
        "mentor_service_id": b.mentor_service_id,
        "service_title": b.mentor_service.title,
        "availability_slot_id": b.availability_slot_id,
        # Using the booking's own times if they are set, falling back to slot times
        "slot_start": b.start_time or b.availability_slot.start_time,
        "slot_end": b.end_time or b.availability_slot.end_time,
        "start_time": b.start_time,
        "end_time": b.end_time,
        "learner_confirmed": b.learner_confirmed,
        "mentor_confirmed": b.mentor_confirmed,
        "learner_note": b.learner_note,
        "status": b.status,
        "payment_status": b.payment_status,
        "amount_paid": b.amount_paid,
        "created_at": b.created_at,
    }


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
    # ── Validate service ──────────────────────────────────────────────
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

    if service.mentor_profile.user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot book your own service",
        )

    # ── Resolve booking times ─────────────────────────────────────────
    if booking_data.start_time and booking_data.end_time:
        # New sub-slot booking - find the availability window that contains these times
        booking_start = booking_data.start_time
        booking_end = booking_data.end_time

        slot = (
            db.query(AvailabilitySlot)
            .filter(
                AvailabilitySlot.mentor_profile_id == service.mentor_profile_id,
                AvailabilitySlot.status == AvailabilitySlotStatus.AVAILABLE,
                AvailabilitySlot.start_time <= booking_start,
                AvailabilitySlot.end_time >= booking_end,
            )
            .first()
        )

        if not slot:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="No available slot covers the requested time",
            )

    elif booking_data.availability_slot_id:
        # Legacy slot ID booking
        slot = (
            db.query(AvailabilitySlot)
            .filter(
                AvailabilitySlot.id == booking_data.availability_slot_id,
                AvailabilitySlot.status == AvailabilitySlotStatus.AVAILABLE,
                AvailabilitySlot.mentor_profile_id == service.mentor_profile_id,
            )
            .first()
        )

        if not slot:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail="Slot not available",
            )

        booking_start = slot.start_time
        booking_end = slot.end_time
    else:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Either availability_slot_id or start_time/end_time must be provided",
        )

    # ── Validate timing ───────────────────────────────────────────────
    if booking_start <= datetime.now(timezone.utc):
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot book a slot in the past",
        )

    # ── Validate service duration fits ────────────────────────────────
    requested_minutes = int((booking_end - booking_start).total_seconds() / 60)
    if requested_minutes < service.duration_minutes:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Requested time ({requested_minutes}min) is less than service duration ({service.duration_minutes}min)",
        )

    # ── Check for overlapping bookings within this window ─────────────
    overlapping = (
        db.query(Booking)
        .filter(
            Booking.availability_slot_id == slot.id,
            Booking.status.in_(["pending", "confirmed"]),
            Booking.start_time.isnot(None),
            Booking.end_time.isnot(None),
            Booking.start_time < booking_end,
            Booking.end_time > booking_start,
        )
        .first()
    )
    if overlapping:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="This time is already booked",
        )

    # ── Check learner doesn't double book ─────────────────────────────
    learner_overlap = (
        db.query(Booking)
        .join(AvailabilitySlot)
        .filter(
            Booking.learner_id == current_user.id,
            Booking.status.in_(["pending", "confirmed"]),
            Booking.start_time.isnot(None),
            Booking.end_time.isnot(None),
            Booking.start_time < booking_end,
            Booking.end_time > booking_start,
        )
        .first()
    )
    if learner_overlap:
        raise HTTPException(
            status_code=status.HTTP_409_CONFLICT,
            detail="You already have a booking during this time",
        )

    # ── Create booking with specific times ────────────────────────────
    new_booking = Booking(
        learner_id=current_user.id,
        mentor_service_id=service.id,
        availability_slot_id=slot.id,
        start_time=booking_start,
        end_time=booking_end,
        learner_note=booking_data.learner_note,
        status="pending",
        payment_status="pending",
        amount_paid=service.price,
    )

    # ── Only mark slot as fully booked if no time remains ─────────────
    slot_minutes = int((slot.end_time - slot.start_time).total_seconds() / 60)
    booked_minutes = (
        db.query(Booking)
        .filter(
            Booking.availability_slot_id == slot.id,
            Booking.status.in_(["pending", "confirmed"]),
        )
        .count()
    ) * service.duration_minutes + service.duration_minutes

    if booked_minutes >= slot_minutes:
        slot.status = AvailabilitySlotStatus.BOOKED

    db.add(new_booking)
    db.commit()
    db.refresh(new_booking)

    return booking_to_dict(new_booking, current_user.name)


@router.get("/me", response_model=List[BookingOut])
def get_my_bookings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get all bookings for the current user as learner."""
    bookings = (
        db.query(Booking)
        .options(
            joinedload(Booking.mentor_service).joinedload(MentorService.mentor_profile)
        )
        .join(AvailabilitySlot)
        .filter(Booking.learner_id == current_user.id)
        .order_by(AvailabilitySlot.start_time.desc())
        .all()
    )
    result = [booking_to_dict(b, current_user.name) for b in bookings]
    print(f" Returning {len(result)} bookings")
    if result:
        print(f" First booking: {result[0]}")
    return result
    # return [booking_to_dict(b, current_user.name) for b in bookings]


@router.get("/mentor/me", response_model=List[BookingOut])
def get_mentor_bookings(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get all bookings for the current user as mentor."""
    bookings = (
        db.query(Booking)
        .options(
            joinedload(Booking.learner),
            joinedload(Booking.mentor_service).joinedload(MentorService.mentor_profile),
        )
        .join(MentorService)
        .join(AvailabilitySlot)
        .filter(MentorService.mentor_profile.has(user_id=current_user.id))
        .order_by(AvailabilitySlot.start_time.desc())
        .all()
    )
    return [
        booking_to_dict(b, b.learner.name if b.learner else "Unknown") for b in bookings
    ]


@router.post("/{booking_id}/approve")
def approve_booking(
    booking_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Mentor approves a pending booking."""
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found"
        )

    if booking.mentor_service.mentor_profile.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only approve your own bookings",
        )

    if booking.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Booking is {booking.status}, cannot approve",
        )

    booking.status = "confirmed"
    booking.payment_status = "pending"
    db.commit()

    return {
        "message": "Booking approved",
        "booking_id": booking.id,
        "status": booking.status,
    }


def restore_slot_if_no_bookings(slot: AvailabilitySlot, db: Session):
    """Only restore slot to available if no other active bookings exist."""
    active_bookings = (
        db.query(Booking)
        .filter(
            Booking.availability_slot_id == slot.id,
            Booking.status.in_(["pending", "confirmed"]),
        )
        .count()
    )
    if active_bookings == 0:
        slot.status = AvailabilitySlotStatus.AVAILABLE


@router.post("/{booking_id}/deny")
def deny_booking(
    booking_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Mentor denies a pending booking and frees the slot."""
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found"
        )

    if booking.mentor_service.mentor_profile.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only deny your own bookings",
        )

    if booking.status != "pending":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Booking is {booking.status}, cannot deny",
        )

    booking.status = "cancelled_by_mentor"
    restore_slot_if_no_bookings(booking.availability_slot, db)
    db.commit()

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
    """Learner cancels their booking with refund policy applied."""
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found"
        )

    if booking.learner_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only cancel your own bookings",
        )

    if booking.status in ["completed", "cancelled_by_learner", "cancelled_by_mentor"]:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Booking is {booking.status}, cannot cancel",
        )

    now = datetime.now(timezone.utc)
    hours_until_session = (
        booking.availability_slot.start_time - now
    ).total_seconds() / 3600

    if hours_until_session >= 24:
        refund_amount = booking.amount_paid
        booking.payment_status = "refunded"
    elif hours_until_session >= 2:
        refund_amount = booking.amount_paid * 0.7
        booking.payment_status = "partial_refund"
    else:
        refund_amount = 0
        booking.payment_status = "pending"

    booking.status = "cancelled_by_learner"
    restore_slot_if_no_bookings(booking.availability_slot, db)
    db.commit()

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
    """Mentor marks a confirmed booking as completed."""
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Booking not found"
        )

    if booking.mentor_service.mentor_profile.user_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only complete your own bookings",
        )

    if booking.status != "confirmed":
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail=f"Booking is {booking.status}, cannot complete",
        )

    booking.status = "completed"
    booking.payment_status = "paid"
    db.commit()

    return {
        "message": "Booking completed",
        "booking_id": booking.id,
        "status": booking.status,
    }


@router.post("/{booking_id}/learner-confirm")
def learner_confirm(
    booking_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.learner_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your booking")
    if booking.status != "confirmed":
        raise HTTPException(status_code=400, detail=f"Booking is {booking.status}")

    booking.learner_confirmed = True
    if booking.mentor_confirmed:
        booking.status = "completed"
        booking.payment_status = "paid"

    db.commit()
    return {
        "message": "Attendance confirmed",
        "booking_id": booking.id,
        "completed": booking.status == "completed",
    }


@router.post("/{booking_id}/mentor-confirm")
def mentor_confirm(
    booking_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    booking = db.query(Booking).filter(Booking.id == booking_id).first()
    if not booking:
        raise HTTPException(status_code=404, detail="Booking not found")
    if booking.mentor_service.mentor_profile.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not your booking")
    if booking.status != "confirmed":
        raise HTTPException(status_code=400, detail=f"Booking is {booking.status}")

    booking.mentor_confirmed = True
    if booking.learner_confirmed:
        booking.status = "completed"
        booking.payment_status = "paid"

    db.commit()
    return {
        "message": "Session marked as completed",
        "booking_id": booking.id,
        "completed": booking.status == "completed",
    }
