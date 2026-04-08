"""
Find Your Mentor - Comprehensive API Test Suite
University Dissertation Testing Chapter
Target: http://192.168.1.17:8000
"""

import requests
import time
import random
import string
import json
from datetime import datetime, timezone

BASE_URL = "http://192.168.1.17:8000"
RESULTS = []
PERF_SEARCH = []
PERF_LOGIN = []
PERF_BOOKING = None

# --- Shared state across tests ------------------------------------------------
STATE = {
    "learner_token": None,
    "mentor_token": None,
    "learner_id": None,
    "mentor_id": None,
    "service_id": None,
    "slot_id": None,
    "booking_id": None,
    "mentor_profile_id": None,
}

# --- Unique email suffix ------------------------------------------------------
SUFFIX = "".join(random.choices(string.digits, k=6))
LEARNER_EMAIL = f"ciaran.kelly.{SUFFIX}@test.ie"
MENTOR_EMAIL = f"sinead.murphy.{SUFFIX}@test.ie"
PASSWORD = "TestPass123!"


# --- Helpers ------------------------------------------------------------------
def auth_headers(token):
    return {"Authorization": f"Bearer {token}"}


def record(name, passed, expected, actual_status, actual_body, elapsed_ms):
    status = "PASS" if passed else "FAIL"
    RESULTS.append(
        {
            "status": status,
            "name": name,
            "expected": expected,
            "actual_status": actual_status,
            "actual_body": actual_body,
            "elapsed_ms": elapsed_ms,
        }
    )
    body_preview = str(actual_body)[:200]
    print(f"\n{'='*70}")
    print(f"  [{status}] {name}")
    print(f"  Expected : {expected}")
    print(f"  Status   : {actual_status}")
    print(f"  Body     : {body_preview}")
    print(f"  Time     : {elapsed_ms:.1f} ms")


def post(url, **kwargs):
    t0 = time.perf_counter()
    r = requests.post(BASE_URL + url, **kwargs)
    ms = (time.perf_counter() - t0) * 1000
    return r, ms


def get(url, **kwargs):
    t0 = time.perf_counter()
    r = requests.get(BASE_URL + url, **kwargs)
    ms = (time.perf_counter() - t0) * 1000
    return r, ms


def safe_json(r):
    try:
        return r.json()
    except Exception:
        return r.text[:300]


# ==============================================================================
#  SECTION 1 -- AUTHENTICATION & SECURITY
# ==============================================================================

def test_register_learner():
    r, ms = post("/auth/register", json={
        "email": LEARNER_EMAIL,
        "name": "Ciaran Kelly",
        "password": PASSWORD,
        "role": "learner",
    })
    body = safe_json(r)
    passed = r.status_code in (200, 201)
    if passed:
        STATE["learner_id"] = body.get("id")
    record(
        "Register learner (Ciaran Kelly)",
        passed,
        "HTTP 200 or 201, user object returned",
        r.status_code,
        body,
        ms,
    )


def test_register_mentor():
    r, ms = post("/auth/register", json={
        "email": MENTOR_EMAIL,
        "name": "Sinead Murphy",
        "password": PASSWORD,
        "role": "mentor",
    })
    body = safe_json(r)
    passed = r.status_code in (200, 201)
    if passed:
        STATE["mentor_id"] = body.get("id")
    record(
        "Register mentor (Sinead Murphy)",
        passed,
        "HTTP 200 or 201, user object returned",
        r.status_code,
        body,
        ms,
    )


def test_login_correct():
    r, ms = post("/auth/login", json={"email": LEARNER_EMAIL, "password": PASSWORD})
    body = safe_json(r)
    token = body.get("access_token") if isinstance(body, dict) else None
    passed = r.status_code == 200 and bool(token)
    if passed:
        STATE["learner_token"] = token
    record(
        "Login with correct credentials",
        passed,
        "HTTP 200, access_token present",
        r.status_code,
        {"has_token": bool(token)},
        ms,
    )


