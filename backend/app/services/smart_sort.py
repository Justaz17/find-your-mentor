"""
Smart sort scoring engine for Find Your Mentor.

Takes a learner profile and a list of mentor data dicts,
returns them sorted by relevance score with match reasons attached.

Two-layer architecture:
  Layer 1: hard filters  - applied in the SQL query (see mentor router)
  Layer 2: weighted score - applied here in Python after the query

Weights:
  skill_match        35
  goal_match         15
  booking_history    10
  price_fit          10
  language_match     10
  availability_fit   10
  experience_fit      5
  rating_score        5
  ─────────────────────
  total             100
"""

from typing import Optional

# ── Weight constants ──────────────────────────────────────────────────────

WEIGHTS = {
    "skill_match": 35,
    "goal_match": 15,
    "booking_history": 10,
    "price_fit": 10,
    "language_match": 10,
    "availability_fit": 10,
    "experience_fit": 5,
    "rating_score": 5,
}

# Goal tags that overlap with mentor tags
GOAL_TO_MENTOR_TAG_MAP = {
    "exam_prep": ["exam_prep", "structured"],
    "beginner_support": ["beginner_friendly"],
    "career_change": ["career_coaching"],
    "fitness": ["structured", "accountability_heavy"],
    "conversational_fluency": ["conversational_fluency", "casual"],
    "portfolio_building": ["portfolio_building"],
    "interview_prep": ["interview_prep", "career_coaching"],
    "startup_coaching": ["startup_coaching"],
}


