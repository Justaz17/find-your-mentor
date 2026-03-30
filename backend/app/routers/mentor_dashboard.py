from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session, joinedload
from sqlalchemy import func
from typing import List, Optional
from datetime import datetime, timezone, timedelta
from pydantic import BaseModel

from app.models.booking import Booking
from app.models.mentor_profile import MentorProfile
from app.models.mentor_service import MentorService
from app.models.availability_slot import AvailabilitySlot
from app.models.review import Review
from app.models.user import User
from app.core.security import get_current_user
from app.db.database import get_db

router = APIRouter(prefix="/mentor-dashboard", tags=["mentor-dashboard"])


# ── Response schemas ──────────────────────────────────────────────────────


class DashboardStats(BaseModel):
    total_earnings: float
    earnings_this_month: float
    total_sessions: int
    sessions_this_month: int
    average_rating: Optional[float]
    total_reviews: int
    pending_count: int
    upcoming_count: int


class DashboardBooking(BaseModel):
    id: int
    learner_name: str
    service_title: str
    slot_start: datetime
    slot_end: datetime
    status: str
    payment_status: str
    amount_paid: float
    learner_note: Optional[str]


class DashboardReview(BaseModel):
    id: int
    reviewer_name: str
    rating: float
    comment: Optional[str]
    created_at: datetime


class DashboardOut(BaseModel):
    stats: DashboardStats
    pending_bookings: List[DashboardBooking]
    upcoming_bookings: List[DashboardBooking]
    recent_reviews: List[DashboardReview]
    has_profile: bool


def booking_to_dict(b: Booking) -> DashboardBooking:
    return DashboardBooking(
        id=b.id,
        learner_name=b.learner.name if b.learner else "Unknown",
        service_title=b.mentor_service.title if b.mentor_service else "Unknown",
        slot_start=b.availability_slot.start_time,
        slot_end=b.availability_slot.end_time,
        status=b.status,
        payment_status=b.payment_status,
        amount_paid=b.amount_paid,
        learner_note=b.learner_note,
    )


@router.get("", response_model=DashboardOut)
def get_mentor_dashboard(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Returns everything the mentor dashboard needs in one call:
    - Stats (earnings, sessions, rating, pending count)
    - Pending bookings needing action
    - Upcoming confirmed sessions
    - Recent reviews
    """
    # Get mentor profile
    mentor = (
        db.query(MentorProfile).filter(MentorProfile.user_id == current_user.id).first()
    )

    if not mentor:
        return DashboardOut(
            stats=DashboardStats(
                total_earnings=0,
                earnings_this_month=0,
                total_sessions=0,
                sessions_this_month=0,
                average_rating=None,
                total_reviews=0,
                pending_count=0,
                upcoming_count=0,
            ),
            pending_bookings=[],
            upcoming_bookings=[],
            recent_reviews=[],
            has_profile=False,
        )

    now = datetime.now(timezone.utc)
    month_start = now.replace(day=1, hour=0, minute=0, second=0, microsecond=0)

    # All bookings for this mentor
    all_bookings = (
        db.query(Booking)
        .options(
            joinedload(Booking.learner),
            joinedload(Booking.mentor_service),
            joinedload(Booking.availability_slot),
        )
        .join(MentorService)
        .filter(MentorService.mentor_profile_id == mentor.id)
        .all()
    )

    # Stats
    completed = [b for b in all_bookings if b.status == "completed"]
    completed_this_month = [
        b
        for b in completed
        if b.availability_slot and b.availability_slot.start_time >= month_start
    ]

    total_earnings = sum(b.amount_paid for b in completed)
    earnings_this_month = sum(b.amount_paid for b in completed_this_month)

    pending = [b for b in all_bookings if b.status == "pending"]
    upcoming = [
        b
        for b in all_bookings
        if b.status == "confirmed"
        and b.availability_slot
        and b.availability_slot.start_time > now
    ]

    # Sort upcoming by soonest first
    upcoming.sort(key=lambda b: b.availability_slot.start_time)
    # Sort pending by oldest first (most urgent)
    pending.sort(key=lambda b: b.created_at)

    # Reviews
    reviews = (
        db.query(Review)
        .options(joinedload(Review.reviewer))
        .filter(Review.mentor_profile_id == mentor.id)
        .order_by(Review.created_at.desc())
        .limit(5)
        .all()
    )

    rating_data = (
        db.query(
            func.avg(Review.rating).label("avg"),
            func.count(Review.id).label("count"),
        )
        .filter(Review.mentor_profile_id == mentor.id)
        .first()
    )

    return DashboardOut(
        stats=DashboardStats(
            total_earnings=round(total_earnings, 2),
            earnings_this_month=round(earnings_this_month, 2),
            total_sessions=len(completed),
            sessions_this_month=len(completed_this_month),
            average_rating=(
                round(float(rating_data.avg), 1) if rating_data.avg else None
            ),
            total_reviews=rating_data.count or 0,
            pending_count=len(pending),
            upcoming_count=len(upcoming),
        ),
        pending_bookings=[booking_to_dict(b) for b in pending[:5]],
        upcoming_bookings=[booking_to_dict(b) for b in upcoming[:5]],
        recent_reviews=[
            DashboardReview(
                id=r.id,
                reviewer_name=r.reviewer.name if r.reviewer else "Anonymous",
                rating=r.rating,
                comment=r.comment,
                created_at=r.created_at,
            )
            for r in reviews
        ],
        has_profile=True,
    )