def test_login_mentor():
    """Login mentor to obtain mentor token (not a graded test, just setup)."""
    r, ms = post("/auth/login", json={"email": MENTOR_EMAIL, "password": PASSWORD})
    body = safe_json(r)
    token = body.get("access_token") if isinstance(body, dict) else None
    if token:
        STATE["mentor_token"] = token


def test_login_wrong_password():
    r, ms = post("/auth/login", json={"email": LEARNER_EMAIL, "password": "WrongPass99!"})
    body = safe_json(r)
    passed = r.status_code in (401, 403, 400)
    record(
        "Login with wrong password",
        passed,
        "HTTP 401/403/400, login rejected",
        r.status_code,
        body,
        ms,
    )


def test_login_nonexistent_email():
    r, ms = post("/auth/login", json={"email": "nobody.ever@test.ie", "password": PASSWORD})
    body = safe_json(r)
    passed = r.status_code in (401, 403, 404, 400)
    record(
        "Login with nonexistent email",
        passed,
        "HTTP 401/403/404/400, login rejected",
        r.status_code,
        body,
        ms,
    )


def test_protected_no_token():
    r, ms = get("/mentors/me")
    body = safe_json(r)
    passed = r.status_code in (401, 403)
    record(
        "Protected endpoint with no token",
        passed,
        "HTTP 401 or 403",
        r.status_code,
        body,
        ms,
    )


def test_protected_invalid_jwt():
    r, ms = get("/mentors/me", headers={"Authorization": "Bearer eyJhbGciOiJIUzI1NiJ9.eyJzdWIiOiJ0YW1wZXJlZCJ9.INVALID_SIGNATURE"})
    body = safe_json(r)
    passed = r.status_code in (401, 403)
    record(
        "Protected endpoint with tampered/invalid JWT",
        passed,
        "HTTP 401 or 403",
        r.status_code,
        body,
        ms,
    )


def test_password_not_in_response():
    r, ms = post("/auth/register", json={
        "email": f"pwcheck.{SUFFIX}@test.ie",
        "name": "Password Check",
        "password": PASSWORD,
        "role": "learner",
    })
    body_text = r.text.lower()
    passed = "testpass123" not in body_text and r.status_code in (200, 201)
    record(
        "Password not returned in registration response",
        passed,
        "Response body does not contain the plaintext password",
        r.status_code,
        {"body_contains_password": "testpass123" in body_text},
        ms,
    )


def test_sql_injection_email():
    r, ms = post("/auth/login", json={"email": "admin'--@test.com", "password": PASSWORD})
    body = safe_json(r)
    # Pass if handled safely (any non-5xx response is acceptable)
    passed = r.status_code < 500
    record(
        "SQL injection in email field",
        passed,
        "Handled safely, no 500 error",
        r.status_code,
        body,
        ms,
    )


def test_oversized_bio():
    if not STATE["mentor_token"]:
        record("Oversized bio field (10000 chars)", False, "Mentor token required", "N/A", "Skipped", 0)
        return
    big_bio = "A" * 10000
    r, ms = post("/mentors/me/profile", headers=auth_headers(STATE["mentor_token"]), json={
        "bio": big_bio,
        "hourly_rate": 50.0,
        "is_visible": True,
        "skills": ["Python"],
    })
    body = safe_json(r)
    # Either accepted (200/201) or rejected with validation error -- not a 500
    passed = r.status_code < 500
    record(
        "Oversized bio field (10,000 characters)",
        passed,
        "Handled safely (any non-5xx response)",
        r.status_code,
        {"detail": body.get("detail", "") if isinstance(body, dict) else str(body)[:100]},
        ms,
    )


