"""
test_algorithm.py - Unit tests for the smart_sort relevance scoring engine.

These tests call score_mentor() and smart_sort() DIRECTLY - no HTTP requests.
This is a true unit test layer, isolated from the database and network.

The scoring model has 8 weighted dimensions that sum to 100:
  skill_match 35  |  goal_match 15  |  booking_history 10  |  price_fit 10
  language_match 10  |  availability_fit 10  |  experience_fit 5  |  rating_score 5

Bayesian rating formula (for the rating_score dimension):
  confidence  = min(total_reviews, 20) / 20
  rating_ratio = (avg_rating - 1) / 4          # normalise 1-5 → 0-1
  rating_score = confidence × rating_ratio × weight(5)

Test approach: mutation-style - isolate each dimension by zeroing all others
in the input dict, then assert exactly the expected contribution.
"""

import sys
import os
import pytest

# Make the backend/app package importable from backend/tests/
sys.path.insert(0, os.path.join(os.path.dirname(__file__), ".."))

from app.services.smart_sort import score_mentor, smart_sort, WEIGHTS

# ---------------------------------------------------------------------------
# Helper constructors
# ---------------------------------------------------------------------------


def make_mentor(**overrides) -> dict:
    """
    Build a minimal mentor dict with all dimensions zeroed out.
    Override individual fields to activate a single scoring dimension.
    """
    base = {
        "skill_ids": [],
        "skill_names": [],
        "tags": None,
        "languages": None,
        "hourly_rate": None,
        "years_experience": 0,
        "availability_windows": [],
        "available_slot_count": 0,
        "category_ids": [],
        "average_rating": None,
        "total_reviews": 0,
    }
    base.update(overrides)
    return base


def make_learner(**overrides) -> dict:
    """
    Build a minimal learner dict with all dimensions zeroed out.
    Override individual fields to activate a single scoring dimension.
    """
    base = {
        "interest_skill_ids": [],
        "interest_skill_names": [],
        "goal_tags": None,
        "min_price": None,
        "max_price": None,
        "preferred_languages": None,
        "availability_preference": None,
        "experience_level": "",
        "preferred_category_id": None,
        "booked_category_ids": [],
    }
    base.update(overrides)
    return base


# ---------------------------------------------------------------------------
# Weight integrity
# ---------------------------------------------------------------------------


class TestWeightIntegrity:

    def test_weights_sum_to_exactly_100(self):
        """
        All 8 weight values must sum to exactly 100. This is the calibration
        constraint for the scoring model - if weights drift from 100, the
        maximum possible score per mentor also drifts, making scores
        incomparable across dimensions.
        """
        total = sum(WEIGHTS.values())
        assert total == 100, f"Weights sum to {total}, not 100. Weights: {WEIGHTS}"

    def test_all_weight_keys_present(self):
        """
        The eight dimensions defined in the docstring must all appear as keys.
        Missing a key would silently exclude that dimension from scoring.
        """
        expected_keys = {
            "skill_match",
            "goal_match",
            "booking_history",
            "price_fit",
            "language_match",
            "availability_fit",
            "experience_fit",
            "rating_score",
        }
        assert set(WEIGHTS.keys()) == expected_keys

    def test_all_weights_are_positive(self):
        """
        Each weight must be positive (> 0). A zero or negative weight would
        create a dimension that either has no effect or actively penalises
        an otherwise good match.
        """
        for dim, w in WEIGHTS.items():
            assert w > 0, f"Weight for '{dim}' is {w} - must be positive"


# ---------------------------------------------------------------------------
# Skill match dimension (weight 35)
# ---------------------------------------------------------------------------


