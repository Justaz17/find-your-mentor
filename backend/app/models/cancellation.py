from sqlalchemy import Column, Integer, String, Float, ForeignKey, DateTime, Text
from sqlalchemy.orm import relationship
from app.db.database import Base
from datetime import datetime, timezone


class CancellationReason(Base):
    """
    Pre-defined cancellation reasons for analytics and UX.
    Instead of forcing users to type, they select from this list or "Other".

    This allows us to analyze which reasons are most common and optimize.
    """

    __tablename__ = "cancellation_reasons"

    id = Column(Integer, primary_key=True, index=True)
    reason_text = Column(String(100), unique=True, nullable=False)
    # Examples: "Personal emergency", "Schedule conflict", "Health/Illness",
    # "Technical issues", "Other"

    def __repr__(self):
        return f"<CancellationReason {self.reason_text}>"


class CancellationPolicy(Base):
    """
    Defines what happens when someone cancels.
    E.g., "If learner cancels < 24 hours before, they get FREE 20 min session"

    This is NOT specific to a booking; it's a global rule.
    We apply the matching policy when a cancellation occurs.
    """

    __tablename__ = "cancellation_policies"

    id = Column(Integer, primary_key=True, index=True)

    # Is this policy for LEARNER or MENTOR?
    affected_party = Column(String(10), nullable=False)  # "LEARNER" or "MENTOR"

    # How many days before the session is the cutoff?
    # E.g., 1 = 24 hours, 2 = 48 hours
    days_before_session = Column(Integer, nullable=False)

    # What's the consequence?
    consequence_type = Column(String(30), nullable=False)
    # "FREE_SESSION" = get free session credit
    # "DISCOUNT" = get discount on next booking
    # "NOTHING" = no penalty

    # Value depends on consequence_type:
    # If DISCOUNT: 0.20 = 20% discount
    # If FREE_SESSION: session duration in minutes (e.g., 20)
    consequence_value = Column(Float, nullable=False)

    def __repr__(self):
        return f"<CancellationPolicy {self.affected_party} {self.days_before_session}d: {self.consequence_type}>"


class Cancellation(Base):
    """
    Records WHEN someone cancelled, WHY, and WHAT CONSEQUENCE was applied.
    This is the audit trail for each cancellation.
    """

    __tablename__ = "cancellations"

    id = Column(Integer, primary_key=True, index=True)
    booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=False, unique=True)

    # Who cancelled?
    cancelled_by = Column(String(10), nullable=False)  # "LEARNER" or "MENTOR"

    # Why did they cancel? (optional - user can select "I prefer not to say")
    reason_id = Column(Integer, ForeignKey("cancellation_reasons.id"), nullable=True)

    # If they selected "Other", they can type a reason here
    reason_text = Column(Text, nullable=True)

    # Which policy was applied for this cancellation?
    policy_applied_id = Column(
        Integer, ForeignKey("cancellation_policies.id"), nullable=True
    )

    # What consequence was issued?
    consequence_issued = Column(String(30), nullable=False)
    # "FREE_SESSION_CREDIT", "DISCOUNT_VOUCHER", "NONE"

    # How much was the consequence worth?
    consequence_value = Column(Float, nullable=False)

    cancelled_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(),
    )

    # Relationships
    booking = relationship("Booking", back_populates="cancellation")
    reason = relationship("CancellationReason")
    policy = relationship("CancellationPolicy")

    def __repr__(self):
        return f"<Cancellation {self.cancelled_by} on booking {self.booking_id}, consequence: {self.consequence_issued}>"


class CancellationStreak(Base):
    """
    Tracks how many times someone has cancelled in a row.

    Purpose: Identify repeat cancellers and temporarily freeze them if needed.
    E.g., if learner cancels 3x in a month, freeze them for 7 days.

    Behavior:
    - Learner cancels without freeze credit → streak_count++
    - If streak_count >= 3 -> freeze_until = now + 7 days
    - During freeze, learner can't create new bookings
    - Once freeze expires, streak resets
    """

    __tablename__ = "cancellation_streaks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False, unique=True)

    # Is this user a LEARNER or MENTOR?
    user_type = Column(String(10), nullable=False)  # "LEARNER" or "MENTOR"

    # How many cancellations in a row?
    streak_count = Column(Integer, default=0)

    # When did they last cancel?
    last_cancellation_at = Column(DateTime(timezone=True), nullable=True)

    # If they've cancelled too much, they're frozen until this date
    freeze_until = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(),
    )
    updated_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(),
        onupdate=lambda: datetime.now(),
    )

    def __repr__(self):
        status = "frozen" if self.freeze_until else "active"
        return f"<CancellationStreak {self.user_type} user {self.user_id}: {self.streak_count} cancellations ({status})>"
