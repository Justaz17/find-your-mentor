# Find Your Mentor - Development Log

## Final Year Project

| Item | Details |
|-----|-----|
| Student | Justas (K00286090) |
| Project | Find Your Mentor |
| Tech Stack | FastAPI (Python), PostgreSQL, React Native (Expo) |
| Development Period | January to March 2026 |

---

# Purpose of This Document

This log records how the backend system was built step by step.

It documents:

- Features implemented
- Technical decisions
- Errors encountered
- Solutions applied
- Code structure changes

The goal is to demonstrate the **iterative development process** used to build the system for the Implementation chapter.

---

# Project Progress Overview

| Phase | Area | Status |
|------|------|------|
| Phase 1 | Backend and Database Setup | Complete |
| Phase 2 | Authentication System | Complete |
| Phase 3 | Mentor Profiles | Complete |
| Phase 4 | Availability Slots | Planned |
| Phase 5 | Booking System | Planned |
| Phase 6 | Messaging System | Planned |

---

# Phase 1: Backend Foundation

Goal: Create the backend infrastructure and connect the application to PostgreSQL.

---

## Feature 1.1: PostgreSQL Database Connection

### Goal

Connect FastAPI to PostgreSQL and confirm that the backend can communicate with the database.

### Implementation Steps

1. Installed PostgreSQL 16 locally
2. Created a database called `findyourmentor` using pgAdmin
3. Installed the Python dependency:
psycopg2-binary


4. Created a simple Python script to test database connectivity.

### Files Created
test_postgres.py

Temporary file used to verify connectivity. Deleted after testing.

### Technical Decision

PostgreSQL was chosen instead of MySQL because:

- Strong relational integrity
- Industry standard for production backends
- Matches the database design described in the Design chapter

### Outcome

The backend successfully connected to PostgreSQL.  
The `findyourmentor` database was visible and accessible in pgAdmin.

---

## Feature 1.2: SQLAlchemy Database Layer

### Goal

Create an ORM layer to manage database interactions in Python.

### Implementation Steps

1. Installed dependencies:
sqlalchemy
alembic


2. Created database configuration and session management.
3. Implemented the User model.
4. Configured automatic table creation.
5. Structured the project into Python modules.

### Files Created
app/db/database.py

Contains:

- SQLAlchemy engine
- SessionLocal
- Base model
- get_db dependency
app/models/user.py


Defines the `User` table.

app/models/init.py

Imports all models.

Additional module files:
app/init.py
app/db/init.py
app/routers/init.py
app/schemas/init.py



### Technical Decisions

**SQLAlchemy ORM**

Chosen because:

- Standard ORM for Python backends
- Declarative model structure
- Simplifies database operations

**Password Security**

Passwords are stored as:
password_hash


Plain text passwords are never stored in the database.

### Errors Encountered

#### Import Error

**Problem**

SQLAlchemy did not detect the models.

**Cause**

Models were not imported before `create_all()`.

**Fix**

Added:

```python
from app.models import user
```
in main.py.

### Error 2: Missing `__init__.py` Files

**Problem:**  
Python could not treat the folders as importable packages.

**Cause:**  
The project folders were missing `__init__.py` files, so Python did not recognise them as modules.

**Fix:**  
Created empty `__init__.py` files in all relevant directories:

- `app/__init__.py`
- `app/db/__init__.py`
- `app/routers/__init__.py`
- `app/schemas/__init__.py`
- `app/models/__init__.py`

**Outcome:**  
Python package imports worked correctly, and the project structure became valid for modular FastAPI development.

---

**Outcome of Feature 1.2:**  
The `users` table was successfully created in PostgreSQL and verified in pgAdmin.

---

## Phase 2: User Authentication

**Goal:** Implement user registration, login, and secure authentication.

---

### Feature 2.1: Pydantic Schemas (DTOs)

**Goal:** Define input and output contracts for API endpoints.

#### Steps Taken

1. Installed dependency: `email-validator`
2. Created `app/schemas/user.py` with `UserCreate` and `UserOut` models
3. Added a `Config` class with `from_attributes = True` to support SQLAlchemy to Pydantic conversion

#### Files Created

- `app/schemas/user.py`  
  Contains:
  - `UserCreate`
  - `UserOut`

- `app/schemas/__init__.py`  
  Imports schema modules

#### Technical Decisions

- Separated **input** and **output** schemas:
  - `UserCreate` for incoming registration data
  - `UserOut` for returned user data
- This ensured that `password_hash` would never be exposed in API responses
- Used Pydantic's `EmailStr` to validate email addresses automatically

#### Errors Faced

##### Error 1: Pydantic ORM Serialization Issue

**Problem:**  
Pydantic could not serialize SQLAlchemy model instances correctly.

