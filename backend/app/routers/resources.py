from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.schemas.mentor_resource import MentorResourceCreate, MentorResourceOut
from app.models.mentor_resource import MentorResource
from app.models.mentor_profile import MentorProfile
from app.models.booking import Booking
from app.models.user import User
from app.core.security import get_current_user
from app.db.database import get_db

router = APIRouter(prefix="/resources", tags=["resources"])


@router.post(
    "/me",
    response_model=MentorResourceOut,
    status_code=status.HTTP_201_CREATED,
)
def create_resource(
    resource_data: MentorResourceCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Add a resource to your mentor profile."""

    mentor = (
        db.query(MentorProfile).filter(MentorProfile.user_id == current_user.id).first()
    )
    if not mentor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Create a mentor profile first",
        )

    resource_count = (
        db.query(MentorResource)
        .filter(MentorResource.mentor_profile_id == mentor.id)
        .count()
    )
    if resource_count >= 20:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum 20 resources per mentor",
        )

    new_resource = MentorResource(
        mentor_profile_id=mentor.id,
        title=resource_data.title,
        type=resource_data.type,
        content=resource_data.content,
        is_public=resource_data.is_public,
    )

    db.add(new_resource)
    db.commit()
    db.refresh(new_resource)
    return new_resource


@router.get("/mentor/{mentor_id}", response_model=List[MentorResourceOut])
def get_mentor_resources(
    mentor_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get resources for a mentor.
    Public resources visible to all.
    Private resources only visible if you have a booking with this mentor.
    """

    mentor = db.query(MentorProfile).filter(MentorProfile.id == mentor_id).first()
    if not mentor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mentor not found",
        )

    # Check if current user has a completed or confirmed booking
    has_booking = (
        db.query(Booking)
        .filter(
            Booking.learner_id == current_user.id,
            Booking.mentor_service.has(mentor_profile_id=mentor_id),
            Booking.status.in_(["confirmed", "completed"]),
        )
        .first()
    )

    query = db.query(MentorResource).filter(
        MentorResource.mentor_profile_id == mentor_id
    )

    # If no booking, only show public resources
    if not has_booking and mentor.user_id != current_user.id:
        query = query.filter(MentorResource.is_public == True)

    resources = query.order_by(MentorResource.created_at.desc()).all()
    return resources


@router.delete("/me/{resource_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_resource(
    resource_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete one of your resources."""

    mentor = (
        db.query(MentorProfile).filter(MentorProfile.user_id == current_user.id).first()
    )
    if not mentor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mentor profile not found",
        )

    resource = (
        db.query(MentorResource)
        .filter(
            MentorResource.id == resource_id,
            MentorResource.mentor_profile_id == mentor.id,
        )
        .first()
    )
    if not resource:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Resource not found",
        )

    db.delete(resource)
    db.commit()
    return None
