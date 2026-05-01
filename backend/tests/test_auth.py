"""
test_auth.py - Authentication endpoint tests using equivalence partitioning
and boundary value analysis.

Equivalence classes identified:
  EC1  Valid registration data            → 201
  EC2  Duplicate email                   → 400
  EC3  Missing required field            → 422
  EC4  Invalid email format              → 422
  EC5  Valid login                       → 200 + JWT
  EC6  Wrong credentials                 → 401
  EC7  Password boundary values          → accept or reject per policy

Boundary values on email format:
  BV1  Minimum valid:   a@b.ie
  BV2  No local part:   @test.com          (invalid)
  BV3  Special chars:   name+tag@test.ie   (valid per RFC 5321)

Boundary values on password length:
  BV4  Empty string ""  (length = 0)
  BV5  Single char "X"  (length = 1)
"""

import pytest
import requests
import random
import string
from jose import jwt as jose_jwt

BASE_URL = "http://192.168.1.17:8000"


# ---------------------------------------------------------------------------
# Helpers
# ---------------------------------------------------------------------------


def unique_email(prefix: str = "user") -> str:
    suffix = "".join(random.choices(string.ascii_lowercase + string.digits, k=8))
    return f"{prefix}.{suffix}@test.ie"


def register(session, email, name, password, role="learner"):
    return session.post(
        f"{BASE_URL}/auth/register",
        json={
            "email": email,
            "name": name,
            "password": password,
            "role": role,
        },
    )


def login(session, email, password):
    return session.post(
        f"{BASE_URL}/auth/login",
        json={
            "email": email,
            "password": password,
        },
    )


# ---------------------------------------------------------------------------
# EC1 - Valid registration
# ---------------------------------------------------------------------------


class TestValidRegistration:

    def test_valid_learner_registration(self, session):
        """
        EC1: A well-formed learner registration with all required fields must
        return HTTP 201 and a UserOut body that includes id, email, name, and role.
        Password must NOT appear in the response (security requirement).
        """
        email = unique_email("seamus")
        resp = register(session, email, "Seamus O'Brien", "ValidPass123!", "learner")

        assert resp.status_code == 201
        body = resp.json()
        assert body["email"] == email
        assert body["name"] == "Seamus O'Brien"
        assert body["role"] == "learner"
        assert "id" in body
        assert "password" not in body
        assert "password_hash" not in body

    def test_valid_mentor_registration(self, session):
        """
        EC1: A well-formed mentor registration must return HTTP 201 with
        role='mentor'. Confirms role is stored and echoed correctly.
        """
        email = unique_email("niamh")
        resp = register(session, email, "Niamh Gallagher", "MentorPass123!", "mentor")

        assert resp.status_code == 201
        body = resp.json()
        assert body["email"] == email
        assert body["role"] == "mentor"

    def test_valid_email_with_plus_tag_accepted(self, session):
        """
        BV3: RFC 5321 permits '+' tags in the local part (e.g. user+tag@domain).
        The API must accept this as a valid email address.
        Used for testing/aliasing in real-world Irish academic contexts.
        """
        email = f"padraig.o.flaithearta+mentor001@test.ie"
        # Use a random suffix in name to avoid duplicate email if test reruns
        suffix = "".join(random.choices(string.digits, k=5))
        email = f"padraig.test+tag{suffix}@test.ie"
        resp = register(session, email, "Padraig O'Flaithearta", "TestPass123!")

        assert (
            resp.status_code == 201
        ), f"Valid RFC 5321 email with plus-tag should be accepted. Got {resp.status_code}: {resp.text}"


# ---------------------------------------------------------------------------
# EC2 - Duplicate email
# ---------------------------------------------------------------------------