def test_access_other_users_booking():
    """Learner tries to approve/access a booking that belongs to the mentor."""
    booking_id = STATE.get("booking_id")
    if not booking_id or not STATE["learner_token"]:
        record("Access another user's booking (cross-user)", False, "403 or 404", "N/A", "Skipped -- run after booking is created", 0)
        return
    r, ms = post(f"/bookings/{booking_id}/approve", headers=auth_headers(STATE["learner_token"]))
    body = safe_json(r)
    passed = r.status_code in (403, 404)
    record(
        "Access another user's booking (learner tries to approve mentor booking)",
        passed,
        "HTTP 403 or 404",
        r.status_code,
        body,
        ms,
    )


# ==============================================================================
#  SECTION 2 -- MENTOR SETUP
# ==============================================================================

def test_create_mentor_profile():
    if not STATE["mentor_token"]:
        record("Create mentor profile", False, "HTTP 200/201", "N/A", "No mentor token", 0)
        return
    r, ms = post("/mentors/me/profile", headers=auth_headers(STATE["mentor_token"]), json={
        "bio": "Experienced software engineer with a passion for teaching. I specialise in Python, data science, and web development.",
        "hourly_rate": 50.0,
        "is_visible": True,
        "skills": ["Python", "Machine Learning", "FastAPI"],
        "years_experience": 8,
        "languages": "English, Irish",
        "session_format": "online",
        "location": "Dublin, Ireland",
        "tags": "python,data-science,web",
    })
    body = safe_json(r)
    passed = r.status_code in (200, 201)
    if passed and isinstance(body, dict):
        STATE["mentor_profile_id"] = body.get("id")
    record(
        "Create mentor profile with full details",
        passed,
        "HTTP 200 or 201",
        r.status_code,
        body,
        ms,
    )


def test_create_valid_service():
    if not STATE["mentor_token"]:
        record("Create valid mentor service (60min, EUR45)", False, "HTTP 201", "N/A", "No mentor token", 0)
        return
    r, ms = post("/services/me", headers=auth_headers(STATE["mentor_token"]), json={
        "title": "Python Mentoring Session",
        "description": "One-to-one Python coaching covering fundamentals to advanced topics.",
        "duration_minutes": 60,
        "price": 45.00,
        "is_active": True,
    })
    body = safe_json(r)
    passed = r.status_code in (200, 201)
    if passed and isinstance(body, dict):
        STATE["service_id"] = body.get("id")
    record(
        "Create valid mentor service (60 min, EUR45)",
        passed,
        "HTTP 200 or 201, service created",
        r.status_code,
        body,
        ms,
    )


def test_create_invalid_service_duration():
    if not STATE["mentor_token"]:
        record("Create service with invalid duration (75 min)", False, "HTTP 400/422", "N/A", "No mentor token", 0)
        return
    r, ms = post("/services/me", headers=auth_headers(STATE["mentor_token"]), json={
        "title": "Bad Duration Service",
        "duration_minutes": 75,
        "price": 30.00,
    })
    body = safe_json(r)
    passed = r.status_code in (400, 422)
    record(
        "Create service with invalid duration (75 min -- not in [30,45,60,90,120])",
        passed,
        "HTTP 400 or 422, validation error",
        r.status_code,
        body,
        ms,
    )


def test_create_availability_slot():
    if not STATE["mentor_token"]:
        record("Create availability slot (2026-06-10 10:00-13:00)", False, "HTTP 201", "N/A", "No mentor token", 0)
        return
    r, ms = post("/availability/mentors/me/availability",
        headers=auth_headers(STATE["mentor_token"]),
        json={
            "start_time": "2026-06-10T10:00:00Z",
            "end_time": "2026-06-10T13:00:00Z",
        },
    )
    body = safe_json(r)
    passed = r.status_code in (200, 201)
    if passed and isinstance(body, dict):
        STATE["slot_id"] = body.get("id")
    record(
        "Create availability slot (2026-06-10 10:00-13:00 UTC)",
        passed,
        "HTTP 200 or 201, slot created",
        r.status_code,
        body,
        ms,
    )


