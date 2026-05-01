"""
test_integration.py - End-to-end integration tests.

Each flow is fully self-contained: it registers its own users, creates all
required resources, and makes assertions on the final system state. No shared
fixtures are used so that flows can be run independently or in any order.

Flow 1: Complete booking lifecycle
  Register mentor → profile → service → slot → register learner → book →
  mentor approves → learner confirms → mentor confirms → assert completed + paid

Flow 2: Concurrent overlap protection
  Two independent learners attempt to book the same time window;
  the second must be rejected to enforce mutual exclusion.

Flow 3: Mentor denial restores slot availability
  Learner books → mentor denies → assert slot is visible in public availability
  (i.e., has reverted to 'available' status).
"""

import pytest
import requests
import random
import string

BASE_URL = "http://192.168.1.17:8000"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def unique_email(prefix="integration"):
    s = "".join(random.choices(string.ascii_lowercase + string.digits, k=9))
    return f"{prefix}.{s}@test.ie"


def register_and_login(session, name, email, password, role="learner"):
    """Register a user and return their auth headers and user id."""
    reg = session.post(
        f"{BASE_URL}/auth/register",
        json={
            "email": email,
            "name": name,
            "password": password,
            "role": role,
        },
    )
    assert reg.status_code == 201, f"Registration failed for {email}: {reg.text}"
    user_id = reg.json()["id"]

    tok = session.post(
        f"{BASE_URL}/auth/login",
        json={
            "email": email,
            "password": password,
        },
    )
    assert tok.status_code == 200, f"Login failed for {email}: {tok.text}"
    token = tok.json()["access_token"]
    return {"user_id": user_id, "headers": {"Authorization": f"Bearer {token}"}}


def setup_mentor(session, name, email, password):
    """
    Register a mentor, create their profile, service, and availability slot.
    Returns a dict with all relevant ids.
    """
    mentor = register_and_login(session, name, email, password, role="mentor")

    # Profile
    prof = session.post(
        f"{BASE_URL}/mentors/me/profile",
        headers=mentor["headers"],
        json={
            "bio": f"Mentor profile for {name}. Integration test account.",
            "hourly_rate": 45.0,
            "is_visible": True,
            "skills": ["Python"],
            "years_experience": 5,
            "languages": "English, Irish",
            "session_format": "online",
            "location": "Dublin, Ireland",
            "tags": "python,beginner_friendly",
        },
    )
    assert prof.status_code == 201, f"Profile creation failed: {prof.text}"
    mentor["mentor_profile_id"] = prof.json()["id"]

    # Service
    svc = session.post(
        f"{BASE_URL}/services/me",
        headers=mentor["headers"],
        json={
            "title": "Python Coaching",
            "description": "One-to-one Python session.",
            "duration_minutes": 60,
            "price": 45.0,
        },
    )
    assert svc.status_code == 201, f"Service creation failed: {svc.text}"
    mentor["service_id"] = svc.json()["id"]

    # Availability slot (3 hours - wide enough for multiple 1-hour bookings)
    slot = session.post(
        f"{BASE_URL}/availability/mentors/me/availability",
        headers=mentor["headers"],
        json={
            "start_time": "2027-08-20T10:00:00Z",
            "end_time": "2027-08-20T13:00:00Z",
        },
    )
    assert slot.status_code == 201, f"Slot creation failed: {slot.text}"
    mentor["slot_id"] = slot.json()["id"]

    return mentor


# ---------------------------------------------------------------------------
# Flow 1 - Complete booking lifecycle to completed + paid
# ---------------------------------------------------------------------------


