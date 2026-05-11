# Find Your Mentor

A mobile mentorship discovery and booking platform. Mentors create profiles and publish availability. Learners discover them through a personalised matching algorithm, book sub-slots inside those availability windows, and complete sessions through a dual-confirmation flow.

**Stack:** FastAPI · PostgreSQL · React Native (Expo) · TypeScript

---

## Repository Structure

```
find-your-mentor/
├── backend/          # FastAPI Python backend
│   ├── app/
│   │   ├── core/     # Config, security
│   │   ├── db/       # Database connection
│   │   ├── models/   # SQLAlchemy models
│   │   ├── routers/  # API endpoints
│   │   ├── schemas/  # Pydantic schemas
│   │   ├── services/ # Business logic
│   │   ├── main.py   # App entry point
│   │   └── seed.py   # Database seed script
│   ├── tests/        # pytest test suite (67 tests)
│   └── requirements.txt
├── frontend/         # React Native Expo app
│   ├── src/
│   ├── App.tsx
│   └── package.json
└── test_suite.py     # NFR performance test suite
```

---

## Prerequisites

Make sure you have the following installed:

- **Python** 3.10+
- **Node.js** 18+
- **PostgreSQL** 14+
- **Expo CLI** — `npm install -g expo-cli`
- **Git**

---

## Backend Setup

### 1. Clone the repository

```bash
git clone https://github.com/Justaz17/find-your-mentor.git
cd find-your-mentor/backend
```

### 2. Create a virtual environment

```bash
python -m venv venv
```

Activate it:

- **Windows:** `venv\Scripts\activate`
- **Mac/Linux:** `source venv/bin/activate`

### 3. Install dependencies

```bash
pip install -r requirements.txt
```

### 4. Create a PostgreSQL database

Open your PostgreSQL client and run:

```sql
CREATE DATABASE find_your_mentor;
```

### 5. Create the `.env` file

Create a file called `.env` in the `backend/` directory with the following content:

```env
DATABASE_URL=postgresql://YOUR_USERNAME:YOUR_PASSWORD@localhost:5432/find_your_mentor
SECRET_KEY=your-secret-key-change-this-in-production
ALGORITHM=HS256
ACCESS_TOKEN_EXPIRE_HOURS=168
```

Replace `YOUR_USERNAME` and `YOUR_PASSWORD` with your PostgreSQL credentials.

> **Note:** The app uses `Base.metadata.create_all()` on startup — all tables are created automatically. No migration tool required.

### 6. Run the backend

```bash
cd backend
uvicorn app.main:app --reload
```

The API will be available at `http://localhost:8000`

Interactive API docs (Swagger UI) are at `http://localhost:8000/docs`

### 7. Seed the database (optional but recommended)

To populate the database with sample mentors, learners, bookings and reviews for testing:

```bash
cd backend
python -m app.seed
```

This creates:
- 8 categories with 80+ skills
- 20 mentors with profiles, services and availability
- 10 learners with diverse profiles
- 40+ bookings in various states
- Reviews and ratings

---

## Frontend Setup

### 1. Install dependencies

```bash
cd frontend
npm install
```

### 2. Configure the API URL

Open `frontend/src/utils/constants.ts` and update the base URL:

```ts
const BASE_URL = 'http://YOUR_LOCAL_IP:8000';
```

> **Important:** Use your machine's local IP address (e.g. `192.168.1.x`), not `localhost`, when running on a physical device or Android emulator. You can find your IP with `ipconfig` (Windows) or `ifconfig` (Mac/Linux).

### 3. Start the app

```bash
cd frontend
npx expo start
```

This opens the Expo developer tools. From there:

- Press `a` to open on Android emulator
- Press `i` to open on iOS simulator
- Scan the QR code with the **Expo Go** app on a physical device

---

## Running Tests

### pytest suite (unit + integration)

```bash
cd backend
pytest --tb=short
```

Expected result: 64 passed, 1 failed (known finding — see below), 2 xfailed.

### NFR performance suite

Make sure the backend is running, then from the root directory:

```bash
python test_suite.py
```

Expected result: 36/36 passed, 100% pass rate.

---

## Known Issues

### `test_slot_in_past_rejected` — FAILED

The slot creation endpoint (`POST /availability/mentors/me/availability`) accepts availability slots with past dates. This is a documented finding — the **booking** endpoint correctly rejects past bookings, so no user-facing flow is broken. A past slot can be created but no learner can book it.

**Fix:** Add a Pydantic field validator to `AvailabilitySlotCreate` enforcing `start_time > datetime.now(timezone.utc)`.

---

## Environment Variables Reference

| Variable | Description | Default |
|---|---|---|
| `DATABASE_URL` | PostgreSQL connection string | Required |
| `SECRET_KEY` | JWT signing secret | `default-secret-key-change-in-production` |
| `ALGORITHM` | JWT algorithm | `HS256` |
| `ACCESS_TOKEN_EXPIRE_HOURS` | Access token lifetime in hours | `168` (7 days) |

---

## API Overview

Once running, the full API reference is available at `http://localhost:8000/docs`

Key endpoint groups:

| Prefix | Description |
|---|---|
| `/auth` | Registration, login, token refresh |
| `/mentors` | Mentor search, profiles, smart sort |
| `/availability` | Slot creation, overlap detection |
| `/bookings` | Submit, approve, confirm, cancel |
| `/reviews` | Submit and retrieve mentor reviews |
| `/services` | Mentor service creation and management |
| `/learners` | Learner profile management |

---

## Author

Justas Jokubauskas
BSc (Hons) Software Development  
Technological University of the Shannon: Midlands Midwest  