class TestDuplicateEmail:

    def test_duplicate_email_rejected(self, session):
        """
        EC2: Registering a second account with the same email address must be
        rejected with HTTP 400. This prevents account enumeration collisions
        and duplicate identity issues in the platform.
        """
        email = unique_email("duplicate")
        register(session, email, "First User", "Pass123!", "learner")
        resp = register(session, email, "Second User", "Pass123!", "learner")

        assert resp.status_code == 400
        assert "already" in resp.json().get("detail", "").lower()


# ---------------------------------------------------------------------------
# EC3 - Missing required fields
# ---------------------------------------------------------------------------


class TestMissingFields:

    def test_missing_password_returns_422(self, session):
        """
        EC3/BVA: Omitting the 'password' field entirely must trigger Pydantic's
        field validation and return HTTP 422 with a 'missing' error type.
        This confirms server-side schema enforcement - the frontend cannot bypass it.
        """
        resp = session.post(
            f"{BASE_URL}/auth/register",
            json={
                "email": unique_email("nopw"),
                "name": "Oisin Murphy",
            },
        )
        assert resp.status_code == 422
        errors = resp.json()["detail"]
        fields = [e["loc"][-1] for e in errors]
        assert "password" in fields

    def test_missing_email_returns_422(self, session):
        """
        EC3: Omitting the 'email' field must return HTTP 422.
        Email is the primary identifier for authentication; missing it
        must always be caught at the schema layer.
        """
        resp = session.post(
            f"{BASE_URL}/auth/register",
            json={
                "name": "Brid Ni Dhomhnaill",
                "password": "TestPass123!",
            },
        )
        assert resp.status_code == 422
        errors = resp.json()["detail"]
        fields = [e["loc"][-1] for e in errors]
        assert "email" in fields

    def test_missing_name_returns_422(self, session):
        """
        EC3: Omitting the 'name' field must return HTTP 422.
        Name is displayed throughout the platform; it must be required at
        registration time rather than left as null.
        """
        resp = session.post(
            f"{BASE_URL}/auth/register",
            json={
                "email": unique_email("noname"),
                "password": "TestPass123!",
            },
        )
        assert resp.status_code == 422
        errors = resp.json()["detail"]
        fields = [e["loc"][-1] for e in errors]
        assert "name" in fields


# ---------------------------------------------------------------------------
# EC4 - Invalid email format
# ---------------------------------------------------------------------------


class TestInvalidEmailFormat:

    def test_invalid_email_no_at_symbol(self, session):
        """
        EC4: A string with no '@' symbol (e.g. 'notanemail') is not a valid
        email address. Pydantic's EmailStr validator must reject it with 422.
        This is an equivalence class representative for completely malformed emails.
        """
        resp = register(session, "notanemail", "Sorcha Ryan", "Pass123!")
        assert resp.status_code == 422
        detail = str(resp.json().get("detail", ""))
        assert "@" in detail or "email" in detail.lower()

    def test_invalid_email_no_local_part(self, session):
        """
        BV2 (boundary): '@test.com' has no local part before the @-sign.
        This is an RFC 5322 boundary case - the minimum valid address must
        have at least one character before the @. Must be rejected with 422.
        """
        resp = register(session, "@test.com", "Conor Walsh", "Pass123!")
        assert resp.status_code == 422

    def test_invalid_email_no_domain(self, session):
        """
        EC4: 'user@' has no domain part after the @-sign. Represents the
        boundary between valid and invalid on the right side of the address.
        Must be rejected with 422.
        """
        resp = register(session, "user@", "Deirdre Foley", "Pass123!")
        assert resp.status_code == 422


# ---------------------------------------------------------------------------
# EC5 - Valid login
# ---------------------------------------------------------------------------


