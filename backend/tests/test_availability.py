"""
test_availability.py — Availability slot and recurring pattern tests.

Key concepts under test:
  - Allen's interval relations: two intervals [A_s, A_e) and [B_s, B_e) overlap
    iff A_s < B_e AND A_e > B_s.  Adjacent intervals share an endpoint but do
    NOT satisfy this condition, so they must be accepted.
  - Server-side validation of slot times (past dates, zero duration).
  - Recurring pattern generation and slot count accuracy.
"""

import pytest
import requests
import random
import string
from datetime import datetime, timedelta, timezone

BASE_URL = "http://192.168.1.17:8000"


def unique_email(prefix="avail"):
    s = "".join(random.choices(string.ascii_lowercase + string.digits, k=8))
    return f"{prefix}.{s}@test.ie"


# ---------------------------------------------------------------------------
# Basic slot creation
# ---------------------------------------------------------------------------

class TestSlotCreation:

    def test_valid_slot_creation_succeeds(self, session, registered_mentor):
        """
        A correctly formed future availability slot must be accepted with 201.
        The response must include the slot id, mentor_profile_id, start/end times,
        and status='available'. This is the happy-path baseline.
        """
        resp = session.post(
            f"{BASE_URL}/availability/mentors/me/availability",
            headers=registered_mentor["headers"],
            json={
                "start_time": "2027-07-01T09:00:00Z",
                "end_time": "2027-07-01T10:00:00Z",
            },
        )
        assert resp.status_code == 201
        body = resp.json()
        assert "id" in body
        assert body["mentor_profile_id"] == registered_mentor["mentor_profile_id"]
        assert body["status"] == "available"

    def test_slot_in_past_rejected(self, session, registered_mentor):
        """
        A slot with both start and end times in the past should be rejected.
        Allowing past slots creates dead data — learners could never book them —
        and pollutes the mentor's availability view.

        NOTE: If this test FAILS (API returns 201), it is a documented finding:
        server-side past-date validation is absent from the availability schema.
        The booking endpoint DOES block past bookings, but the slot creation
        endpoint does not. Recommendation: add @field_validator to enforce
        start_time > now() in AvailabilitySlotCreate.
        """
        resp = session.post(
            f"{BASE_URL}/availability/mentors/me/availability",
            headers=registered_mentor["headers"],
            json={
                "start_time": "2020-01-01T10:00:00Z",
                "end_time": "2020-01-01T11:00:00Z",
            },
        )
        assert resp.status_code in (400, 422), (
            f"Past slot was accepted with {resp.status_code}. "
            "Finding: no server-side future-date validation on availability slots."
        )

    def test_end_time_before_start_time_rejected(self, session, registered_mentor):
        """
        A slot where end_time <= start_time must return 422 (Pydantic validation
        error). This is enforced by the @field_validator('end_time') on
        AvailabilitySlotCreate which checks v <= info.data['start_time'].
        """
        resp = session.post(
            f"{BASE_URL}/availability/mentors/me/availability",
            headers=registered_mentor["headers"],
            json={
                "start_time": "2027-07-01T12:00:00Z",
                "end_time": "2027-07-01T10:00:00Z",
            },
        )
        assert resp.status_code == 422
        detail = str(resp.json().get("detail", ""))
        assert "end_time" in detail.lower() or "after" in detail.lower()

    def test_zero_duration_slot_rejected(self, session, registered_mentor):
        """
        BVA: A slot where start_time == end_time has zero duration and can
        never be booked. The end_after_start validator uses strict <=, so
        start_time == end_time raises a ValueError → 422.
        """
        resp = session.post(
            f"{BASE_URL}/availability/mentors/me/availability",
            headers=registered_mentor["headers"],
            json={
                "start_time": "2027-07-01T10:00:00Z",
                "end_time": "2027-07-01T10:00:00Z",
            },
        )
        assert resp.status_code == 422


# ---------------------------------------------------------------------------
# Overlap detection (Allen interval algebra)
# ---------------------------------------------------------------------------