class TestFullBookingLifecycle:

    def test_full_flow_register_to_completed_and_paid(self, session):
        """
        Flow 1 - Complete booking lifecycle:

          1.  Register mentor (Muireann Ni Fhaoláin)
          2.  Create mentor profile, service (60 min EUR45), availability slot
          3.  Register learner (Declan Ó Treasaigh)
          4.  Learner submits booking for 10:00-11:00 with a note
          5.  Mentor approves → status transitions to 'confirmed'
          6.  Learner confirms attendance → learner_confirmed=True
          7.  Mentor confirms attendance → completed=True (both parties confirmed)
          8.  Re-fetch booking via GET /bookings/me
          9.  Assert status='completed', payment_status='paid'

        This verifies the entire booking state machine end-to-end and confirms
        that payment settlement only occurs when both parties confirm attendance.
        """
        # ── 1-2. Mentor setup ──────────────────────────────────────────────
        mentor = setup_mentor(
            session,
            name="Muireann Ni Fhaoláin",
            email=unique_email("mentor"),
            password="MentorIntPass123!",
        )

        # ── 3. Learner registration ────────────────────────────────────────
        learner = register_and_login(
            session,
            name="Declan O Treasaigh",
            email=unique_email("learner"),
            password="LearnerIntPass123!",
        )

        # ── 4. Submit booking ──────────────────────────────────────────────
        book_resp = session.post(
            f"{BASE_URL}/bookings",
            headers=learner["headers"],
            json={
                "mentor_service_id": mentor["service_id"],
                "start_time": "2027-08-20T10:00:00Z",
                "end_time": "2027-08-20T11:00:00Z",
                "learner_note": "Go raibh maith agat! Looking forward to learning Python.",
            },
        )
        assert book_resp.status_code == 201, f"Booking failed: {book_resp.text}"
        booking_id = book_resp.json()["id"]
        assert book_resp.json()["status"] == "pending"

        # ── 5. Mentor approves ─────────────────────────────────────────────
        approve = session.post(
            f"{BASE_URL}/bookings/{booking_id}/approve",
            headers=mentor["headers"],
        )
        assert approve.status_code == 200
        assert approve.json()["status"] == "confirmed"

        # ── 6. Learner confirms attendance ─────────────────────────────────
        lc = session.post(
            f"{BASE_URL}/bookings/{booking_id}/learner-confirm",
            headers=learner["headers"],
        )
        assert lc.status_code == 200
        assert lc.json()["completed"] is False  # mentor hasn't confirmed yet

        # ── 7. Mentor confirms attendance ──────────────────────────────────
        mc = session.post(
            f"{BASE_URL}/bookings/{booking_id}/mentor-confirm",
            headers=mentor["headers"],
        )
        assert mc.status_code == 200
        assert mc.json()["completed"] is True

        # ── 8-9. Re-fetch and assert final state ───────────────────────────
        bookings = session.get(
            f"{BASE_URL}/bookings/me", headers=learner["headers"]
        ).json()
        final = next((b for b in bookings if b["id"] == booking_id), None)

        assert final is not None, "Completed booking not found in /bookings/me"
        assert (
            final["status"] == "completed"
        ), f"Expected status='completed', got '{final['status']}'"
        assert (
            final["payment_status"] == "paid"
        ), f"Expected payment_status='paid', got '{final['payment_status']}'"
        assert final["learner_confirmed"] is True
        assert final["mentor_confirmed"] is True


# ---------------------------------------------------------------------------
# Flow 2 - Concurrent overlap protection (two learners, same time window)
# ---------------------------------------------------------------------------