**Cause:**  
Pydantic v2 changed the old `orm_mode = True` syntax used in v1.

**Fix:**

```python
class Config:
    from_attributes = True
```

**Outcome:**  
Schemas worked correctly for validation and response serialization.

---

### Feature 2.2: User Registration Endpoint

**Goal:** Allow users to register and save their account details to the database.

#### Steps Taken

1. Created `app/routers/auth.py` with a registration endpoint
2. Added a duplicate email check before user creation
3. Used SHA256 to hash passwords temporarily
4. Connected the router in `main.py` using `app.include_router(auth.router)`
5. Tested the endpoint through Swagger UI at `/docs`

#### Files Created

```
app/routers/auth.py
```

Contains the registration endpoint.

#### Technical Decisions

**Response Model**

```
response_model=UserOut
```

This automatically excludes `password_hash` from the response.

**HTTP Status Codes**

| Status | Meaning |
|------|------|
| 201 | User created successfully |
| 400 | Email already exists |

**Password Hashing**

SHA256 was used temporarily for MVP implementation.  
This will be replaced with bcrypt later for stronger security.

#### Errors Faced

##### Swagger Parameter Issue

**Problem:**  
Swagger displayed the request body incorrectly.

**Cause:**  
The function signature confused FastAPI's request inference.

**Fix:**

```python
def register(user: UserCreate, ...)
```

Using a simpler parameter name resolved the Swagger schema issue.

---

##### Python Indentation Error

**Problem:**  
The Pydantic configuration block was not nested correctly.

**Fix:**  
Corrected indentation so `class Config:` was properly inside `UserOut`.

---

##### Internal Server Error

**Problem:**  
Returning a SQLAlchemy model caused a serialization failure.

**Cause:**  
Pydantic could not convert the ORM model automatically.

**Fix:**  
Enabled ORM serialization using:

```python
class Config:
    from_attributes = True
```

**Outcome**

- User registration works successfully
- Users are stored in PostgreSQL
- Endpoint verified using Swagger UI
- Data confirmed in pgAdmin

---

### Feature 2.3: User Login with JWT Tokens

**Goal:** Authenticate users and return a JWT token for session management.

#### Steps Taken

1. Installed dependencies:

```
python-jose[cryptography]
passlib[bcrypt]
```

2. Added `UserLogin` and `Token` schemas
3. Implemented the login endpoint
4. Generated JWT tokens with user email in the payload
5. Set token expiry to 24 hours
6. Validated tokens using jwt.io

#### Files Modified

```
app/schemas/user.py
app/routers/auth.py
```

#### Technical Decisions

**JWT Authentication**

Chosen because it is:

- Stateless
- Scalable
- Suitable for mobile applications

**JWT Payload Structure**

- `sub` field stores the user email
- Expiry set to 24 hours
- HS256 signing algorithm used

#### Errors Faced

##### Missing Module

**Problem:**  
`jose` module could not be imported.

**Cause:**  
The dependency was not installed in the correct Python environment.

**Fix:**

```
python -m pip install python-jose[cryptography]
```

---

##### Import Error

Incorrect class name was used.

Correct import:

```python
from fastapi.security.http import HTTPAuthorizationCredentials
```

**Outcome:**  
Users can log in successfully and receive valid JWT tokens.

---

### Feature 2.4: Protected Endpoints

**Goal:** Restrict certain API routes to authenticated users.

#### Steps Taken

1. Created authentication dependency
2. Implemented JWT validation
3. Retrieved user from the database based on token payload
4. Created a protected endpoint example
5. Tested authorization using Swagger's **Authorize** button
6. Confirmed `401 Unauthorized` responses for invalid tokens

#### Files Created

```
app/core/security.py
app/routers/mentors.py
```

#### Files Modified

```
app/main.py
```

Router inclusion:

```python
app.include_router(mentors.router)
```

#### Technical Decisions

Authentication dependency used:

```python
Depends(get_current_user)
```

Benefits:

- Reusable security logic
- Clean endpoint definitions

**HTTP Status Codes**

| Code | Meaning |
|------|------|
| 401 | Unauthorized |

#### Errors Faced

##### Router Not Visible

**Problem:**  
Protected endpoint did not appear in Swagger UI.

**Cause:**  
The mentors router was not included correctly.

**Fix:**

```python
app.include_router(mentors.router)
```

**Outcome**

- Authentication system fully functional
- Protected endpoints now require valid JWT tokens

---

## Summary of Completed Features

### Database Layer

- PostgreSQL connection
- SQLAlchemy ORM setup
- User model with password hashing

### Authentication System

- User registration with validation
- User login with JWT tokens
- Protected endpoint authorization
- Reusable security dependency