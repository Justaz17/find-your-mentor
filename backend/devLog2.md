---

## Dev Log Entry 1: Data Model Expansion

### What Was Built

Three new database models were introduced:

- `MentorService`
- `Booking`
- `MentorResource`

Existing model relationships were also updated to support a complete mentoring session workflow.

---

### Why This Was Implemented

The literature review identified that effective mentoring platforms require:

- structured service offerings
- clear booking workflows
- contextual preparation before sessions

The original system design only supported:

- mentor profiles
- manual availability slots

The expanded model enables:

- mentors to define multiple services with pricing and duration
- learners to book sessions and provide contextual notes
- mentors to share learning resources

This supports the **personalised one to one mentoring model** identified as most effective in the literature review.

---

### Technical Decisions

**MentorService Model**

`MentorService` was separated from `MentorProfile`.

This allows mentors to define multiple services such as:

- Free intro call (30 minutes)
- Code review (60 minutes, €40)
- Career mentoring (90 minutes)

This design supports flexible mentoring session structures.

---

**Booking Model**

The `Booking` model includes a field:

```
learner_note
```

This allows learners to provide context before a session.

Example uses:

- code to review
- questions to prepare
- project context

This supports preparation driven mentoring sessions.

---

**MentorResource Model**

The `MentorResource` model uses a **type discriminator**.

Supported types include:

- video
- link
- note

All resources use a single content field instead of separate tables.

Example content:

- YouTube introduction videos
- external documentation links
- text based mentor notes

This design keeps the database schema simple while supporting multiple content formats.

---

**Payment Tracking Design**

Payment tracking uses **mock status fields** designed for easy replacement with a real payment provider such as Stripe.

Example statuses include:

- pending
- paid
- refunded

This allows the architecture to remain compatible with future payment integrations.

---

### Challenges

**Circular Import Dependencies**

Adding several related models created circular import issues.

Example:

- `Booking` references `MentorService`
- `MentorService` references `MentorProfile`

**Solution**

Two strategies were used:

1. Correct model import ordering inside `__init__.py`
2. Use of **string based relationship references** in SQLAlchemy

Example:

```python
relationship("MentorService")
```

instead of direct class imports.

This resolved dependency conflicts during application startup.

---

### Outcome

The data model now supports:

- mentor services
- structured bookings
- contextual learner notes
- mentor resource sharing

This created the foundation required for implementing the booking system and mentoring workflow.

---

## Dev Log Entry 2: Booking System and Resource Sharing API

### What Was Built

A complete REST API layer was implemented to support:

- mentor services
- session bookings
- mentor resources

Three new routers were created with full CRUD functionality.

Routers implemented:

- `services_router`
- `bookings_router`
- `resources_router`

Each router includes validation logic and ownership checks.

---

### Why This Was Implemented

The design chapter specifies a **Fresha inspired booking flow**.

The intended user flow is:

1. Learner selects a mentor
2. Learner chooses a service
3. Learner selects a time slot
4. Learner confirms the booking

The API layer implements this workflow.

Security and trust requirements from the requirements analysis were also implemented.

These include:

- ownership verification for all write operations
- reviews only allowed after completed bookings
- cancellation policies protecting mentor time

These mechanisms support the **trust and accountability principles** identified in the literature review.

---

### Technical Decisions

**Cancellation Policy Logic**

A three tier cancellation system was implemented.

| Time Before Session | Refund |
|------|------|
| More than 24 hours | 100 percent refund |
| 2 to 24 hours | 70 percent refund |
| Less than 2 hours | No refund |

Refund eligibility is calculated using **server side UTC timestamps**.

This prevents client side manipulation of booking times.

---

**Review Access Control**

Review creation requires verification of a completed booking.

This is enforced using a join query across three models:

```
Booking -> MentorService -> MentorProfile
```

Only users with a valid completed booking can leave a review.

This prevents fake reviews and protects platform trust.

---

**Resource Visibility Logic**

Mentor resources support two visibility levels.

| Visibility | Access |
|------|------|
| Public | Visible to all users |
| Private | Only visible to learners with a booking |

Access to private resources is verified using a booking relationship query.

This allows mentors to share resources exclusively with their learners.

---

**Platform Abuse Protection**

To prevent excessive resource creation or spam:

- mentors are limited to **10 services**
- mentors are limited to **20 resources**

These limits were implemented at the API validation layer.

---

### Challenges

**Datetime and Timezone Handling**

The graduated cancellation refund system required precise time comparisons.

Potential issues included:

- timezone offsets
- daylight saving transitions
- client local time manipulation

**Solution**

All time calculations use:

- UTC timestamps
- timezone aware datetime objects

This ensures consistent behaviour regardless of client location.

---

### Outcome

The backend now supports:

- mentor service creation
- learner session booking
- booking management
- mentor resource sharing
- controlled review creation
- cancellation policy enforcement

These features implement the complete mentoring session workflow defined in the system design.