def score_mentor(mentor: dict, learner: dict) -> tuple[float, list[str]]:
    """
    Score a single mentor against a learner profile.

    Args:
        mentor: dict with keys matching MentorSearchResult fields
                plus 'skill_ids' (list of int) and 'skill_names' (list of str)
        learner: dict with learner profile fields

    Returns:
        (score: float 0-100, match_reasons: list[str])
    """
    score = 0.0
    reasons = []

    # ── 1. Skill match (weight 35) ────────────────────────────────────
    learner_skill_ids = set(learner.get("interest_skill_ids", []))
    learner_skill_names = [n.lower() for n in learner.get("interest_skill_names", [])]
    mentor_skill_ids = set(mentor.get("skill_ids", []))
    mentor_skill_names = [n.lower() for n in mentor.get("skill_names", [])]

    if learner_skill_ids and mentor_skill_ids:
        exact_matches = learner_skill_ids & mentor_skill_ids
        if exact_matches:
            skill_ratio = len(exact_matches) / len(learner_skill_ids)
            skill_score = skill_ratio * WEIGHTS["skill_match"]
            score += skill_score

            # Find the names for the reason labels
            matched_names = [
                name
                for name in mentor.get("skill_names", [])
                if name.lower()
                in [n.lower() for n in learner.get("interest_skill_names", [])]
            ]
            if matched_names:
                reasons.append(f"Matches your {matched_names[0]} interest")
        else:
            # Partial - check if mentor's category overlaps
            learner_cat = learner.get("preferred_category_id")
            mentor_cat = mentor.get("category_ids", [])
            if learner_cat and learner_cat in mentor_cat:
                score += WEIGHTS["skill_match"] * 0.3
                reasons.append("Same category as your interests")

    # ── 2. Goal match (weight 15) ─────────────────────────────────────
    learner_goals = [
        g.strip() for g in (learner.get("goal_tags") or "").split(",") if g.strip()
    ]
    mentor_tags = [
        t.strip() for t in (mentor.get("tags") or "").split(",") if t.strip()
    ]

    if learner_goals and mentor_tags:
        goal_hits = 0
        for goal in learner_goals:
            target_tags = GOAL_TO_MENTOR_TAG_MAP.get(goal, [goal])
            if any(t in mentor_tags for t in target_tags):
                goal_hits += 1

        if goal_hits:
            goal_ratio = goal_hits / len(learner_goals)
            score += goal_ratio * WEIGHTS["goal_match"]
            if (
                "beginner_friendly" in mentor_tags
                and "beginner_support" in learner_goals
            ):
                reasons.append("Beginner-friendly")
            elif "exam_prep" in mentor_tags and "exam_prep" in learner_goals:
                reasons.append("Offers exam preparation")
            elif goal_hits > 0:
                reasons.append("Matches your learning goals")

    # ── 3. Price fit (weight 10) ──────────────────────────────────────
    min_price = learner.get("min_price")
    max_price = learner.get("max_price")
    mentor_rate = mentor.get("hourly_rate")

    if mentor_rate is not None and max_price is not None:
        if mentor_rate <= max_price:
            if min_price is not None and mentor_rate >= min_price:
                # Perfect fit - within range
                score += WEIGHTS["price_fit"]
                reasons.append("Within your budget")
            else:
                # Below minimum - still good, partial score
                score += WEIGHTS["price_fit"] * 0.8
        else:
            # Above max - diminishing score
            overage_ratio = (mentor_rate - max_price) / max_price
            if overage_ratio < 0.2:
                score += WEIGHTS["price_fit"] * 0.5
            elif overage_ratio < 0.5:
                score += WEIGHTS["price_fit"] * 0.2
            # else: 0 points

    # ── 4. Language match (weight 10) ─────────────────────────────────
    learner_langs = [
        l.strip().lower()
        for l in (learner.get("preferred_languages") or "").split(",")
        if l.strip()
    ]
    mentor_langs = [
        l.strip().lower()
        for l in (mentor.get("languages") or "").split(",")
        if l.strip()
    ]

    if learner_langs and mentor_langs:
        lang_overlap = set(learner_langs) & set(mentor_langs)
        if lang_overlap:
            score += WEIGHTS["language_match"]
            if "english" not in lang_overlap:
                # Non-English match is more interesting to highlight
                reasons.append(f"Speaks {list(lang_overlap)[0].title()}")

    # ── 5. Availability fit (weight 10) ───────────────────────────────
    learner_avail = [
        a.strip()
        for a in (learner.get("availability_preference") or "").split(",")
        if a.strip()
    ]
    mentor_avail_windows = mentor.get("availability_windows", [])
    # availability_windows is a list of strings like "weekday_evening", "weekend_morning"
    # populated when building the mentor dict from their slots

    if learner_avail and mentor_avail_windows:
        avail_overlap = set(learner_avail) & set(mentor_avail_windows)
        if avail_overlap:
            overlap_ratio = len(avail_overlap) / len(learner_avail)
            score += overlap_ratio * WEIGHTS["availability_fit"]
            reasons.append("Available at your preferred times")
    elif mentor.get("available_slot_count", 0) > 0:
        # Mentor has slots but we don't know the window - give partial credit
        score += WEIGHTS["availability_fit"] * 0.5

    # ── 6. Experience fit (weight 5) ──────────────────────────────────
    learner_level = learner.get("experience_level", "")
    mentor_years = mentor.get("years_experience") or 0
    mentor_beginner_friendly = "beginner_friendly" in mentor_tags

    if learner_level == "beginner":
        if mentor_beginner_friendly:
            score += WEIGHTS["experience_fit"]
        elif mentor_years <= 5:
            score += WEIGHTS["experience_fit"] * 0.7
        else:
            score += WEIGHTS["experience_fit"] * 0.4
    elif learner_level == "intermediate":
        if 3 <= mentor_years <= 10:
            score += WEIGHTS["experience_fit"]
        else:
            score += WEIGHTS["experience_fit"] * 0.6
    elif learner_level == "advanced":
        if mentor_years >= 7:
            score += WEIGHTS["experience_fit"]
        else:
            score += WEIGHTS["experience_fit"] * 0.4

    # ── 7. Rating score (weight 5) ────────────────────────────────────
    avg_rating = mentor.get("average_rating")
    total_reviews = mentor.get("total_reviews", 0)

    if avg_rating and total_reviews > 0:
        # Bayesian-style: weight rating by review count, cap at 20 reviews
        confidence = min(total_reviews, 20) / 20
        rating_ratio = (avg_rating - 1) / 4  # normalise 1-5 to 0-1
        score += confidence * rating_ratio * WEIGHTS["rating_score"]

    # ── 8. Booking history (weight 10) ────────────────────────────────
    # Future: boost mentors in same category as previous bookings
    # For now, this slot exists for when behavioural data is available
    booked_category_ids = learner.get("booked_category_ids", [])
    mentor_category_ids = mentor.get("category_ids", [])
    if booked_category_ids and mentor_category_ids:
        if set(booked_category_ids) & set(mentor_category_ids):
            score += WEIGHTS["booking_history"] * 0.5
            # Not adding a reason here booking history is a background signal

    return round(score, 2), reasons


def smart_sort(mentors: list[dict], learner: Optional[dict]) -> list[dict]:
    """
    Apply smart sort to a list of mentor dicts.
    If no learner profile, fall back to rating sort.

    Each mentor dict gets 'relevance_score' and 'match_reasons' added.
    Returns list sorted by relevance_score descending.
    """
    if not learner:
        # No learner profile - sort by rating, highest first
        for m in mentors:
            m["relevance_score"] = None
            m["match_reasons"] = []
        return sorted(
            mentors,
            key=lambda m: (m.get("average_rating") or 0, m.get("total_reviews") or 0),
            reverse=True,
        )

    for mentor in mentors:
        score, reasons = score_mentor(mentor, learner)
        mentor["relevance_score"] = score
        mentor["match_reasons"] = reasons

    return sorted(mentors, key=lambda m: m["relevance_score"], reverse=True)