class TestConcurrentOverlapProtection:

    def test_second_learner_overlapping_booking_rejected(self, session):
        """
        Flow 2 - Concurrent overlap protection:

          1.  Register mentor with slot 2027-08-20 10:00-13:00
          2.  Register learner A → submits booking 10:00-11:00 → succeeds (201)
          3.  Register learner B → attempts 10:30-11:30 → rejected (409)

        This simulates two learners simultaneously discovering the same
        availability window. The platform must ensure only one booking is
        created per time window, enforcing mutual exclusion at the DB layer
        via the overlap check:
            Booking.start_time < 11:30 AND Booking.end_time > 10:30  →  conflict.

        The test validates that the conflict detection operates across users,
        not just for the same learner's self-overlap check.
        """
        # ── 1. Mentor setup ────────────────────────────────────────────────
        mentor = setup_mentor(
            session,
            name="Rónán Mac Cárthaigh",
            email=unique_email("mentor2"),
            password="MentorFlow2Pass123!",
        )

        # ── 2. Learner A books 10:00-11:00 ────────────────────────────────
        learner_a = register_and_login(
            session,
            "Caoimhe Ni Laoire",
            unique_email("learnerA"),
            "PassA123!",
        )
        resp_a = session.post(
            f"{BASE_URL}/bookings",
            headers=learner_a["headers"],
            json={
                "mentor_service_id": mentor["service_id"],
                "start_time": "2027-08-20T10:00:00Z",
                "end_time": "2027-08-20T11:00:00Z",
                "learner_note": "Learner A booking",
            },
        )
        assert (
            resp_a.status_code == 201
        ), f"Learner A's booking should succeed. Got {resp_a.status_code}: {resp_a.text}"

        # ── 3. Learner B attempts overlapping 10:30-11:30 ─────────────────
        learner_b = register_and_login(
            session,
            "Tadhg O Murchadha",
            unique_email("learnerB"),
            "PassB123!",
        )
        resp_b = session.post(
            f"{BASE_URL}/bookings",
            headers=learner_b["headers"],
            json={
                "mentor_service_id": mentor["service_id"],
                "start_time": "2027-08-20T10:30:00Z",
                "end_time": "2027-08-20T11:30:00Z",
                "learner_note": "Learner B overlapping attempt",
            },
        )
        assert resp_b.status_code in (400, 409), (
            f"Overlapping booking from a different learner should be rejected. "
            f"Got {resp_b.status_code}: {resp_b.text}. "
            "The conflict detection must operate across all users, not just per-learner."
        )
        assert (
            "time" in resp_b.json().get("detail", "").lower()
            or "booked" in resp_b.json().get("detail", "").lower()
        ), f"Unexpected conflict message: {resp_b.json()}"


# ---------------------------------------------------------------------------
# Flow 3 - Mentor denial restores slot availability
# ---------------------------------------------------------------------------


class TestMentorDenialRestoresSlot:

    def test_denied_booking_restores_slot_to_available(self, session):
        """
        Flow 3 - Slot restoration after denial:

          1.  Register mentor with slot 2027-08-20 10:00-13:00
          2.  Register learner → submits booking 10:00-11:00 (slot stays AVAILABLE
              because 60 min < 180 min slot capacity)
          3.  Mentor denies the booking
          4.  GET /availability/mentors/{mentor_profile_id}/availability
              → must return the original slot (status='available')

        The restore_slot_if_no_bookings() helper in bookings.py sets the slot
        back to AVAILABLE when the count of pending/confirmed bookings reaches 0.
        This flow confirms that a denied booking does not permanently block the slot.
        """
        # ── 1. Mentor setup ────────────────────────────────────────────────
        mentor = setup_mentor(
            session,
            name="Blathnaid Nic Giolla Easpaig",
            email=unique_email("mentor3"),
            password="MentorFlow3Pass123!",
        )

        # ── 2. Learner submits booking ─────────────────────────────────────
        learner = register_and_login(
            session,
            "Eoghan Mac Diarmada",
            unique_email("learner3"),
            "LearnerFlow3Pass123!",
        )
        book_resp = session.post(
            f"{BASE_URL}/bookings",
            headers=learner["headers"],
            json={
                "mentor_service_id": mentor["service_id"],
                "start_time": "2027-08-20T10:00:00Z",
                "end_time": "2027-08-20T11:00:00Z",
                "learner_note": "Hope this is approved!",
            },
        )
        assert book_resp.status_code == 201, f"Booking failed: {book_resp.text}"
        booking_id = book_resp.json()["id"]

        # ── 3. Mentor denies ───────────────────────────────────────────────
        deny_resp = session.post(
            f"{BASE_URL}/bookings/{booking_id}/deny",
            headers=mentor["headers"],
        )
        assert deny_resp.status_code == 200
        assert deny_resp.json()["status"] == "cancelled_by_mentor"

        # ── 4. Verify slot is still available publicly ─────────────────────
        mentor_profile_id = mentor["mentor_profile_id"]
        slots_resp = session.get(
            f"{BASE_URL}/availability/mentors/{mentor_profile_id}/availability"
        )
        assert slots_resp.status_code == 200
        slots = slots_resp.json()

        slot_ids = [s["id"] for s in slots]
        assert mentor["slot_id"] in slot_ids, (
            f"Slot {mentor['slot_id']} should be visible (status=available) after "
            f"denial, but it was not in the public availability list. "
            f"Visible slots: {slot_ids}"
        )