class TestValidLogin:

    def test_login_returns_access_token(self, session):
        """
        EC5: Logging in with correct credentials must return HTTP 200 with
        an 'access_token' string and 'token_type' of 'bearer'. This token
        is used for all authenticated requests in the platform.
        """
        email = unique_email("login")
        register(session, email, "Fionnuala Daly", "LoginPass123!")
        resp = login(session, email, "LoginPass123!")

        assert resp.status_code == 200
        body = resp.json()
        assert "access_token" in body
        assert body["token_type"] == "bearer"
        assert len(body["access_token"]) > 20

    def test_login_token_contains_expected_claims(self, session):
        """
        EC5: The JWT returned on login must contain the expected claims:
        'sub' (email), 'name', 'role', 'user_id', and 'exp'.
        These are used by the frontend and by the server's get_current_user
        dependency to identify and authorise the caller.
        Note: decoded without verification (claims inspection only).
        """
        email = unique_email("claims")
        reg = register(session, email, "Eithne MacDonagh", "ClaimsPass123!", "mentor")
        user_id = reg.json()["id"]

        resp = login(session, email, "ClaimsPass123!")
        assert resp.status_code == 200
        token = resp.json()["access_token"]

        # Decode WITHOUT verifying signature - we are inspecting claims only
        payload = jose_jwt.get_unverified_claims(token)

        assert payload["sub"] == email
        assert payload["name"] == "Eithne MacDonagh"
        assert payload["role"] == "mentor"
        assert payload["user_id"] == user_id
        assert "exp" in payload


# ---------------------------------------------------------------------------
# EC6 - Wrong credentials
# ---------------------------------------------------------------------------


class TestWrongCredentials:

    def test_wrong_password_rejected_with_401(self, session):
        """
        EC6: A correct email combined with the wrong password must return 401.
        The error message must NOT reveal whether the email exists (to prevent
        user enumeration). A generic 'Invalid email or password' message is correct.
        """
        email = unique_email("wrongpw")
        register(session, email, "Tomás Ó Murchú", "CorrectPass123!")
        resp = login(session, email, "WrongPassword999!")

        assert resp.status_code == 401
        assert "invalid" in resp.json().get("detail", "").lower()

    def test_nonexistent_email_rejected_with_401(self, session):
        """
        EC6: Attempting to log in with an email that was never registered must
        return 401 - not 404. Returning 404 would confirm the email does NOT
        exist, enabling account enumeration. The generic 401 protects privacy.
        """
        resp = login(session, "nobody.ever.registered@test.ie", "AnyPass123!")
        assert resp.status_code == 401

    def test_empty_password_api_behaviour(self, session):
        """
        BV4 (boundary): Submitting an empty string as the password exercises
        the lower boundary of password length. This test documents the API's
        actual behaviour - whether it accepts or rejects empty passwords.
        Security best practice mandates rejection (minimum length enforcement).
        Failure here is a documented finding, not a test error.
        """
        email = unique_email("emptypw")
        resp = register(session, email, "Roisin Nic Fhionnlaoich", "")

        # Document actual behaviour; ideal is 422 (validation error)
        # If the API accepts it (201), this constitutes a security finding
        is_rejected = resp.status_code == 422
        is_accepted = resp.status_code == 201
        assert (
            is_rejected or is_accepted
        ), f"Unexpected status {resp.status_code} for empty password registration"
        # Flag acceptance as a finding for the dissertation
        if is_accepted:
            pytest.xfail(
                "API accepted an empty password - minimum password length validation "
                "is not enforced. Security finding: add min_length=8 to password field."
            )

    def test_single_character_password_boundary(self, session):
        """
        BV5 (boundary): A one-character password (length = 1) is the minimum
        non-empty input. Security standards (NIST SP 800-63B) recommend at least
        8 characters. This test checks whether the API enforces a minimum length.
        Failure (API accepts it) is a documented security finding.
        """
        email = unique_email("onecharpw")
        resp = register(session, email, "Ciaran Mac Giolla Chriost", "X")

        is_rejected = resp.status_code == 422
        is_accepted = resp.status_code == 201
        assert (
            is_rejected or is_accepted
        ), f"Unexpected status {resp.status_code} for single-char password"
        if is_accepted:
            pytest.xfail(
                "API accepted a 1-character password - minimum password length "
                "validation is not enforced. Security finding."
            )
