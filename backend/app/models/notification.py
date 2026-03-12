from sqlalchemy import Column, Integer, String, Text, ForeignKey, DateTime, Boolean
from sqlalchemy.orm import relationship
from app.db.database import Base
from datetime import datetime, timezone


class PushToken(Base):
    """
    Stores device tokens for Expo push notifications.

    When a user opens the app on their phone, we register their device with Expo.
    This token lets us send push notifications to their specific device.

    Users can have multiple devices (phone + tablet).
    """

    __tablename__ = "push_tokens"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # ANDROID or IOS
    platform = Column(String(10), nullable=False)

    # The actual token from Expo (e.g., "ExponentPushToken[xyz123...]")
    expo_push_token = Column(String(255), nullable=False)

    # Can be disabled if user opts out or token becomes invalid
    is_active = Column(Boolean, default=True)

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
        return f"<PushToken user {self.user_id} {self.platform}>"


class Notification(Base):
    """
    Every notification sent to a user, whether in-app or push notification.

    This is an audit trail: when was it sent? Was it delivered? Did user read it?

    Notifications can be:
    - SESSION_REMINDER: "Your session with [Mentor] in 24 hours"
    - CANCELLATION_ALERT: "Your booking was cancelled by [other party]"
    - RESCHEDULE_REQUEST: "Reschedule request from [other party] - pick new time"
    - FREE_SESSION_CREDIT: "You earned a free 20-min session!"
    - POLICY_WARNING: "Heads up: if you cancel now, you'll lose your freeze credit"

    Delivered via:
    - IN_APP: Badge in NotificationCenter screen
    - PUSH_NOTIFICATION: Phone push notification
    - BOTH: Send both
    """

    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)

    # Is this for a MENTOR or LEARNER? (for analytics)
    user_type = Column(String(10), nullable=False)

    # Type of notification
    notification_type = Column(String(30), nullable=False)
    # SESSION_REMINDER, CANCELLATION_ALERT, RESCHEDULE_REQUEST,
    # FREE_SESSION_CREDIT, POLICY_WARNING

    # Foreign keys to related objects (optional)
    booking_id = Column(Integer, ForeignKey("bookings.id"), nullable=True)
    reschedule_request_id = Column(
        Integer, ForeignKey("reschedule_requests.id"), nullable=True
    )

    # Notification content
    title = Column(String(200), nullable=False)
    # E.g., "Session Reminder" or "Cancellation Alert"

    body = Column(Text, nullable=False)
    # E.g., "Your session with John in 24 hours. Meeting link: zoom.us/..."

    # Deep link: when user taps notification, take them to this screen
    # E.g., "/bookings/123" or "/reschedule-requests/456"
    action_url = Column(String(255), nullable=True)

    # How to deliver this notification
    delivery_method = Column(String(20), default="BOTH", nullable=False)
    # IN_APP, PUSH_NOTIFICATION, or BOTH

    # When should this notification be sent?
    # (Useful for scheduling reminders 24h before session)
    scheduled_for = Column(DateTime(timezone=True), nullable=False)

    # When was it actually sent?
    sent_at = Column(DateTime(timezone=True), nullable=True)

    # When did user read it? (for in-app notifications)
    read_at = Column(DateTime(timezone=True), nullable=True)

    created_at = Column(
        DateTime(timezone=True),
        default=lambda: datetime.now(timezone.utc),
    )

    # Relationships
    booking = relationship("Booking", foreign_keys=[booking_id], viewonly=True)
    reschedule_request = relationship(
        "RescheduleRequest", foreign_keys=[reschedule_request_id], viewonly=True
    )

    def __repr__(self):
        status = "read" if self.read_at else ("sent" if self.sent_at else "pending")
        return f"<Notification {self.notification_type} user {self.user_id}: {status}>"
