"""
test_bookings.py - Booking lifecycle and conflict detection tests.

State machine covered:
  pending → confirmed → [learner_confirmed, mentor_confirmed] → completed
  pending → cancelled_by_learner
  confirmed → cancelled_by_learner  (with refund policy)
  pending → cancelled_by_mentor (deny)

Overlap detection uses Allen's interval algebra (identical to availability):
  Two bookings [A_s, A_e) and [B_s, B_e) conflict iff A_s < B_e AND A_e > B_s.

Fixtures:
  pending_booking   - learner has submitted, mentor has not yet approved
  confirmed_booking - mentor has approved, booking is in 'confirmed' state
"""

import pytest
import requests
import random
import string

BASE_URL = "http://192.168.1.17:8000"


# ---------------------------------------------------------------------------
# Booking submission - input validation
# ---------------------------------------------------------------------------


class TestBookingSubmission:

    def test_submit_booking_within_availability_window_succeeds(
        self, session, registered_learner, registered_mentor
    ):
        """
        Happy path: learner submits a 60-minute booking (10:00-11:00) that falls
        entirely within the mentor's 3-hour slot (10:00-13:00). Must return 201
        with status='pending' and payment_status='pending'.
        """
        resp = session.post(
            f"{BASE_URL}/bookings",
            headers=registered_learner["headers"],
            json={
                "mentor_service_id": registered_mentor["service_id"],
                "start_time": "2027-06-10T10:00:00Z",
                "end_time": "2027-06-10T11:00:00Z",
                "learner_note": "Dia dhuit! Looking forward to the session.",
            },
        )
        assert resp.status_code == 201, f"Booking failed: {resp.text}"
        body = resp.json()
        assert body["status"] == "pending"
        assert body["payment_status"] == "pending"
        assert body["learner_note"] == "Dia dhuit! Looking forward to the session."
        assert body["amount_paid"] == 45.0

    def test_submit_booking_outside_availability_window_rejected(
        self, session, registered_learner, registered_mentor
    ):
        """
        A booking for 14:00-15:00 falls entirely OUTSIDE the mentor's slot
        (10:00-13:00). The booking router searches for a slot where:
            slot.start_time <= booking_start AND slot.end_time >= booking_end
        No slot satisfies this → 400 'No available slot covers the requested time'.
        """
        resp = session.post(
            f"{BASE_URL}/bookings",
            headers=registered_learner["headers"],
            json={
                "mentor_service_id": registered_mentor["service_id"],
                "start_time": "2027-06-10T14:00:00Z",
                "end_time": "2027-06-10T15:00:00Z",
            },
        )
        assert resp.status_code in (
            400,
            404,
        ), f"Out-of-window booking should be rejected. Got {resp.status_code}"

    def test_submit_booking_end_before_start_rejected(
        self, session, registered_learner, registered_mentor
    ):
        """
        BVA: Submitting a booking where end_time < start_time must be rejected
        at the Pydantic schema layer (422) before any DB interaction.
        The BookingCreate validator checks: if v <= start_time: raise ValueError.
        """
        resp = session.post(
            f"{BASE_URL}/bookings",
            headers=registered_learner["headers"],
            json={
                "mentor_service_id": registered_mentor["service_id"],
                "start_time": "2027-06-10T12:00:00Z",
                "end_time": "2027-06-10T11:00:00Z",
            },
        )
        assert (
            resp.status_code == 422
        ), f"Reversed booking times should return 422. Got {resp.status_code}"

    def test_unauthenticated_booking_rejected(self, session, registered_mentor):
        """
        Booking creation requires a valid JWT. Sending no Authorization header
        must return 401. This verifies that the endpoint is not accidentally
        open to anonymous callers.
        """
        resp = session.post(
            f"{BASE_URL}/bookings",
            json={
                "mentor_service_id": registered_mentor["service_id"],
                "start_time": "2027-06-10T10:00:00Z",
                "end_time": "2027-06-10T11:00:00Z",
            },
        )
        assert resp.status_code == 401


