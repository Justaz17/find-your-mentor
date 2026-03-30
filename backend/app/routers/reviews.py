from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from datetime import datetime, timezone
from app.schemas.review import ReviewCreate, ReviewOut, ReviewReply, ReviewDispute
from app.models.review import Review
from app.models.mentor_profile import MentorProfile
from app.models.user import User
from app.core.security import get_current_user
from app.db.database import get_db
from app.models.booking import Booking
from app.models.mentor_service import MentorService

router = APIRouter(prefix="/reviews", tags=["reviews"])


def review_to_dict(r: Review) -> dict:
    return {
        "id": r.id,
        "mentor_profile_id": r.mentor_profile_id,
        "reviewer_id": r.reviewer_id,
        "reviewer_name": r.reviewer.name if r.reviewer else "Anonymous",
        "rating": r.rating,
        "comment": r.comment,
        "created_at": r.created_at,
        "mentor_reply": r.mentor_reply,
        "mentor_replied_at": r.mentor_replied_at,
        "is_disputed": r.is_disputed,
    }


@router.post(
    "/mentors/{mentor_id}",
    response_model=ReviewOut,
    status_code=status.HTTP_201_CREATED,
)
def create_review(
    mentor_id: int,
    review_data: ReviewCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    mentor = db.query(MentorProfile).filter(MentorProfile.id == mentor_id).first()
    if not mentor:
        raise HTTPException(status_code=404, detail="Mentor not found")

    if mentor.user_id == current_user.id:
        raise HTTPException(status_code=400, detail="You cannot review yourself")

    has_completed_booking = (
        db.query(Booking)
        .join(MentorService)
        .filter(
            Booking.learner_id == current_user.id,
            MentorService.mentor_profile_id == mentor_id,
            Booking.status == "completed",
        )
        .first()
    )
    if not has_completed_booking:
        raise HTTPException(
            status_code=400,
            detail="You can only review mentors after completing a session",
        )

    existing = (
        db.query(Review)
        .filter(
            Review.mentor_profile_id == mentor_id,
            Review.reviewer_id == current_user.id,
        )
        .first()
    )
    if existing:
        raise HTTPException(
            status_code=400, detail="You have already reviewed this mentor"
        )

    new_review = Review(
        mentor_profile_id=mentor_id,
        reviewer_id=current_user.id,
        rating=review_data.rating,
        comment=review_data.comment,
    )
    db.add(new_review)
    db.commit()
    db.refresh(new_review)
    return review_to_dict(new_review)


@router.get("/mentors/{mentor_id}", response_model=List[ReviewOut])
def get_mentor_reviews(mentor_id: int, db: Session = Depends(get_db)):
    mentor = db.query(MentorProfile).filter(MentorProfile.id == mentor_id).first()
    if not mentor:
        raise HTTPException(status_code=404, detail="Mentor not found")

    reviews = (
        db.query(Review)
        .filter(Review.mentor_profile_id == mentor_id)
        .order_by(Review.created_at.desc())
        .all()
    )
    return [review_to_dict(r) for r in reviews]


@router.get("/my", response_model=List[ReviewOut])
def get_my_reviews(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Get all reviews for the logged-in mentor."""
    mentor = (
        db.query(MentorProfile).filter(MentorProfile.user_id == current_user.id).first()
    )
    if not mentor:
        raise HTTPException(status_code=404, detail="Mentor profile not found")

    reviews = (
        db.query(Review)
        .filter(Review.mentor_profile_id == mentor.id)
        .order_by(Review.created_at.desc())
        .all()
    )
    return [review_to_dict(r) for r in reviews]


@router.post("/{review_id}/reply", response_model=ReviewOut)
def reply_to_review(
    review_id: int,
    reply_data: ReviewReply,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Mentor replies to a review left on their profile."""
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    mentor = (
        db.query(MentorProfile)
        .filter(
            MentorProfile.id == review.mentor_profile_id,
            MentorProfile.user_id == current_user.id,
        )
        .first()
    )
    if not mentor:
        raise HTTPException(
            status_code=403, detail="You can only reply to reviews on your own profile"
        )

    review.mentor_reply = reply_data.mentor_reply.strip()
    review.mentor_replied_at = datetime.now(timezone.utc)
    db.commit()
    db.refresh(review)
    return review_to_dict(review)


@router.post("/{review_id}/dispute", response_model=ReviewOut)
def dispute_review(
    review_id: int,
    dispute_data: ReviewDispute,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Mentor disputes / reports a review."""
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")

    mentor = (
        db.query(MentorProfile)
        .filter(
            MentorProfile.id == review.mentor_profile_id,
            MentorProfile.user_id == current_user.id,
        )
        .first()
    )
    if not mentor:
        raise HTTPException(
            status_code=403, detail="You can only dispute reviews on your own profile"
        )

    if review.is_disputed == "pending":
        raise HTTPException(
            status_code=400, detail="Dispute already submitted for this review"
        )

    review.is_disputed = "pending"
    review.dispute_reason = dispute_data.dispute_reason.strip()
    db.commit()
    db.refresh(review)
    return review_to_dict(review)


@router.delete("/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_review(
    review_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(status_code=404, detail="Review not found")
    if review.reviewer_id != current_user.id:
        raise HTTPException(
            status_code=403, detail="You can only delete your own reviews"
        )
    db.delete(review)
    db.commit()