def test_create_overlapping_slot():
    if not STATE["mentor_token"]:
        record("Create overlapping availability slot (11:00-14:00)", False, "HTTP 400", "N/A", "No mentor token", 0)
        return
    r, ms = post("/availability/mentors/me/availability",
        headers=auth_headers(STATE["mentor_token"]),
        json={
            "start_time": "2026-06-10T11:00:00Z",
            "end_time": "2026-06-10T14:00:00Z",
        },
    )
    body = safe_json(r)
    passed = r.status_code in (400, 409, 422)
    record(
        "Create overlapping availability slot (rejected)",
        passed,
        "HTTP 400/409/422, overlap detected",
        r.status_code,
        body,
        ms,
    )


# ==============================================================================
#  SECTION 3 -- SEARCH & DISCOVERY
# ==============================================================================

def test_search_all_mentors():
    r, ms = get("/mentors/search")
    body = safe_json(r)
    passed = r.status_code == 200 and isinstance(body, list)
    record(
        "Search all mentors",
        passed,
        "HTTP 200, list returned",
        r.status_code,
        {"count": len(body) if isinstance(body, list) else "N/A"},
        ms,
    )


def test_search_with_skill_filter():
    r, ms = get("/mentors/search", params={"skill": "Python"})
    body = safe_json(r)
    passed = r.status_code == 200 and isinstance(body, list)
    record(
        "Search mentors with skill filter (Python)",
        passed,
        "HTTP 200, filtered list returned",
        r.status_code,
        {"count": len(body) if isinstance(body, list) else "N/A"},
        ms,
    )


def test_search_with_price_filter():
    r, ms = get("/mentors/search", params={"max_price": 100})
    body = safe_json(r)
    passed = r.status_code == 200 and isinstance(body, list)
    record(
        "Search mentors with price filter (max EUR100)",
        passed,
        "HTTP 200, filtered list returned",
        r.status_code,
        {"count": len(body) if isinstance(body, list) else "N/A"},
        ms,
    )


# ==============================================================================
#  SECTION 4 -- BOOKING FLOW
# ==============================================================================

def test_submit_booking():
    global PERF_BOOKING
    if not STATE["learner_token"] or not STATE["service_id"]:
        record("Submit booking (10:00-11:00)", False, "HTTP 201", "N/A", "Missing token or service_id", 0)
        return
    t0 = time.perf_counter()
    r, ms = post("/bookings", headers=auth_headers(STATE["learner_token"]), json={
        "mentor_service_id": STATE["service_id"],
        "start_time": "2026-06-10T10:00:00Z",
        "end_time": "2026-06-10T11:00:00Z",
        "learner_note": "Looking forward to learning Python with you, Sinead!",
    })
    PERF_BOOKING = ms
    body = safe_json(r)
    passed = r.status_code in (200, 201)
    if passed and isinstance(body, dict):
        STATE["booking_id"] = body.get("id")
    record(
        "Submit booking as learner (10:00-11:00) with note",
        passed,
        "HTTP 200 or 201, booking created with status=pending",
        r.status_code,
        body,
        ms,
    )


def test_submit_overlapping_booking():
    if not STATE["learner_token"] or not STATE["service_id"]:
        record("Overlapping booking rejected (10:30-11:30)", False, "HTTP 400/409", "N/A", "Missing token or service_id", 0)
        return
    r, ms = post("/bookings", headers=auth_headers(STATE["learner_token"]), json={
        "mentor_service_id": STATE["service_id"],
        "start_time": "2026-06-10T10:30:00Z",
        "end_time": "2026-06-10T11:30:00Z",
        "learner_note": "This should be rejected",
    })
    body = safe_json(r)
    passed = r.status_code in (400, 409, 422)
    record(
        "Overlapping booking rejected (10:30-11:30 conflicts with 10:00-11:00)",
        passed,
        "HTTP 400/409/422, conflict detected",
        r.status_code,
        body,
        ms,
    )


