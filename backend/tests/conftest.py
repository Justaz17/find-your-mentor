"""
conftest.py - shared fixtures for Find Your Mentor test suite.

All fixtures are function-scoped to ensure complete test isolation.
Each test that depends on registered_mentor or registered_learner gets a
fresh account with a unique random suffix, preventing cross-test pollution.
"""

import pytest
import requests
import random
import string

BASE_URL = "http://192.168.1.17:8000"

# ---------------------------------------------------------------------------
# Infrastructure
# ---------------------------------------------------------------------------


@pytest.fixture
def session():
    """Provide a fresh requests.Session for each test."""
    s = requests.Session()
    yield s
    s.close()


@pytest.fixture
def suffix():
    """
    Generate a unique 8-character alphanumeric suffix for each test.
    Prevents email collisions when tests are re-run on the same database.
    """
    return "".join(random.choices(string.ascii_lowercase + string.digits, k=8))


# ---------------------------------------------------------------------------
# User fixtures
# ---------------------------------------------------------------------------


@pytest.fixture
def registered_learner(session, suffix):
    """
    Register a new learner account and log in.

    Returns a dict with:
        token       - JWT bearer token
        user_id     - database ID of the user
        email       - registered email address
        name        - display name
        headers     - Authorization header dict ready for requests
    """
    email = f"learner.{suffix}@test.ie"
    password = "LearnerPass123!"

    resp = session.post(
        f"{BASE_URL}/auth/register",
        json={
            "email": email,
            "name": "Aoife Ni Bhriain",
            "password": password,
            "role": "learner",
        },
    )
    assert resp.status_code == 201, f"Learner registration failed: {resp.text}"
    user = resp.json()

    resp = session.post(
        f"{BASE_URL}/auth/login",
        json={
            "email": email,
            "password": password,
        },
    )
    assert resp.status_code == 200, f"Learner login failed: {resp.text}"
    token = resp.json()["access_token"]

    return {
        "token": token,
        "user_id": user["id"],
        "email": email,
        "name": "Aoife Ni Bhriain",
        "password": password,
        "headers": {"Authorization": f"Bearer {token}"},
    }


@pytest.fixture
def registered_mentor(session, suffix):
    """
    Register a new mentor account, create a full profile, one service
    (60-minute Python session at EUR45), and one 3-hour availability slot
    (2027-06-10 10:00–13:00 UTC).

    Returns a dict with:
        token               - JWT bearer token
        user_id             - user database ID
        email               - registered email
        headers             - Authorization header dict
        mentor_profile_id   - MentorProfile.id
        service_id          - MentorService.id
        slot_id             - AvailabilitySlot.id
    """
    email = f"mentor.{suffix}@test.ie"
    password = "MentorPass123!"

    # 1. Register
    resp = session.post(
        f"{BASE_URL}/auth/register",
        json={
            "email": email,
            "name": "Cormac O'Sullivan",
            "password": password,
            "role": "mentor",
        },
    )
    assert resp.status_code == 201, f"Mentor registration failed: {resp.text}"
    user = resp.json()

    # 2. Login
    resp = session.post(
        f"{BASE_URL}/auth/login",
        json={
            "email": email,
            "password": password,
        },
    )
    assert resp.status_code == 200, f"Mentor login failed: {resp.text}"
    token = resp.json()["access_token"]
    headers = {"Authorization": f"Bearer {token}"}

    # 3. Create mentor profile
    resp = session.post(
        f"{BASE_URL}/mentors/me/profile",
        headers=headers,
        json={
            "bio": "Experienced software engineer specialising in Python and data science, based in Cork.",
            "hourly_rate": 45.0,
            "is_visible": True,
            "skills": ["Python", "Data Science"],
            "years_experience": 7,
            "languages": "English, Irish",
            "session_format": "online",
            "location": "Cork, Ireland",
            "tags": "python,data-science,beginner_friendly",
        },
    )
    assert resp.status_code == 201, f"Profile creation failed: {resp.text}"
    profile = resp.json()

    # 4. Create service
    resp = session.post(
        f"{BASE_URL}/services/me",
        headers=headers,
        json={
            "title": "Python Mentoring Session",
            "description": "One-to-one Python coaching from beginner to advanced.",
            "duration_minutes": 60,
            "price": 45.0,
        },
    )
    assert resp.status_code == 201, f"Service creation failed: {resp.text}"
    service = resp.json()

    # 5. Create a wide 3-hour availability slot (far enough in the future that
    #    any booking made during tests is clearly not in the past)
    resp = session.post(
        f"{BASE_URL}/availability/mentors/me/availability",
        headers=headers,
        json={
            "start_time": "2027-06-10T10:00:00Z",
            "end_time": "2027-06-10T13:00:00Z",
        },
    )
    assert resp.status_code == 201, f"Slot creation failed: {resp.text}"
    slot = resp.json()

    return {
        "token": token,
        "user_id": user["id"],
        "email": email,
        "password": password,
        "headers": headers,
        "mentor_profile_id": profile["id"],
        "service_id": service["id"],
        "slot_id": slot["id"],
    }


# ---------------------------------------------------------------------------
# Booking fixtures
# ---------------------------------------------------------------------------


@pytest.fixture
def pending_booking(session, registered_learner, registered_mentor):
    """
    Create a pending booking from the learner to the mentor.

    The booking is for the first 60 minutes of the mentor's 3-hour slot
    (2027-06-10 10:00–11:00 UTC) and remains in 'pending' state.

    Returns a dict with booking data, plus learner and mentor dicts.
    """
    resp = session.post(
        f"{BASE_URL}/bookings",
        headers=registered_learner["headers"],
        json={
            "mentor_service_id": registered_mentor["service_id"],
            "start_time": "2027-06-10T10:00:00Z",
            "end_time": "2027-06-10T11:00:00Z",
            "learner_note": "Excited to start learning Python - looking forward to it!",
        },
    )
    assert resp.status_code == 201, f"Booking creation failed: {resp.text}"
    booking = resp.json()

    return {
        "booking": booking,
        "booking_id": booking["id"],
        "learner": registered_learner,
        "mentor": registered_mentor,
    }


@pytest.fixture
def confirmed_booking(session, pending_booking):
    """
    Extend pending_booking by having the mentor approve it.

    Returns the same dict as pending_booking; the booking is now 'confirmed'.
    """
    booking_id = pending_booking["booking_id"]
    mentor_headers = pending_booking["mentor"]["headers"]

    resp = session.post(
        f"{BASE_URL}/bookings/{booking_id}/approve",
        headers=mentor_headers,
    )
    assert resp.status_code == 200, f"Booking approval failed: {resp.text}"

    return pending_booking
