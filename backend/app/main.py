from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from app.db.database import engine, Base
from app.routers import (
    auth,
    mentors,
    availability,
    recurring,
    reviews,
    services,
    bookings,
    resources,
    learners,
)
from app.models import (
    user,
    mentor_profile,
    skill,
    availability_slot,
    review,
    mentor_service,
    booking,
    mentor_resource,
)
from app.models.recurring_pattern import RecurringPattern
from app.models.cancellation import (
    CancellationReason,
    CancellationPolicy,
    Cancellation,
    CancellationStreak,
)
from app.models.reschedule_request import RescheduleRequest
from app.models.notification import Notification, PushToken
from app.models.streak import LearnerStreak, MentorStats
from app.routers import auth, mentors, availability, reviews


Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Find Your Mentor API",
    description="Backend API for Find Your Mentor platform",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(mentors.router)
app.include_router(availability.router)
app.include_router(recurring.router)


app.include_router(reviews.router)
app.include_router(services.router)
app.include_router(bookings.router)
app.include_router(resources.router)
app.include_router(learners.router)


@app.get("/")
def root():
    return {"message": "Welcome, API is working fine!"}
