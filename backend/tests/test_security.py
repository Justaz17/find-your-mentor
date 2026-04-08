"""
test_security.py — Security and authorisation tests.

Testing strategy: white-box thinking, black-box execution.
The internal code is read to understand which attack vectors are relevant,
but tests are executed entirely through the HTTP API — no direct DB access.

Threat model areas covered:
  1. Authentication token integrity (tampered / expired / absent)
  2. Injection attacks (SQLi, XSS)
  3. Input overflow (resource exhaustion via oversized payloads)
  4. Broken object-level authorisation (BOLA / IDOR)
  5. Broken function-level authorisation (privilege escalation)
"""

import pytest
import requests
import random
import string
from datetime import datetime, timedelta, timezone
from jose import jwt as jose_jwt

BASE_URL = "http://192.168.1.17:8000"

# Read from .env — used only to craft an expired (but validly signed) token
# for the expiry test. Never used for normal auth.
_SECRET_KEY = "qru2983ehqwnkdiqugwe71282egdbqhasxhgcsuvyiguhoi"
_ALGORITHM   = "HS256"


def unique_email(prefix="sec"):
    s = "".join(random.choices(string.ascii_lowercase + string.digits, k=8))
    return f"{prefix}.{s}@test.ie"


def make_expired_token(email: str) -> str:
    """
    Craft a JWT signed with the real SECRET_KEY but with an expiry timestamp
    30 minutes in the past. The server's jose.jwt.decode() call will raise
    ExpiredSignatureError (a JWTError subclass) → 401.
    """
    payload = {
        "sub": email,
        "name": "Test User",
        "role": "learner",
        "user_id": 9999,
        "exp": datetime.now(timezone.utc) - timedelta(minutes=30),
    }
    return jose_jwt.encode(payload, _SECRET_KEY, algorithm=_ALGORITHM)


# ---------------------------------------------------------------------------
# 1. Token integrity
# ---------------------------------------------------------------------------

class TestTokenIntegrity:

    def test_no_token_returns_401(self, session):
        """
        A request to a protected endpoint with no Authorization header must
        return 401. This verifies the HTTPBearer dependency is configured
        correctly and that endpoints are not accidentally left open.
        """
        resp = session.get(f"{BASE_URL}/mentors/me")
        assert resp.status_code == 401
        assert resp.json()["detail"] == "Authentication required"

    def test_tampered_token_returns_401(self, session):
        """
        A JWT whose signature has been replaced with garbage characters
        must be rejected with 401. This confirms jose.jwt.decode() raises
        JWTError on signature mismatch and that the exception is caught.
        """
        bad_token = (
            "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9"  # header (HS256)
            ".eyJzdWIiOiJhdHRhY2tlckB0ZXN0LmllIiwibmFtZSI6IkhhY2tlciIsInJvbGUiOiJhZG1pbiIsInVzZXJfaWQiOjEsImV4cCI6OTk5OTk5OTk5OX0"  # payload
            ".INVALID_SIGNATURE_ABCDEF1234567890"  # wrong signature
        )
        resp = session.get(
            f"{BASE_URL}/mentors/me",
            headers={"Authorization": f"Bearer {bad_token}"},
        )
        assert resp.status_code == 401
        assert "invalid" in resp.json().get("detail", "").lower()

    def test_expired_token_returns_401(self, session):
        """
        A JWT signed with the real secret key but an expiry time 30 minutes
        in the past must be rejected with 401. This tests that python-jose's
        signature expiry check is active and not disabled in production config.
        """
        # We need a valid email that exists in the DB to get past the user lookup
        # — register one, then craft a token with its email but past expiry
        email = unique_email("expired")
        session.post(f"{BASE_URL}/auth/register", json={
            "email": email, "name": "Expired User", "password": "ExpiredPass123!",
        })
        expired_token = make_expired_token(email)

        resp = session.get(
            f"{BASE_URL}/mentors/me",
            headers={"Authorization": f"Bearer {expired_token}"},
        )
        assert resp.status_code == 401, (
            "An expired JWT must be rejected. If this fails, token expiry "
            "validation may be disabled."
        )


