from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from sqlalchemy import func
from typing import List, Optional

from app.schemas.mentor_profile import (
    MentorProfileCreate,
    MentorProfileOut,
    MentorProfileWithSkills,
    MentorSearchResult,
    CategoryOut,
    SkillOut,
)
from app.schemas.user import UserOut
from app.models.user import User
from app.models.mentor_profile import MentorProfile
from app.models.learner_profile import LearnerProfile, LearnerInterest
from app.models.skill import Skill, MentorSkill
from app.models.category import Category
from app.models.review import Review
from app.models.availability_slot import AvailabilitySlot
from app.models.booking import Booking
from app.core.security import get_current_user, get_optional_user
from app.db.database import get_db
from app.services.smart_sort import smart_sort

import random as random_module
from datetime import datetime, timezone

router = APIRouter(prefix="/mentors", tags=["mentors"])


# ── Helper: build mentor dict for scoring/response ────────────────────────


def build_mentor_dict(mentor: MentorProfile, db: Session) -> dict:
    """
    Build a flat dict from a MentorProfile ORM object.
    Used by both list and search endpoints to avoid repeating logic.
    """
    rating_data = (
        db.query(
            func.avg(Review.rating).label("avg"),
            func.count(Review.id).label("count"),
        )
        .filter(Review.mentor_profile_id == mentor.id)
        .first()
    )

    # Count available (future) slots
    now = datetime.now(timezone.utc)
    available_slots = (
        db.query(AvailabilitySlot)
        .filter(
            AvailabilitySlot.mentor_profile_id == mentor.id,
            AvailabilitySlot.status == "available",
            AvailabilitySlot.start_time > now,
        )
        .all()
    )

    # Derive availability windows from actual slots
    # Maps slots to time window labels for smart sort availability matching
    availability_windows = set()
    for slot in available_slots:
        local_hour = slot.start_time.hour
        weekday = slot.start_time.weekday()  # 0=Mon, 6=Sun
        is_weekend = weekday >= 5

        if local_hour < 12:
            time_part = "mornings"
        elif local_hour < 17:
            time_part = "afternoons"
        else:
            time_part = "evenings"

        day_part = "weekend" if is_weekend else "weekday"
        availability_windows.add(f"{day_part}_{time_part}")

    # Collect category IDs from skills
    category_ids = list(
        {
            ms.skill.category_id
            for ms in mentor.skills
            if ms.skill and ms.skill.category_id
        }
    )

    return {
        "id": mentor.id,
        "user_id": mentor.user_id,
        "bio": mentor.bio,
        "hourly_rate": mentor.hourly_rate,
        "is_visible": mentor.is_visible,
        "years_experience": mentor.years_experience,
        "languages": mentor.languages,
        "session_format": mentor.session_format,
        "location": mentor.location,
        "tags": mentor.tags,
        "user_name": mentor.user.name,
        "skills": [{"id": ms.skill.id, "name": ms.skill.name} for ms in mentor.skills],
        "skill_ids": [ms.skill_id for ms in mentor.skills],
        "skill_names": [ms.skill.name for ms in mentor.skills],
        "category_ids": category_ids,
        "availability_windows": list(availability_windows),
        "available_slot_count": len(available_slots),
        "average_rating": round(float(rating_data.avg), 1) if rating_data.avg else None,
        "total_reviews": rating_data.count or 0,
        "relevance_score": None,
        "match_reasons": [],
    }


def build_learner_dict(learner_profile: LearnerProfile, db: Session) -> dict:
    """
    Build a flat dict from a LearnerProfile for use in smart sort scoring.
    """
    interests = (
        db.query(LearnerInterest)
        .filter(LearnerInterest.learner_profile_id == learner_profile.id)
        .all()
    )

    interest_skill_ids = [i.skill_id for i in interests]
    interest_skill_names = [i.skill.name for i in interests if i.skill]

    # Get categories from past bookings for booking history signal
    booked_category_ids = []
    past_bookings = (
        db.query(Booking)
        .filter(
            Booking.learner_id == learner_profile.user_id, Booking.status == "completed"
        )
        .all()
    )
    for booking in past_bookings:
        mentor = (
            db.query(MentorProfile)
            .filter(MentorProfile.id == booking.mentor_profile_id)
            .first()
        )
        if mentor:
            for ms in mentor.skills:
                if ms.skill and ms.skill.category_id:
                    booked_category_ids.append(ms.skill.category_id)

    return {
        "preferred_category_id": learner_profile.preferred_category_id,
        "preferred_languages": learner_profile.preferred_languages,
        "preferred_session_format": learner_profile.preferred_session_format,
        "min_price": learner_profile.min_price,
        "max_price": learner_profile.max_price,
        "experience_level": learner_profile.experience_level,
        "goal_tags": learner_profile.goal_tags,
        "availability_preference": learner_profile.availability_preference,
        "interest_skill_ids": interest_skill_ids,
        "interest_skill_names": interest_skill_names,
        "booked_category_ids": list(set(booked_category_ids)),
    }