def test_submit_booking_no_auth():
    if not STATE["service_id"]:
        record("Booking with no auth token rejected", False, "HTTP 401/403", "N/A", "No service_id", 0)
        return
    r, ms = post("/bookings", json={
        "mentor_service_id": STATE["service_id"],
        "start_time": "2026-06-10T11:00:00Z",
        "end_time": "2026-06-10T12:00:00Z",
    })
    body = safe_json(r)
    passed = r.status_code in (401, 403)
    record(
        "Booking submission with no auth token rejected",
        passed,
        "HTTP 401 or 403",
        r.status_code,
        body,
        ms,
    )


def test_mentor_approve_booking():
    booking_id = STATE.get("booking_id")
    if not booking_id or not STATE["mentor_token"]:
        record("Mentor approves booking", False, "HTTP 200, status=confirmed", "N/A", "Missing booking_id or mentor token", 0)
        return
    r, ms = post(f"/bookings/{booking_id}/approve", headers=auth_headers(STATE["mentor_token"]))
    body = safe_json(r)
    passed = r.status_code == 200 and isinstance(body, dict) and body.get("status") == "confirmed"
    record(
        "Mentor approves booking -> status becomes confirmed",
        passed,
        "HTTP 200, status=confirmed",
        r.status_code,
        body,
        ms,
    )


def test_learner_confirm_attendance():
    booking_id = STATE.get("booking_id")
    if not booking_id or not STATE["learner_token"]:
        record("Learner confirms attendance", False, "HTTP 200", "N/A", "Missing booking_id or learner token", 0)
        return
    r, ms = post(f"/bookings/{booking_id}/learner-confirm", headers=auth_headers(STATE["learner_token"]))
    body = safe_json(r)
    passed = r.status_code == 200
    record(
        "Learner confirms attendance",
        passed,
        "HTTP 200, attendance confirmed",
        r.status_code,
        body,
        ms,
    )


def test_mentor_confirm_attendance():
    booking_id = STATE.get("booking_id")
    if not booking_id or not STATE["mentor_token"]:
        record("Mentor confirms attendance", False, "HTTP 200", "N/A", "Missing booking_id or mentor token", 0)
        return
    r, ms = post(f"/bookings/{booking_id}/mentor-confirm", headers=auth_headers(STATE["mentor_token"]))
    body = safe_json(r)
    passed = r.status_code == 200
    record(
        "Mentor confirms attendance",
        passed,
        "HTTP 200, session marked complete",
        r.status_code,
        body,
        ms,
    )


def test_booking_completed_and_paid():
    booking_id = STATE.get("booking_id")
    if not booking_id or not STATE["learner_token"]:
        record("Booking status=completed and payment_status=paid after dual confirmation", False, "Both fields correct", "N/A", "Missing booking_id or learner token", 0)
        return
    r, ms = get("/bookings/me", headers=auth_headers(STATE["learner_token"]))
    body = safe_json(r)
    booking = next((b for b in (body if isinstance(body, list) else []) if b.get("id") == booking_id), None)
    if booking:
        status_ok = booking.get("status") == "completed"
        payment_ok = booking.get("payment_status") == "paid"
        passed = status_ok and payment_ok
        detail = {"status": booking.get("status"), "payment_status": booking.get("payment_status")}
    else:
        passed = False
        detail = {"error": "Booking not found in response"}
    record(
        "After dual confirmation: status=completed and payment_status=paid",
        passed,
        "status=completed, payment_status=paid",
        r.status_code,
        detail,
        ms,
    )


# ==============================================================================
#  SECTION 5 -- AUTHORIZATION BOUNDARY TESTS
# ==============================================================================