# ---------------------------------------------------------------------------
# 2. Injection attacks
# ---------------------------------------------------------------------------

class TestInjectionAttacks:

    def test_sql_injection_in_email_login_handled_safely(self, session):
        """
        SQL injection attempt via the email field of /auth/login.
        The payload "admin'--@test.com" is a classic comment-injection pattern
        designed to truncate a WHERE clause. SQLAlchemy's parameterised queries
        neutralise this — the server must return 401 (no match) and NOT 500.
        A 500 would indicate the raw SQL was executed.
        """
        malicious_email = "admin'--@test.com"
        resp = session.post(f"{BASE_URL}/auth/login", json={
            "email": malicious_email,
            "password": "anypassword",
        })
        # 422 = Pydantic rejects it before hitting the DB (acceptable)
        # 401 = DB query ran safely, found no user
        # 500 = SQL injection succeeded — FAIL
        assert resp.status_code in (401, 422), (
            f"SQL injection not handled safely. Got {resp.status_code}: {resp.text}"
        )
        assert resp.status_code != 500

    def test_xss_in_bio_field_stored_safely(self, session, registered_mentor):
        """
        XSS attempt in the mentor bio field. A REST API must store the string
        as plain text and return it unchanged. It must NOT execute it, and it
        must NOT return a 500 (which would indicate unhandled character errors).

        The absence of HTML sanitisation in a JSON API is correct — sanitisation
        is the responsibility of the frontend renderer (React's JSX escapes by default).
        """
        xss_payload = "<script>alert('xss_attack')</script><img src=x onerror=alert(1)>"
        resp = session.post(
            f"{BASE_URL}/mentors/me/profile",
            headers=registered_mentor["headers"],
            json={
                "bio": xss_payload,
                "hourly_rate": 45.0,
                "is_visible": True,
                "skills": ["Python"],
            },
        )
        assert resp.status_code in (200, 201), (
            f"XSS payload caused server error: {resp.status_code} {resp.text}"
        )
        # The stored bio should match exactly — not be stripped or executed
        stored_bio = resp.json().get("bio", "")
        assert stored_bio == xss_payload, (
            "Bio content was mutated server-side. Expected raw storage."
        )

    def test_oversized_bio_handled_without_500(self, session, registered_mentor):
        """
        Resource exhaustion via a 10,000-character bio string. The server must
        handle this without crashing (500). Acceptable responses are:
          201/200 — accepted and stored (acceptable if DB column supports it)
          422     — rejected by a max_length validator
        A 500 would indicate an unhandled exception — e.g., a DB column overflow.
        """
        big_bio = "A" * 10_000
        resp = session.post(
            f"{BASE_URL}/mentors/me/profile",
            headers=registered_mentor["headers"],
            json={
                "bio": big_bio,
                "hourly_rate": 45.0,
                "is_visible": True,
                "skills": ["Python"],
            },
        )
        assert resp.status_code != 500, (
            f"10,000-character bio caused a 500 Internal Server Error. "
            "The server must handle oversized input gracefully."
        )
        assert resp.status_code in (200, 201, 413, 422)


# ---------------------------------------------------------------------------
# 3. Broken object-level authorisation (BOLA / IDOR)
# ---------------------------------------------------------------------------