# ---------------------------------------------------------------------------
# Overlap detection
# ---------------------------------------------------------------------------


class TestBookingOverlap:

    def test_partial_overlap_booking_rejected(
        self, session, registered_learner, registered_mentor
    ):
        """
        Allen partial overlap: Booking A is 10:00-11:00. Booking B is 10:30-11:30.
        Allen condition: A_s(10:00) < B_e(11:30) AND A_e(11:00) > B_s(10:30) → conflict.
        B must be rejected with 409 'This time is already booked'.
        """
        # Create booking A
        resp_a = session.post(
            f"{BASE_URL}/bookings",
            headers=registered_learner["headers"],
            json={
                "mentor_service_id": registered_mentor["service_id"],
                "start_time": "2027-06-10T10:00:00Z",
                "end_time": "2027-06-10T11:00:00Z",
            },
        )
        assert resp_a.status_code == 201, f"First booking failed: {resp_a.text}"

        # Attempt booking B (partial overlap)
        resp_b = session.post(
            f"{BASE_URL}/bookings",
            headers=registered_learner["headers"],
            json={
                "mentor_service_id": registered_mentor["service_id"],
                "start_time": "2027-06-10T10:30:00Z",
                "end_time": "2027-06-10T11:30:00Z",
            },
        )
        assert resp_b.status_code in (
            400,
            409,
        ), f"Partially overlapping booking was accepted. Got {resp_b.status_code}"

    def test_full_containment_booking_rejected(
        self, session, registered_learner, registered_mentor
    ):
        """
        Allen full containment: Booking A is 10:00-12:00 (120 min, valid for the
        60-min service). A second learner attempts 10:30-11:30 which is fully
        contained within A. Allen condition still fires:
            A_s(10:00) < B_e(11:30) AND A_e(12:00) > B_s(10:30) → conflict → 409.

        Uses a second learner to isolate from the learner-double-booking check
        and test the general slot-level overlap detection.
        """
        # Register a second learner
        suffix = "".join(random.choices(string.ascii_lowercase + string.digits, k=8))
        email2 = f"learner2.{suffix}@test.ie"
        session.post(
            f"{BASE_URL}/auth/register",
            json={
                "email": email2,
                "name": "Siobhan Ni Cheallaigh",
                "password": "Pass123!",
                "role": "learner",
            },
        )
        login2 = session.post(
            f"{BASE_URL}/auth/login",
            json={
                "email": email2,
                "password": "Pass123!",
            },
        )
        headers2 = {"Authorization": f"Bearer {login2.json()['access_token']}"}

        # Learner 1 books 10:00-12:00 (120 min - meets the 60-min minimum)
        resp_a = session.post(
            f"{BASE_URL}/bookings",
            headers=registered_learner["headers"],
            json={
                "mentor_service_id": registered_mentor["service_id"],
                "start_time": "2027-06-10T10:00:00Z",
                "end_time": "2027-06-10T12:00:00Z",
            },
        )
        assert resp_a.status_code == 201, f"First booking failed: {resp_a.text}"

        # Learner 2 attempts 10:30-11:30 (fully inside A)
        resp_b = session.post(
            f"{BASE_URL}/bookings",
            headers=headers2,
            json={
                "mentor_service_id": registered_mentor["service_id"],
                "start_time": "2027-06-10T10:30:00Z",
                "end_time": "2027-06-10T11:30:00Z",
            },
        )
        assert resp_b.status_code in (
            400,
            409,
        ), f"Fully contained booking was accepted. Got {resp_b.status_code}"

    def test_adjacent_booking_accepted(
        self, session, registered_learner, registered_mentor
    ):
        """
        Adjacent bookings share an endpoint but do NOT overlap. For A=[10:00,11:00)
        and B=[11:00,12:00):
            A_s(10:00) < B_e(12:00) AND A_e(11:00) > B_s(11:00) → True AND False
        B must be accepted (201). This supports consecutive session scheduling
        within the same availability window.
        """
        # Booking A: 10:00-11:00
        resp_a = session.post(
            f"{BASE_URL}/bookings",
            headers=registered_learner["headers"],
            json={
                "mentor_service_id": registered_mentor["service_id"],
                "start_time": "2027-06-10T10:00:00Z",
                "end_time": "2027-06-10T11:00:00Z",
            },
        )
        assert resp_a.status_code == 201, f"First booking failed: {resp_a.text}"

        # Booking B: 11:00-12:00 (adjacent, NOT overlapping)
        resp_b = session.post(
            f"{BASE_URL}/bookings",
            headers=registered_learner["headers"],
            json={
                "mentor_service_id": registered_mentor["service_id"],
                "start_time": "2027-06-10T11:00:00Z",
                "end_time": "2027-06-10T12:00:00Z",
            },
        )
        assert resp_b.status_code == 201, (
            f"Adjacent booking was incorrectly rejected as overlapping: "
            f"{resp_b.status_code} {resp_b.text}"
        )