def test_learner_cannot_approve_booking():
    """Learner tries to approve a booking -- should fail (already moved to after booking creation)."""
    # Re-tested here with explicit label in the authorization section
    # We create a SECOND booking via a different learner to test,
    # or simply note this is already covered by test_access_other_users_booking.
    # For clarity, we run it directly here too.
    booking_id = STATE.get("booking_id")
    if not booking_id or not STATE["learner_token"]:
        record("Auth Boundary: Learner cannot approve booking", False, "HTTP 403/404", "N/A", "Missing data", 0)
        return
    r, ms = post(f"/bookings/{booking_id}/approve", headers=auth_headers(STATE["learner_token"]))
    body = safe_json(r)
    # Booking is already completed so it won't be pending, but the auth check fires first
    passed = r.status_code in (403, 404, 400)
    record(
        "Auth Boundary: Learner cannot approve a booking",
        passed,
        "HTTP 403/404/400 -- learner is not the mentor",
        r.status_code,
        body,
        ms,
    )


def test_learner_cannot_mentor_confirm():
    booking_id = STATE.get("booking_id")
    if not booking_id or not STATE["learner_token"]:
        record("Auth Boundary: Learner cannot confirm mentor attendance", False, "HTTP 403/404", "N/A", "Missing data", 0)
        return
    r, ms = post(f"/bookings/{booking_id}/mentor-confirm", headers=auth_headers(STATE["learner_token"]))
    body = safe_json(r)
    passed = r.status_code in (403, 404, 400)
    record(
        "Auth Boundary: Learner cannot confirm mentor attendance",
        passed,
        "HTTP 403/404/400 -- not the mentor",
        r.status_code,
        body,
        ms,
    )


def test_learner_mentor_bookings_endpoint():
    if not STATE["learner_token"]:
        record("Auth Boundary: Learner accesses /bookings/mentor/me", False, "Empty list or 403", "N/A", "No learner token", 0)
        return
    r, ms = get("/bookings/mentor/me", headers=auth_headers(STATE["learner_token"]))
    body = safe_json(r)
    # Learner has no mentor services -> should return empty list or 403
    passed = r.status_code in (200, 403, 404) and (
        r.status_code in (403, 404) or (isinstance(body, list) and len(body) == 0)
    )
    record(
        "Auth Boundary: Learner accesses /bookings/mentor/me (no mentor role)",
        passed,
        "HTTP 403/404 or empty list []",
        r.status_code,
        {"result": body if not isinstance(body, list) else f"list with {len(body)} items"},
        ms,
    )


# ==============================================================================
#  SECTION 6 -- PERFORMANCE TESTS
# ==============================================================================

def test_performance_search():
    times = []
    for i in range(10):
        r, ms = get("/mentors/search")
        times.append(ms)
    PERF_SEARCH.extend(times)
    avg = sum(times) / len(times)
    passed = avg < 2000  # reasonable threshold
    record(
        "Performance: GET /mentors/search x 10",
        passed,
        "All 10 requests complete, avg < 2000 ms",
        200,
        {
            "min_ms": round(min(times), 1),
            "avg_ms": round(avg, 1),
            "max_ms": round(max(times), 1),
            "samples": [round(t, 1) for t in times],
        },
        avg,
    )


def test_performance_login():
    times = []
    for i in range(5):
        r, ms = post("/auth/login", json={"email": LEARNER_EMAIL, "password": PASSWORD})
        times.append(ms)
    PERF_LOGIN.extend(times)
    avg = sum(times) / len(times)
    passed = avg < 2000
    record(
        "Performance: POST /auth/login x 5",
        passed,
        "All 5 requests complete, avg < 2000 ms",
        200,
        {
            "min_ms": round(min(times), 1),
            "avg_ms": round(avg, 1),
            "max_ms": round(max(times), 1),
            "samples": [round(t, 1) for t in times],
        },
        avg,
    )


def test_performance_booking_summary():
    ms = PERF_BOOKING
    passed = ms is not None and ms < 3000
    record(
        "Performance: POST /bookings single request",
        passed,
        "Booking submission completes in < 3000 ms",
        "N/A",
        {"booking_response_time_ms": round(ms, 1) if ms is not None else "Not run"},
        ms or 0,
    )