class TestSkillMatchDimension:

    def test_perfect_skill_match_scores_higher_than_no_match(self):
        """
        A mentor whose skill IDs exactly cover the learner's interests must score
        higher than a mentor with completely different skills. The skill dimension
        is the largest weight (35), so this difference should be substantial.
        """
        learner = make_learner(
            interest_skill_ids=[1, 2],
            interest_skill_names=["Python", "Data Science"],
        )
        mentor_match = make_mentor(
            skill_ids=[1, 2],
            skill_names=["Python", "Data Science"],
        )
        mentor_no_match = make_mentor(
            skill_ids=[99, 100],
            skill_names=["Watercolour Painting", "Cookery"],
        )

        score_match, _ = score_mentor(mentor_match, learner)
        score_no_match, _ = score_mentor(mentor_no_match, learner)

        assert (
            score_match > score_no_match
        ), f"Perfect skill match ({score_match}) must outscore no match ({score_no_match})"

    def test_perfect_skill_match_awards_full_weight(self):
        """
        When the learner has exactly one skill of interest and the mentor has
        that exact skill, the skill ratio is 1.0, so the full 35 points must
        be awarded for the skill_match dimension.
        """
        learner = make_learner(
            interest_skill_ids=[1],
            interest_skill_names=["Python"],
        )
        mentor = make_mentor(
            skill_ids=[1],
            skill_names=["Python"],
        )
        score, _ = score_mentor(mentor, learner)
        # Only skill dimension contributes when all others are zeroed
        assert score == pytest.approx(
            WEIGHTS["skill_match"], abs=0.01
        ), f"Expected {WEIGHTS['skill_match']} for perfect 1-skill match, got {score}"


# ---------------------------------------------------------------------------
# Rating score dimension (weight 5) - Bayesian confidence formula
# ---------------------------------------------------------------------------


class TestBayesianRatingDimension:

    def test_more_reviews_same_rating_yields_higher_score(self):
        """
        Bayesian confidence: a mentor with 20 reviews at 5.0 must score higher
        than a mentor with 1 review at 5.0. The confidence factor (min(n,20)/20)
        rewards credibility built on many reviews.
        """
        learner = make_learner()  # no preferences - only rating dimension contributes
        mentor_1_review = make_mentor(average_rating=5.0, total_reviews=1)
        mentor_20_reviews = make_mentor(average_rating=5.0, total_reviews=20)

        score_1, _ = score_mentor(mentor_1_review, learner)
        score_20, _ = score_mentor(mentor_20_reviews, learner)

        assert score_20 > score_1, (
            f"20-review mentor ({score_20}) must beat 1-review mentor ({score_1}) "
            "at the same 5.0 rating."
        )

    def test_bayesian_formula_rating5_reviews1(self):
        """
        Exact Bayesian calculation for rating=5.0, total_reviews=1:
          confidence  = min(1, 20) / 20 = 0.05
          rating_ratio = (5.0 - 1) / 4  = 1.0
          rating_score = 0.05 × 1.0 × 5 = 0.25

        With all other dimensions zeroed, the total score must equal 0.25.
        """
        learner = make_learner()
        mentor = make_mentor(average_rating=5.0, total_reviews=1)
        score, _ = score_mentor(mentor, learner)

        expected = 0.05 * 1.0 * WEIGHTS["rating_score"]  # = 0.25
        assert score == pytest.approx(
            expected, abs=0.01
        ), f"Expected {expected:.4f} for rating=5.0 reviews=1, got {score}"

    def test_bayesian_formula_rating_4_5_reviews_20(self):
        """
        Exact Bayesian calculation for rating=4.5, total_reviews=20:
          confidence  = min(20, 20) / 20 = 1.0
          rating_ratio = (4.5 - 1) / 4  = 0.875
          rating_score = 1.0 × 0.875 × 5 = 4.375

        With all other dimensions zeroed, the total score must equal 4.375.
        """
        learner = make_learner()
        mentor = make_mentor(average_rating=4.5, total_reviews=20)
        score, _ = score_mentor(mentor, learner)

        confidence = 1.0  # 20/20
        rating_ratio = 3.5 / 4.0  # (4.5-1)/4
        expected = confidence * rating_ratio * WEIGHTS["rating_score"]  # 4.375

        assert score == pytest.approx(
            expected, abs=0.01
        ), f"Expected {expected:.4f} for rating=4.5 reviews=20, got {score}"

    def test_mentor_with_zero_reviews_gets_no_rating_score(self):
        """
        A mentor with total_reviews=0 must not receive any rating score points.
        The guard condition `if avg_rating and total_reviews > 0` ensures this.
        With all other dimensions also zeroed, total score must be 0.0.
        """
        learner = make_learner()
        mentor = make_mentor(average_rating=5.0, total_reviews=0)
        score, _ = score_mentor(mentor, learner)

        assert score == pytest.approx(
            0.0, abs=0.01
        ), f"Mentor with 0 reviews should score 0.0, got {score}"