class TestBOLA:

    def test_learner_cannot_approve_another_users_booking(
        self, session, confirmed_booking
    ):
        """
        BOLA: After a booking is confirmed, the learner who made it must not
        be able to call the /approve endpoint on it (that is the mentor's action).
        The check in bookings.py is:
            if booking.mentor_service.mentor_profile.user_id != current_user.id: 403

        This prevents a learner from spoofing approval of their own pending booking
        to bypass the mentor gate-keeping step.
        """
        booking_id = confirmed_booking["booking_id"]
        learner_headers = confirmed_booking["learner"]["headers"]

        resp = session.post(
            f"{BASE_URL}/bookings/{booking_id}/approve",
            headers=learner_headers,
        )
        # 400 is also acceptable (booking is already confirmed, so "cannot approve")
        # but the auth check fires first → 403
        assert resp.status_code in (403, 400), (
            f"Learner was able to call /approve on a booking. Got {resp.status_code}: {resp.text}"
        )

    def test_user_cannot_confirm_another_users_mentor_attendance(
        self, session, confirmed_booking
    ):
        """
        BOLA: The /mentor-confirm endpoint must be callable only by the mentor
        whose service was booked. The learner must receive 403.
        Code path: 'if booking.mentor_service.mentor_profile.user_id != current_user.id: 403'
        """
        booking_id = confirmed_booking["booking_id"]
        learner_headers = confirmed_booking["learner"]["headers"]

        resp = session.post(
            f"{BASE_URL}/bookings/{booking_id}/mentor-confirm",
            headers=learner_headers,
        )
        assert resp.status_code == 403, (
            f"Learner should not be able to call /mentor-confirm. Got {resp.status_code}"
        )

    def test_mentor_cannot_confirm_another_users_learner_attendance(
        self, session, confirmed_booking
    ):
        """
        BOLA: The /learner-confirm endpoint must be callable only by the learner
        who made the booking. The mentor must receive 403.
        Code path: 'if booking.learner_id != current_user.id: 403'
        """
        booking_id = confirmed_booking["booking_id"]
        mentor_headers = confirmed_booking["mentor"]["headers"]

        resp = session.post(
            f"{BASE_URL}/bookings/{booking_id}/learner-confirm",
            headers=mentor_headers,
        )
        assert resp.status_code == 403, (
            f"Mentor should not be able to call /learner-confirm. Got {resp.status_code}"
        )


# ---------------------------------------------------------------------------
# 4. Broken function-level authorisation
# ---------------------------------------------------------------------------

class TestFunctionLevelAuth:

    def test_learner_accessing_mentor_bookings_endpoint(
        self, session, registered_learner
    ):
        """
        Function-level authorisation: GET /bookings/mentor/me is semantically
        a mentor-only endpoint. A learner has no mentor services, so the query
        returns zero results. The endpoint does not enforce role-based access
        control — it relies on the empty query result as an implicit guard.

        This test documents the actual behaviour. The ideal response would be
        403 (explicit role enforcement). An empty list is acceptable but weaker.
        """
        resp = session.get(
            f"{BASE_URL}/bookings/mentor/me",
            headers=registered_learner["headers"],
        )
        assert resp.status_code in (200, 403), (
            f"Unexpected status {resp.status_code}"
        )
        if resp.status_code == 200:
            body = resp.json()
            assert isinstance(body, list), "Should return a list"
            # Learner has no mentor services — list must be empty
            assert len(body) == 0, (
                "Learner should see zero mentor bookings. "
                "Non-empty list would be an authorisation leak."
            )

    def test_unauthenticated_access_to_profile_endpoint_rejected(self, session):
        """
        Function-level authorisation: /mentors/me is a protected endpoint.
        Accessing it without a token must return 401, not a partial response
        or a 200 with null data.
        """
        resp = session.get(f"{BASE_URL}/mentors/me")
        assert resp.status_code == 401

    def test_unauthenticated_booking_creation_rejected(self, session):
        """
        Function-level authorisation: POST /bookings requires authentication.
        An unauthenticated request must return 401 and must NOT create any
        booking records in the database.
        """
        resp = session.post(f"{BASE_URL}/bookings", json={
            "mentor_service_id": 1,
            "start_time": "2027-06-10T10:00:00Z",
            "end_time": "2027-06-10T11:00:00Z",
        })
        assert resp.status_code == 401