# ── PROTECTED ENDPOINTS ───────────────────────────────────────────────────


@router.get("/me", response_model=UserOut)
def get_my_profile(current_user: User = Depends(get_current_user)):
    return current_user


@router.get("/me/mentor-profile", response_model=MentorProfileOut)
def get_my_mentor_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get the current user's mentor profile.
    Returns 404 if they haven't created one yet.
    """
    mentor = (
        db.query(MentorProfile).filter(MentorProfile.user_id == current_user.id).first()
    )
    if not mentor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Mentor profile not found",
        )
    return mentor


@router.post(
    "/me/profile", response_model=MentorProfileOut, status_code=status.HTTP_201_CREATED
)
def create_or_update_profile(
    profile_data: MentorProfileCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    existing_profile = (
        db.query(MentorProfile).filter(MentorProfile.user_id == current_user.id).first()
    )

    if existing_profile:
        existing_profile.bio = profile_data.bio
        existing_profile.hourly_rate = profile_data.hourly_rate
        existing_profile.is_visible = profile_data.is_visible
        existing_profile.years_experience = profile_data.years_experience
        existing_profile.languages = profile_data.languages
        existing_profile.session_format = profile_data.session_format
        existing_profile.location = profile_data.location
        existing_profile.tags = profile_data.tags

        db.query(MentorSkill).filter(
            MentorSkill.mentor_profile_id == existing_profile.id
        ).delete()
        mentor_profile = existing_profile
    else:
        mentor_profile = MentorProfile(
            user_id=current_user.id,
            bio=profile_data.bio,
            hourly_rate=profile_data.hourly_rate,
            is_visible=profile_data.is_visible,
            years_experience=profile_data.years_experience,
            languages=profile_data.languages,
            session_format=profile_data.session_format,
            location=profile_data.location,
            tags=profile_data.tags,
        )
        db.add(mentor_profile)
        db.flush()

        # Promote user role
        if current_user.role == "learner":
            current_user.role = "both"
        elif current_user.role != "mentor" and current_user.role != "both":
            current_user.role = "mentor"

    for skill_name in profile_data.skills:
        skill = db.query(Skill).filter(Skill.name == skill_name).first()
        if not skill:
            skill = Skill(name=skill_name)
            db.add(skill)
            db.flush()
        db.add(MentorSkill(mentor_profile_id=mentor_profile.id, skill_id=skill.id))

    db.commit()
    db.refresh(mentor_profile)
    return mentor_profile


# ── PUBLIC ENDPOINTS ──────────────────────────────────────────────────────


@router.get("/search", response_model=List[MentorSearchResult])
def search_mentors(
    # Layer 1: hard filters
    category_id: Optional[int] = Query(None, description="Filter by category ID"),
    skill: Optional[str] = Query(
        None, description="Filter by skill name (partial match)"
    ),
    language: Optional[str] = Query(None, description="Filter by language"),
    min_price: Optional[float] = Query(None, description="Minimum hourly rate"),
    max_price: Optional[float] = Query(None, description="Maximum hourly rate"),
    session_format: Optional[str] = Query(
        None, description="online | in_person | both"
    ),
    # Pagination
    limit: int = Query(20, le=50),
    offset: int = Query(0),
    # Optional auth for smart sort
    db: Session = Depends(get_db),
    current_user: Optional[User] = Depends(get_optional_user),
):
    """
    Search mentors with hard filters (Layer 1) and smart sort (Layer 2).

    If the authenticated user has a learner profile, results are sorted
    by relevance score with match reasons. Otherwise sorted by rating.
    """
    query = db.query(MentorProfile).filter(MentorProfile.is_visible == True)

    # Hard filter: category
    if category_id:
        query = (
            query.join(MentorSkill, MentorSkill.mentor_profile_id == MentorProfile.id)
            .join(Skill, Skill.id == MentorSkill.skill_id)
            .filter(Skill.category_id == category_id)
            .distinct()
        )

    # Hard filter: skill name (partial, case-insensitive)
    if skill:
        if not category_id:  # avoid double join
            query = (
                query.join(
                    MentorSkill, MentorSkill.mentor_profile_id == MentorProfile.id
                )
                .join(Skill, Skill.id == MentorSkill.skill_id)
                .distinct()
            )
        query = query.filter(Skill.name.ilike(f"%{skill}%"))

    # Hard filter: price range
    if min_price is not None:
        query = query.filter(MentorProfile.hourly_rate >= min_price)
    if max_price is not None:
        query = query.filter(MentorProfile.hourly_rate <= max_price)

    # Hard filter: session format
    if session_format:
        query = query.filter(
            (MentorProfile.session_format == session_format)
            | (MentorProfile.session_format == "both")
        )

    # Hard filter: language (case-insensitive contains)
    if language:
        query = query.filter(MentorProfile.languages.ilike(f"%{language}%"))

    mentors = query.all()

    # Build mentor dicts
    mentor_dicts = [build_mentor_dict(m, db) for m in mentors]

    # Layer 2: smart sort
    learner_dict = None
    if current_user:
        learner_profile = (
            db.query(LearnerProfile)
            .filter(LearnerProfile.user_id == current_user.id)
            .first()
        )
        if learner_profile:
            learner_dict = build_learner_dict(learner_profile, db)

    sorted_mentors = smart_sort(mentor_dicts, learner_dict)

    # Paginate after sorting (sort must happen on full list)
    return sorted_mentors[offset : offset + limit]


@router.get("/random", response_model=MentorSearchResult)
def random_mentor(db: Session = Depends(get_db)):
    """
    Returns a single random visible mentor with at least one available slot.
    Powers the dice button.
    """
    now = datetime.now(timezone.utc)
    mentor_ids = (
        db.query(MentorProfile.id)
        .join(AvailabilitySlot, AvailabilitySlot.mentor_profile_id == MentorProfile.id)
        .filter(
            MentorProfile.is_visible == True,
            AvailabilitySlot.status == "available",
            AvailabilitySlot.start_time > now,
        )
        .distinct()
        .all()
    )

    if not mentor_ids:
        # Fall back to any visible mentor if no slots available
        mentor_ids = (
            db.query(MentorProfile.id).filter(MentorProfile.is_visible == True).all()
        )

    if not mentor_ids:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="No mentors available"
        )

    chosen_id = random_module.choice(mentor_ids)[0]
    mentor = db.query(MentorProfile).filter(MentorProfile.id == chosen_id).first()
    result = build_mentor_dict(mentor, db)
    return result


@router.get("/categories", response_model=List[CategoryOut])
def list_categories(db: Session = Depends(get_db)):
    """
    Returns all categories with their skills.
    Used to populate filter UI on the search screen.
    """
    categories = db.query(Category).all()
    return categories


@router.get("", response_model=List[MentorProfileWithSkills])
def list_mentors(
    skill: Optional[str] = Query(None, description="Filter by skill name"),
    db: Session = Depends(get_db),
):
    """
    Original list endpoint — kept for backwards compatibility.
    Prefer /mentors/search for new frontend work.
    """
    query = db.query(MentorProfile).filter(MentorProfile.is_visible == True)

    if skill:
        query = query.join(MentorSkill).join(Skill).filter(Skill.name == skill)

    mentors = query.all()
    return [build_mentor_dict(m, db) for m in mentors]


@router.get("/{mentor_id}", response_model=MentorSearchResult)
def get_mentor(mentor_id: int, db: Session = Depends(get_db)):
    mentor = (
        db.query(MentorProfile)
        .filter(MentorProfile.id == mentor_id, MentorProfile.is_visible == True)
        .first()
    )

    if not mentor:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND, detail="Mentor not found"
        )

    return build_mentor_dict(mentor, db)