# ---------------------------------------------------------------------------
# Sort order and score range
# ---------------------------------------------------------------------------


class TestSortBehaviour:

    def test_sort_order_is_descending_by_relevance_score(self):
        """
        smart_sort() must return mentors sorted by relevance_score in descending
        order (highest-scoring mentor first). This is the fundamental requirement
        of the recommendation engine - the best match must appear at the top.
        """
        learner = make_learner(
            interest_skill_ids=[1],
            interest_skill_names=["Python"],
        )
        # Three mentors with different match levels
        mentors = [
            make_mentor(skill_ids=[99], skill_names=["Cookery"]),  # no match
            make_mentor(skill_ids=[1], skill_names=["Python"]),  # full match
            make_mentor(
                skill_ids=[1, 2], skill_names=["Python", "Django"]
            ),  # full + extra
        ]

        result = smart_sort(mentors, learner)
        scores = [m["relevance_score"] for m in result]

        assert scores == sorted(
            scores, reverse=True
        ), f"Results are not sorted descending. Scores: {scores}"

    def test_all_scores_are_between_0_and_100(self):
        """
        Every relevance_score produced by smart_sort() must fall within [0, 100].
        Scores outside this range would indicate a weight calibration error or
        a calculation overflow in one of the eight dimensions.
        """
        learner = make_learner(
            interest_skill_ids=[1, 2],
            interest_skill_names=["Python", "Data Science"],
            max_price=100.0,
            preferred_languages="English",
            experience_level="beginner",
            goal_tags="beginner_support",
        )
        mentors = [
            make_mentor(
                skill_ids=[1, 2],
                skill_names=["Python", "Data Science"],
                tags="beginner_friendly,python",
                languages="English",
                hourly_rate=45.0,
                average_rating=5.0,
                total_reviews=20,
                years_experience=5,
                availability_windows=["weekday_evenings"],
                available_slot_count=3,
            ),
            make_mentor(
                skill_ids=[99],
                skill_names=["Cookery"],
                tags=None,
                languages=None,
                hourly_rate=200.0,
                average_rating=None,
                total_reviews=0,
                years_experience=0,
            ),
            make_mentor(),  # all zeros - minimum possible score
        ]

        result = smart_sort(mentors, learner)
        for m in result:
            assert (
                0 <= m["relevance_score"] <= 100
            ), f"Score {m['relevance_score']} is outside [0, 100]"

    def test_no_learner_profile_falls_back_to_rating_sort(self):
        """
        When smart_sort() is called with learner=None, it must fall back to
        sorting by average_rating (highest first) rather than throwing an error.
        This is the anonymous / unauthenticated user path.
        """
        mentors = [
            make_mentor(average_rating=3.0, total_reviews=10),
            make_mentor(average_rating=4.5, total_reviews=5),
            make_mentor(average_rating=None, total_reviews=0),
        ]
        result = smart_sort(mentors, learner=None)

        # Scores should be None in fallback mode
        assert all(m["relevance_score"] is None for m in result)
        # Highest-rated mentor should appear first
        assert result[0]["average_rating"] == 4.5
