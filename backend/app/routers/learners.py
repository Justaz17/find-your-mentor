from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from app.db.database import get_db
from app.core.security import get_current_user
from app.models.user import User
from app.models.learner_profile import LearnerProfile, LearnerInterest
from app.models.skill import Skill
from app.models.category import Category
from app.schemas.learner_profile import (
    LearnerProfileCreate,
    LearnerProfileOut,
    LearnerInterestOut,
)

router = APIRouter(prefix="/learners", tags=["learners"])


def build_profile_out(profile: LearnerProfile, db: Session) -> dict:
    """Build the response dict including resolved names."""
    category_name = None
    if profile.preferred_category_id:
        cat = (
            db.query(Category)
            .filter(Category.id == profile.preferred_category_id)
            .first()
        )
        category_name = cat.name if cat else None

    interests = []
    for interest in profile.interests:
        skill = db.query(Skill).filter(Skill.id == interest.skill_id).first()
        interests.append(
            {
                "id": interest.id,
                "skill_id": interest.skill_id,
                "skill_name": skill.name if skill else "Unknown",
                "current_level": interest.current_level,
                "target_level": interest.target_level,
            }
        )

    return {
        "id": profile.id,
        "user_id": profile.user_id,
        "bio": profile.bio,
        "preferred_category_id": profile.preferred_category_id,
        "preferred_category_name": category_name,
        "preferred_languages": profile.preferred_languages,
        "preferred_session_format": profile.preferred_session_format,
        "min_price": profile.min_price,
        "max_price": profile.max_price,
        "experience_level": profile.experience_level,
        "location": profile.location,
        "goal_tags": profile.goal_tags,
        "goal_description": profile.goal_description,
        "availability_preference": profile.availability_preference,
        "interests": interests,
    }


@router.post(
    "/profile",
    response_model=LearnerProfileOut,
    status_code=status.HTTP_201_CREATED,
)
def create_or_update_profile(
    profile_data: LearnerProfileCreate,
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Create or update the learner profile for the current user.
    Interests are replaced wholesale on every update — same pattern
    as mentor skills.
    """
    existing = (
        db.query(LearnerProfile)
        .filter(LearnerProfile.user_id == current_user.id)
        .first()
    )

    if existing:
        # Update scalar fields
        existing.bio = profile_data.bio
        existing.preferred_category_id = profile_data.preferred_category_id
        existing.preferred_languages = profile_data.preferred_languages
        existing.preferred_session_format = profile_data.preferred_session_format
        existing.min_price = profile_data.min_price
        existing.max_price = profile_data.max_price
        existing.experience_level = profile_data.experience_level
        existing.location = profile_data.location
        existing.goal_tags = profile_data.goal_tags
        existing.goal_description = profile_data.goal_description
        existing.availability_preference = profile_data.availability_preference

        # Replace interests
        db.query(LearnerInterest).filter(
            LearnerInterest.learner_profile_id == existing.id
        ).delete()

        profile = existing
    else:
        profile = LearnerProfile(
            user_id=current_user.id,
            bio=profile_data.bio,
            preferred_category_id=profile_data.preferred_category_id,
            preferred_languages=profile_data.preferred_languages,
            preferred_session_format=profile_data.preferred_session_format,
            min_price=profile_data.min_price,
            max_price=profile_data.max_price,
            experience_level=profile_data.experience_level,
            location=profile_data.location,
            goal_tags=profile_data.goal_tags,
            goal_description=profile_data.goal_description,
            availability_preference=profile_data.availability_preference,
        )
        db.add(profile)
        db.flush()

    # Add new interests
    for interest_data in profile_data.interests:
        # Validate skill exists
        skill = db.query(Skill).filter(Skill.id == interest_data.skill_id).first()
        if not skill:
            raise HTTPException(
                status_code=status.HTTP_400_BAD_REQUEST,
                detail=f"Skill {interest_data.skill_id} not found",
            )
        db.add(
            LearnerInterest(
                learner_profile_id=profile.id,
                skill_id=interest_data.skill_id,
                current_level=interest_data.current_level,
                target_level=interest_data.target_level,
            )
        )

    db.commit()
    db.refresh(profile)
    return build_profile_out(profile, db)


@router.get("/profile/me", response_model=LearnerProfileOut)
def get_my_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Get the current user's learner profile.
    Returns 404 if no profile has been created yet.
    """
    profile = (
        db.query(LearnerProfile)
        .filter(LearnerProfile.user_id == current_user.id)
        .first()
    )
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Learner profile not found. Create one first.",
        )
    return build_profile_out(profile, db)


@router.delete("/profile/me", status_code=status.HTTP_204_NO_CONTENT)
def delete_my_profile(
    current_user: User = Depends(get_current_user),
    db: Session = Depends(get_db),
):
    """
    Delete the current user's learner profile and all interests.
    """
    profile = (
        db.query(LearnerProfile)
        .filter(LearnerProfile.user_id == current_user.id)
        .first()
    )
    if not profile:
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="No learner profile found.",
        )
    db.delete(profile)
    db.commit()