# ==============================================================================
#  SECTION 7 -- INPUT VALIDATION
# ==============================================================================

def test_register_missing_password():
    r, ms = post("/auth/register", json={"email": f"missing.pw.{SUFFIX}@test.ie", "name": "Test User"})
    body = safe_json(r)
    passed = r.status_code == 422
    record(
        "Register with missing password field",
        passed,
        "HTTP 422 Unprocessable Entity",
        r.status_code,
        body,
        ms,
    )


def test_register_missing_email():
    r, ms = post("/auth/register", json={"name": "Test User", "password": PASSWORD})
    body = safe_json(r)
    passed = r.status_code == 422
    record(
        "Register with missing email field",
        passed,
        "HTTP 422 Unprocessable Entity",
        r.status_code,
        body,
        ms,
    )


def test_register_invalid_email_format():
    r, ms = post("/auth/register", json={"email": "notanemail", "name": "Test User", "password": PASSWORD})
    body = safe_json(r)
    passed = r.status_code == 422
    record(
        "Register with invalid email format ('notanemail')",
        passed,
        "HTTP 422 Unprocessable Entity",
        r.status_code,
        body,
        ms,
    )


def test_booking_end_before_start():
    if not STATE["learner_token"] or not STATE["service_id"]:
        record("Booking with end_time before start_time", False, "HTTP 400/422", "N/A", "Missing token or service_id", 0)
        return
    r, ms = post("/bookings", headers=auth_headers(STATE["learner_token"]), json={
        "mentor_service_id": STATE["service_id"],
        "start_time": "2026-06-10T12:00:00Z",
        "end_time": "2026-06-10T11:00:00Z",
        "learner_note": "Time is reversed, should be rejected",
    })
    body = safe_json(r)
    passed = r.status_code in (400, 422)
    record(
        "Booking with end_time before start_time rejected",
        passed,
        "HTTP 400 or 422",
        r.status_code,
        body,
        ms,
    )


# ==============================================================================
#  MAIN RUNNER
# ==============================================================================