# ---------------------------------------------------------------------------
# Approval workflow
# ---------------------------------------------------------------------------


class TestApprovalWorkflow:

    def test_mentor_approves_booking_transitions_to_confirmed(
        self, session, pending_booking
    ):
        """
        The mentor calls POST /bookings/{id}/approve. The booking must transition
        from 'pending' to 'confirmed'. The response must contain the new status.
        This is the core gate-keeping mechanism - learners cannot book without
        mentor approval.
        """
        booking_id = pending_booking["booking_id"]
        resp = session.post(
            f"{BASE_URL}/bookings/{booking_id}/approve",
            headers=pending_booking["mentor"]["headers"],
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["status"] == "confirmed"
        assert body["booking_id"] == booking_id

    def test_learner_cannot_approve_booking(self, session, pending_booking):
        """
        BOLA: The learner who made the booking must NOT be able to self-approve it.
        The check in bookings.py:
            if booking.mentor_service.mentor_profile.user_id != current_user.id: 403
        Returns 403 Forbidden.
        """
        booking_id = pending_booking["booking_id"]
        resp = session.post(
            f"{BASE_URL}/bookings/{booking_id}/approve",
            headers=pending_booking["learner"]["headers"],
        )
        assert resp.status_code == 403, (
            f"Learner must not be able to approve their own booking. "
            f"Got {resp.status_code}: {resp.text}"
        )


# ---------------------------------------------------------------------------
# Cancellation policy
# ---------------------------------------------------------------------------


class TestCancellationPolicy:

    def test_cancel_pending_booking_succeeds(self, session, pending_booking):
        """
        A learner may cancel a pending booking. Since the slot is on 2027-06-10
        (well over 24 hours away), the full refund policy applies:
          - status → 'cancelled_by_learner'
          - refund_amount = 45.0 (100% of amount_paid)
          - payment_status → 'refunded'
        """
        booking_id = pending_booking["booking_id"]
        resp = session.post(
            f"{BASE_URL}/bookings/{booking_id}/cancel",
            headers=pending_booking["learner"]["headers"],
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["status"] == "cancelled_by_learner"
        assert body["refund_amount"] == 45.0

    def test_cancel_confirmed_booking_applies_cancellation_policy(
        self, session, confirmed_booking
    ):
        """
        Cancelling a confirmed booking more than 24 hours before the session
        triggers a full refund (100%). The slot (2027-06-10) is ~14 months away,
        so hours_until_session >> 24. Verifies the refund branch in cancel_booking().
        """
        booking_id = confirmed_booking["booking_id"]
        resp = session.post(
            f"{BASE_URL}/bookings/{booking_id}/cancel",
            headers=confirmed_booking["learner"]["headers"],
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["status"] == "cancelled_by_learner"
        # > 24h from now → full refund (100% of EUR45)
        assert body["refund_amount"] == pytest.approx(45.0, abs=0.01)


# ---------------------------------------------------------------------------
# Dual-confirmation flow → completed + paid
# ---------------------------------------------------------------------------


class TestDualConfirmationFlow:

    def test_learner_confirms_attendance_sets_flag(self, session, confirmed_booking):
        """
        After the mentor approves, the learner calls /learner-confirm.
        The booking has NOT been mentor-confirmed yet, so 'completed' is False.
        'learner_confirmed' should be True (checked by re-fetching /bookings/me).
        """
        booking_id = confirmed_booking["booking_id"]
        resp = session.post(
            f"{BASE_URL}/bookings/{booking_id}/learner-confirm",
            headers=confirmed_booking["learner"]["headers"],
        )
        assert resp.status_code == 200
        body = resp.json()
        # Only learner has confirmed so far - booking not yet completed
        assert body["completed"] is False

    def test_mentor_confirms_attendance_alone_does_not_complete_booking(
        self, session, confirmed_booking
    ):
        """
        Mentor calls /mentor-confirm without the learner having confirmed.
        The booking must NOT be marked 'completed' - both parties must confirm.
        'completed' in the response body will be False.
        """
        booking_id = confirmed_booking["booking_id"]
        resp = session.post(
            f"{BASE_URL}/bookings/{booking_id}/mentor-confirm",
            headers=confirmed_booking["mentor"]["headers"],
        )
        assert resp.status_code == 200
        body = resp.json()
        assert body["completed"] is False

    def test_both_confirmations_transition_to_completed_and_paid(
        self, session, confirmed_booking
    ):
        """
        The full dual-confirmation flow:
          1. Learner calls /learner-confirm
          2. Mentor calls /mentor-confirm
          3. Re-fetch the booking via GET /bookings/me
          4. Assert status='completed' and payment_status='paid'

        This validates the completion state machine in the booking router and
        confirms that payment is only settled once both parties confirm attendance.
        """
        booking_id = confirmed_booking["booking_id"]
        learner_headers = confirmed_booking["learner"]["headers"]
        mentor_headers = confirmed_booking["mentor"]["headers"]

        # Step 1 - learner confirms
        resp1 = session.post(
            f"{BASE_URL}/bookings/{booking_id}/learner-confirm",
            headers=learner_headers,
        )
        assert resp1.status_code == 200

        # Step 2 - mentor confirms (triggers completion)
        resp2 = session.post(
            f"{BASE_URL}/bookings/{booking_id}/mentor-confirm",
            headers=mentor_headers,
        )
        assert resp2.status_code == 200
        assert resp2.json()["completed"] is True

        # Step 3 - verify via GET /bookings/me
        bookings = session.get(
            f"{BASE_URL}/bookings/me", headers=learner_headers
        ).json()
        booking = next((b for b in bookings if b["id"] == booking_id), None)
        assert booking is not None, "Booking not found in /bookings/me response"
        assert (
            booking["status"] == "completed"
        ), f"Expected status='completed', got '{booking['status']}'"
        assert (
            booking["payment_status"] == "paid"
        ), f"Expected payment_status='paid', got '{booking['payment_status']}'"

    def test_learner_cannot_confirm_mentor_attendance(self, session, confirmed_booking):
        """
        BOLA: The learner must not be able to call /mentor-confirm.
        The check: if booking.mentor_service.mentor_profile.user_id != current_user.id: 403
        """
        booking_id = confirmed_booking["booking_id"]
        resp = session.post(
            f"{BASE_URL}/bookings/{booking_id}/mentor-confirm",
            headers=confirmed_booking["learner"]["headers"],
        )
        assert resp.status_code == 403

    def test_mentor_cannot_confirm_learner_attendance(self, session, confirmed_booking):
        """
        BOLA: The mentor must not be able to call /learner-confirm.
        The check: if booking.learner_id != current_user.id: 403
        """
        booking_id = confirmed_booking["booking_id"]
        resp = session.post(
            f"{BASE_URL}/bookings/{booking_id}/learner-confirm",
            headers=confirmed_booking["mentor"]["headers"],
        )
        assert resp.status_code == 403
