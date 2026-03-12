from sqlalchemy import Column, Integer, ForeignKey, DateTime, Boolean, String, Float
from sqlalchemy.orm import relationship
from app.db.database import Base
from datetime import datetime, timezone


class LearnerStreak(Base):
    """
    Tracks learner engagement and freeze credits (penalty-free cancellations).

    The idea: if a learner consistently books sessions, they earn "freezes".
    A freeze = one free cancellation without penalty.

    Rules:
    - Every week a learner has ≥1 completed session → +1 freeze credit
    - When learner cancels, if they have freezes, use 1 freeze (no penalty)
    - If no freezes, cancellation policy applies
    - Freezes don't reset monthly, they accumulate
    - If learner goes 2 weeks without booking, they lose 1 pending freeze

    Duolingo-style: We notify them "You kept your streak! 🔥 +1 freeze earned"
    But keep it low-key, not aggressive.
    """

    __tablename__ = "learner_streaks"

    id = Column(Integer, primary_key=True, index=True)
    learner_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)

    # How many penalty-free cancellations do they have?
    freeze_credits = Column(Integer, default=1)

    # Was this learner active in the current week? (booked at least once)
    current_week_active = Column(Boolean, default=False)

    # When was their last completed session?
    last_session_date = Column(DateTime(timezone=True), nullable=True)

    # How many sessions this calendar month?
    total_sessions_month = Column(Integer, default=0)

    # Which skill does this learner book most?
    # E.g., "Python", "FastAPI", "Business Consulting"
    most_active_skill = Column(String(100), nullable=True)

    # Which day of week do they prefer? MONDAY, TUESDAY, etc.
    most_active_day = Column(String(10), nullable=True)

    # When did they start learning?
    streak_started_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    def __repr__(self):
        return f"<LearnerStreak user {self.learner_id}: {self.freeze_credits} freezes, {self.total_sessions_month} this month>"


class MentorStats(Base):
    """
    Analytics for mentors to help them understand their teaching performance
    and make decisions about availability.

    Can be queried per skill (if mentor teaches multiple skills):
    - "Python: 12 learners this month"
    - "FastAPI: 5 learners this month"

    Premium feature: Show mentor which times are busiest so they can
    schedule slots around peak demand.
    E.g., "8 learners want Python sessions on Saturdays → add Saturday 10am-2pm"
    """

    __tablename__ = "mentor_stats"

    id = Column(Integer, primary_key=True, index=True)
    mentor_profile_id = Column(
        Integer, ForeignKey("mentor_profiles.id"), nullable=False
    )

    # Which skill does this stat line cover? (optional, can be NULL for all skills)
    skill_id = Column(Integer, ForeignKey("skills.id"), nullable=True)

    # How many sessions has this mentor completed?
    total_sessions_completed = Column(Integer, default=0)

    # What's their cancellation rate? 0.15 = 15%
    # Used to filter out unreliable mentors
    cancellation_rate = Column(Float, default=0.0)

    # Average rating from learner reviews (1.0 - 5.0)
    average_rating = Column(Float, nullable=True)

    # How many unique learners this month?
    learners_this_month = Column(Integer, default=0)

    # Most requested skill by learners (for this mentor's profile)
    # E.g., if mentor teaches Python, FastAPI, and AWS,
    # this shows which one learners request most
    most_active_learner_skill = Column(String(100), nullable=True)

    # Which day of week gets the most bookings?
    busiest_day = Column(String(10), nullable=True)  # MONDAY, TUESDAY, etc.

    # Which hours are busiest? Stored as string for flexibility
    # E.g., "9-11, 14-16" or JSON if needed
    peak_hours = Column(String(100), nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
        onupdate=lambda: datetime.now(timezone.utc),
    )

    def __repr__(self):
        return f"<MentorStats mentor {self.mentor_profile_id}: {self.total_sessions_completed} sessions, {self.average_rating}/5.0>"