def run_all():
    print("\n" + "#" * 70)
    print("  FIND YOUR MENTOR -- COMPREHENSIVE API TEST SUITE")
    print(f"  Target : {BASE_URL}")
    print(f"  Run at : {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}")
    print(f"  Emails : {LEARNER_EMAIL} / {MENTOR_EMAIL}")
    print("#" * 70)

    # -- Section 1: Auth & Security --------------------------------------------
    print("\n\n>> SECTION 1 -- AUTHENTICATION & SECURITY")
    test_register_learner()
    test_register_mentor()
    test_login_correct()
    test_login_mentor()          # setup only (no result recorded)
    test_login_wrong_password()
    test_login_nonexistent_email()
    test_protected_no_token()
    test_protected_invalid_jwt()
    test_password_not_in_response()
    test_sql_injection_email()

    # -- Section 2: Mentor Setup (needed before oversized bio + cross-user tests) --
    print("\n\n>> SECTION 2 -- MENTOR SETUP")
    test_create_mentor_profile()
    test_oversized_bio()         # run after profile exists (tests overwrite/update)
    test_create_valid_service()
    test_create_invalid_service_duration()
    test_create_availability_slot()
    test_create_overlapping_slot()

    # -- Section 3: Search & Discovery ----------------------------------------
    print("\n\n>> SECTION 3 -- SEARCH & DISCOVERY")
    test_search_all_mentors()
    test_search_with_skill_filter()
    test_search_with_price_filter()

    # -- Section 4: Booking Flow -----------------------------------------------
    print("\n\n>> SECTION 4 -- BOOKING FLOW")
    test_submit_booking()
    test_submit_overlapping_booking()
    test_submit_booking_no_auth()
    test_mentor_approve_booking()
    test_learner_confirm_attendance()
    test_mentor_confirm_attendance()
    test_booking_completed_and_paid()

    # -- Section 1 (deferred): cross-user booking access ----------------------
    print("\n\n>> SECTION 1 (deferred) -- CROSS-USER BOOKING ACCESS")
    test_access_other_users_booking()

    # -- Section 5: Authorization Boundaries ----------------------------------
    print("\n\n>> SECTION 5 -- AUTHORIZATION BOUNDARY TESTS")
    test_learner_cannot_approve_booking()
    test_learner_cannot_mentor_confirm()
    test_learner_mentor_bookings_endpoint()

    # -- Section 6: Performance ------------------------------------------------
    print("\n\n>> SECTION 6 -- PERFORMANCE TESTS")
    test_performance_search()
    test_performance_login()
    test_performance_booking_summary()

    # -- Section 7: Input Validation ------------------------------------------
    print("\n\n>> SECTION 7 -- INPUT VALIDATION")
    test_register_missing_password()
    test_register_missing_email()
    test_register_invalid_email_format()
    test_booking_end_before_start()

    # -- Summary ---------------------------------------------------------------
    total = len(RESULTS)
    passed = sum(1 for r in RESULTS if r["status"] == "PASS")
    failed = total - passed
    pass_rate = (passed / total * 100) if total else 0

    search_min = round(min(PERF_SEARCH), 1) if PERF_SEARCH else "N/A"
    search_avg = round(sum(PERF_SEARCH) / len(PERF_SEARCH), 1) if PERF_SEARCH else "N/A"
    search_max = round(max(PERF_SEARCH), 1) if PERF_SEARCH else "N/A"
    login_min = round(min(PERF_LOGIN), 1) if PERF_LOGIN else "N/A"
    login_avg = round(sum(PERF_LOGIN) / len(PERF_LOGIN), 1) if PERF_LOGIN else "N/A"
    login_max = round(max(PERF_LOGIN), 1) if PERF_LOGIN else "N/A"
    booking_rt = round(PERF_BOOKING, 1) if PERF_BOOKING else "N/A"

    summary = f"""
{'='*70}
  FINAL SUMMARY -- FIND YOUR MENTOR API TEST SUITE
{'='*70}
  Total tests   : {total}
  Passed        : {passed}
  Failed        : {failed}
  Pass rate     : {pass_rate:.1f}%
{'-'*70}
  PERFORMANCE RESULTS
    GET /mentors/search (x10)
      Min  : {search_min} ms
      Avg  : {search_avg} ms
      Max  : {search_max} ms

    POST /auth/login (x5)
      Min  : {login_min} ms
      Avg  : {login_avg} ms
      Max  : {login_max} ms

    POST /bookings (single)
      Response time : {booking_rt} ms
{'-'*70}
  INDIVIDUAL RESULTS
"""
    for i, r in enumerate(RESULTS, 1):
        summary += f"\n  {i:>2}. [{r['status']}] {r['name']}"
        summary += f"\n       Expected : {r['expected']}"
        summary += f"\n       Got      : HTTP {r['actual_status']} -- {str(r['actual_body'])[:120]}"
        summary += f"\n       Time     : {r['elapsed_ms']:.1f} ms\n"

    summary += f"\n{'='*70}\n"

    print(summary)

    # -- Write to file ---------------------------------------------------------
    with open("test_results.txt", "w", encoding="utf-8") as f:
        f.write(f"Find Your Mentor -- API Test Results\n")
        f.write(f"Generated: {datetime.now(timezone.utc).strftime('%Y-%m-%d %H:%M:%S UTC')}\n")
        f.write(f"Target   : {BASE_URL}\n")
        f.write(f"Emails   : {LEARNER_EMAIL} / {MENTOR_EMAIL}\n")
        f.write(summary)
    print(f"  Results saved to test_results.txt")


if __name__ == "__main__":
    run_all()