class TestSlotOverlap:

    def test_overlapping_slot_rejected_by_allen_check(self, session, registered_mentor):
        """
        The registered_mentor fixture creates a slot at 2027-06-10 10:00-13:00.
        Attempting to create 2027-06-10 11:00-14:00 satisfies Allen's overlap
        condition: 10:00 < 14:00 AND 13:00 > 11:00 → overlap detected → 400.

        This ensures a mentor cannot accidentally double-book themselves by
        creating intersecting availability windows.
        """
        resp = session.post(
            f"{BASE_URL}/availability/mentors/me/availability",
            headers=registered_mentor["headers"],
            json={
                "start_time": "2027-06-10T11:00:00Z",
                "end_time": "2027-06-10T14:00:00Z",
            },
        )
        assert resp.status_code in (400, 409), (
            f"Overlapping slot was accepted with {resp.status_code}. "
            "Allen overlap detection is not working."
        )
        assert "overlap" in resp.json().get("detail", "").lower()

    def test_adjacent_slots_accepted(self, session, registered_mentor):
        """
        Adjacent (back-to-back) slots share an endpoint but do NOT overlap.
        Allen condition for overlap: A_s < B_e AND A_e > B_s.
        For A=[10:00, 11:00) and B=[11:00, 12:00):
            10:00 < 12:00  →  True
            11:00 > 11:00  →  False   ← overlap NOT satisfied
        Both slots must be accepted (201).

        This is critical for mentors who want to schedule consecutive sessions
        on different dates without gaps.
        """
        # Use a different date from the existing fixture slot to avoid any
        # ambiguity — the fixture slot is on 2027-06-10
        slot_a = session.post(
            f"{BASE_URL}/availability/mentors/me/availability",
            headers=registered_mentor["headers"],
            json={
                "start_time": "2027-07-15T10:00:00Z",
                "end_time": "2027-07-15T11:00:00Z",
            },
        )
        assert slot_a.status_code == 201, (
            f"First adjacent slot rejected: {slot_a.status_code} {slot_a.text}"
        )

        slot_b = session.post(
            f"{BASE_URL}/availability/mentors/me/availability",
            headers=registered_mentor["headers"],
            json={
                "start_time": "2027-07-15T11:00:00Z",
                "end_time": "2027-07-15T12:00:00Z",
            },
        )
        assert slot_b.status_code == 201, (
            f"Adjacent slot (B) was incorrectly rejected as overlapping: "
            f"{slot_b.status_code} {slot_b.text}"
        )


# ---------------------------------------------------------------------------
# Recurring patterns
# ---------------------------------------------------------------------------

class TestRecurringPatterns:

    def test_valid_recurring_pattern_created(self, session, registered_mentor):
        """
        Creating a recurring pattern with a valid day, times, and a future
        generate_until date must return 201 with the pattern data.
        The endpoint also auto-generates individual slots — verified separately.
        """
        future_date = (datetime.now(timezone.utc).date() + timedelta(days=60)).isoformat()
        resp = session.post(
            f"{BASE_URL}/recurring/mentors/me/recurring",
            headers=registered_mentor["headers"],
            json={
                "day_of_week": "FRIDAY",
                "start_time": "10:00",
                "end_time": "12:00",
                "generate_until": future_date,
            },
        )
        assert resp.status_code == 201, (
            f"Valid recurring pattern rejected: {resp.status_code} {resp.text}"
        )
        body = resp.json()
        assert body["day_of_week"] == "FRIDAY"
        assert body["start_time"] == "10:00"
        assert body["end_time"] == "12:00"
        assert body["is_active"] is True

    def test_recurring_pattern_generates_correct_number_of_slots(
        self, session, registered_mentor
    ):
        """
        When a 2-hour recurring pattern (10:00-12:00) is created for a single
        target weekday occurrence (generate_until = that day + 3 days), exactly
        2 slots must be generated: one per hour (10:00-11:00 and 11:00-12:00).

        This tests the generate_slots_from_pattern() function's loop logic:
        - It iterates weekly occurrences of the target day.
        - For each occurrence it generates 1-hour sub-slots.
        - 2-hour window → 2 slots per occurrence × 1 occurrence = 2 slots total.
        """
        today = datetime.now(timezone.utc).date()
        # Find the next THURSDAY (weekday index 3)
        days_until_thursday = (3 - today.weekday()) % 7
        next_thursday = today + timedelta(days=days_until_thursday)
        # generate_until = next Thursday + 3 days → only ONE Thursday in range
        generate_until = (next_thursday + timedelta(days=3)).isoformat()

        # Count existing slots before creating the pattern
        slots_before = session.get(
            f"{BASE_URL}/availability/mentors/me/availability",
            headers=registered_mentor["headers"],
        ).json()
        count_before = len(slots_before) if isinstance(slots_before, list) else 0

        resp = session.post(
            f"{BASE_URL}/recurring/mentors/me/recurring",
            headers=registered_mentor["headers"],
            json={
                "day_of_week": "THURSDAY",
                "start_time": "10:00",
                "end_time": "12:00",
                "generate_until": generate_until,
            },
        )
        assert resp.status_code == 201, (
            f"Recurring pattern creation failed: {resp.status_code} {resp.text}"
        )

        # Count slots after
        slots_after = session.get(
            f"{BASE_URL}/availability/mentors/me/availability",
            headers=registered_mentor["headers"],
        ).json()
        count_after = len(slots_after) if isinstance(slots_after, list) else 0

        new_slots = count_after - count_before
        # 2-hour window → 2 slots per occurrence × 1 occurrence
        assert new_slots == 2, (
            f"Expected 2 generated slots for a single 2-hour Thursday occurrence, "
            f"got {new_slots}. Total slots before={count_before}, after={count_after}."
        )
