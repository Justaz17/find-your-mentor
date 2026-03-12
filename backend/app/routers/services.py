from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from app.schemas.mentor_service import (
    MentorServiceCreate,
    MentorServiceOut,
    MentorServiceUpdate,
)
from app.models.mentor_profile import MentorProfile
from app.models.mentor_service import MentorService
from app.models.user import User
from app.core.security import get_current_user
from app.db.database import get_db

router = APIRouter(prefix="/services", tags=["services"])


@router.post(
    "/me",
    response_model=MentorServiceOut,
    status_code=status.HTTP_201_CREATED,
)
def create_service(
    service_data: MentorServiceCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Create a new service offering. Requires mentor profile."""

    mentor = (
        db.query(MentorProfile).filter(MentorProfile.user_id == current_user.id).first()
    )
    if not mentor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Create a mentor profile first",
        )

    # Limit services per mentor to prevent abuse
    service_count = (
        db.query(MentorService)
        .filter(MentorService.mentor_profile_id == mentor.id)
        .count()
    )
    if service_count >= 10:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Maximum 10 services per mentor",
        )

    new_service = MentorService(
        mentor_profile_id=mentor.id,
        title=service_data.title,
        description=service_data.description,
        duration_minutes=service_data.duration_minutes,
        price=service_data.price,
        is_active=service_data.is_active,
    )

    db.add(new_service)
    db.commit()
    db.refresh(new_service)
    return new_service


@router.get("/mentor/{mentor_id}", response_model=List[MentorServiceOut])
def get_mentor_services(
    mentor_id: int,
    db: Session = Depends(get_db),
):
    """Get all active services for a mentor. Public endpoint."""

    mentor = db.query(MentorProfile).filter(MentorProfile.id == mentor_id).first()
    if not mentor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mentor not found",
        )

    services = (
        db.query(MentorService)
        .filter(
            MentorService.mentor_profile_id == mentor_id,
            MentorService.is_active == True,
        )
        .all()
    )
    return services


@router.put("/me/{service_id}", response_model=MentorServiceOut)
def update_service(
    service_id: int,
    update_data: MentorServiceUpdate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Update one of your services. Requires authentication."""

    mentor = (
        db.query(MentorProfile).filter(MentorProfile.user_id == current_user.id).first()
    )
    if not mentor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mentor profile not found",
        )

    service = (
        db.query(MentorService)
        .filter(
            MentorService.id == service_id,
            MentorService.mentor_profile_id == mentor.id,
        )
        .first()
    )
    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service not found",
        )

    # Only update fields that were provided
    if update_data.title is not None:
        service.title = update_data.title
    if update_data.description is not None:
        service.description = update_data.description
    if update_data.duration_minutes is not None:
        service.duration_minutes = update_data.duration_minutes
    if update_data.price is not None:
        service.price = update_data.price
    if update_data.is_active is not None:
        service.is_active = update_data.is_active

    db.commit()
    db.refresh(service)
    return service


@router.delete("/me/{service_id}", status_code=status.HTTP_204_NO_CONTENT)
def delete_service(
    service_id: int,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """Delete one of your services. Cannot delete if active bookings exist."""

    mentor = (
        db.query(MentorProfile).filter(MentorProfile.user_id == current_user.id).first()
    )
    if not mentor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mentor profile not found",
        )

    service = (
        db.query(MentorService)
        .filter(
            MentorService.id == service_id,
            MentorService.mentor_profile_id == mentor.id,
        )
        .first()
    )
    if not service:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Service not found",
        )

    # Check for active bookings
    from app.models.booking import Booking

    active_bookings = (
        db.query(Booking)
        .filter(
            Booking.mentor_service_id == service.id,
            Booking.status == "confirmed",
        )
        .count()
    )
    if active_bookings > 0:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Cannot delete service with active bookings. Deactivate it instead.",
        )

    db.delete(service)
    db.commit()
    return None
