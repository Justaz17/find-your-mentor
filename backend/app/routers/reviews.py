from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.schemas.review import ReviewCreate, ReviewOut
from app.models.review import Review
from app.models.mentor_profile import MentorProfile
from app.models.user import User
from app.core.security import get_current_user
from app.db.database import get_db
from app.models.booking import Booking
from app.models.mentor_service import MentorService


router = APIRouter(prefix="/reviews", tags=["reviews"])


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
    """Create a review for a mentor. Requires authentication."""

    # Can't review yourself
    mentor = db.query(MentorProfile).filter(MentorProfile.id == mentor_id).first()
    if not mentor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mentor not found",
        )

    if mentor.user_id == current_user.id:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You cannot review yourself",
        )

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
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You can only review mentors after completing a session",
        )

    # Check if already reviewed
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
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="You have already reviewed this mentor",
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

    return {
        "id": new_review.id,
        "mentor_profile_id": new_review.mentor_profile_id,
        "reviewer_id": new_review.reviewer_id,
        "reviewer_name": current_user.name,
        "rating": new_review.rating,
        "comment": new_review.comment,
        "created_at": new_review.created_at,
    }


@router.get("/mentors/{mentor_id}", response_model=List[ReviewOut])
def get_mentor_reviews(
    mentor_id: int,
    db: Session = Depends(get_db),
):
    """Get all reviews for a mentor. Public endpoint."""

    mentor = db.query(MentorProfile).filter(MentorProfile.id == mentor_id).first()
    if not mentor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mentor not found",
        )

    reviews = (
        db.query(Review)
        .filter(Review.mentor_profile_id == mentor_id)
        .order_by(Review.created_at.desc())
        .all()
    )

    return [
        {
            "id": r.id,
            "mentor_profile_id": r.mentor_profile_id,
            "reviewer_id": r.reviewer_id,
            "reviewer_name": r.reviewer.name,
            "rating": r.rating,
            "comment": r.comment,
            "created_at": r.created_at,
        }
        for r in reviews
    ]


@router.delete("/{review_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_review(
    review_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete your own review. Requires authentication."""

    review = db.query(Review).filter(Review.id == review_id).first()
    if not review:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Review not found",
        )

    if review.reviewer_id != current_user.id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="You can only delete your own reviews",
        )

    db.delete(review)
    db.commit()
    return None
