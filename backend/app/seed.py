"""
Seed script for Find Your Mentor
Run from backend directory: python -m app.seed

Creates:
- 8 categories
- 80+ skills
- 10 mentor users with profiles, skills, services, availability
- 3 learner users with profiles and interests
"""

from datetime import datetime, timezone, timedelta
from app.db.database import SessionLocal
from app.models import (
    User,
    MentorProfile,
    LearnerProfile,
    LearnerInterest,
    Category,
    Skill,
    MentorSkill,
    MentorService,
    AvailabilitySlot,
)
from hashlib import sha256


def hash_password(password: str) -> str:
    return sha256(password.encode()).hexdigest()


def seed():
    db = SessionLocal()
    try:
        print("Clearing existing data...")
        db.query(AvailabilitySlot).delete()
        db.query(MentorService).delete()
        db.query(MentorSkill).delete()
        db.query(LearnerInterest).delete()
        db.query(LearnerProfile).delete()
        db.query(MentorProfile).delete()
        db.query(User).delete()
        db.query(Skill).delete()
        db.query(Category).delete()
        db.commit()

        # ── CATEGORIES ────────────────────────────────────────────────
        print("Creating categories and skills...")

        cat_technology = Category(
            name="Technology",
            description="Software, web, mobile, data, and computer science",
            icon="laptop",
        )
        cat_business = Category(
            name="Business & Career",
            description="Entrepreneurship, leadership, career growth, and professional skills",
            icon="briefcase",
        )
        cat_finance = Category(
            name="Finance",
            description="Personal finance, investing, budgeting, and financial planning",
            icon="currency-euro",
        )
        cat_fitness = Category(
            name="Fitness",
            description="Athletic coaching, personal training, nutrition, and wellness",
            icon="dumbbell",
        )
        cat_languages = Category(
            name="Languages",
            description="Language learning, fluency coaching, and conversation practice",
            icon="translate",
        )
        cat_design = Category(
            name="Design",
            description="UI/UX, graphic design, branding, and creative tools",
            icon="palette",
        )
        cat_creative = Category(
            name="Creative Arts",
            description="Music, photography, writing, film, and visual arts",
            icon="camera",
        )
        cat_personal = Category(
            name="Personal Development",
            description="Mindset, productivity, mental wellness, and life coaching",
            icon="brain",
        )

        for c in [
            cat_technology,
            cat_business,
            cat_finance,
            cat_fitness,
            cat_languages,
            cat_design,
            cat_creative,
            cat_personal,
        ]:
            db.add(c)
        db.flush()

        # ── SKILLS ────────────────────────────────────────────────────
        def add_skills(category, names):
            skills = {}
            for name in names:
                s = Skill(name=name, category_id=category.id)
                db.add(s)
                skills[name] = s
            return skills

        tech_skills = add_skills(
            cat_technology,
            [
                "Python",
                "JavaScript",
                "React",
                "React Native",
                "Node.js",
                "FastAPI",
                "SQL",
                "Data Science",
                "Machine Learning",
                "Cloud Computing",
                "Cybersecurity",
                "DevOps",
                "iOS Development",
                "Android Development",
                "System Design",
            ],
        )
        biz_skills = add_skills(
            cat_business,
            [
                "Entrepreneurship",
                "Product Management",
                "Leadership",
                "Public Speaking",
                "CV Review",
                "Interview Prep",
                "Networking",
                "Project Management",
                "Sales",
                "Negotiation",
                "LinkedIn Optimisation",
                "Startup Coaching",
            ],
        )
        fin_skills = add_skills(
            cat_finance,
            [
                "Personal Budgeting",
                "Investing Basics",
                "Stock Market",
                "Cryptocurrency",
                "Financial Planning",
                "Tax Planning",
                "Real Estate Investing",
                "Retirement Planning",
            ],
        )
        fit_skills = add_skills(
            cat_fitness,
            [
                "Strength Training",
                "Running",
                "Yoga",
                "Nutrition",
                "HIIT",
                "Cycling",
                "Swimming",
                "Martial Arts",
                "Flexibility & Mobility",
                "Sports Psychology",
                "Football",
            ],
        )
        lang_skills = add_skills(
            cat_languages,
            [
                "English",
                "Spanish",
                "French",
                "German",
                "Italian",
                "Portuguese",
                "Mandarin",
                "Japanese",
                "Arabic",
                "Irish",
                "Lithuanian",
            ],
        )
        design_skills = add_skills(
            cat_design,
            [
                "UI/UX Design",
                "Figma",
                "Graphic Design",
                "Branding",
                "Motion Design",
                "Typography",
                "Design Systems",
                "Illustration",
            ],
        )
        creative_skills = add_skills(
            cat_creative,
            [
                "Photography",
                "Video Editing",
                "Music Production",
                "Guitar",
                "Piano",
                "Singing",
                "Music Theory",
                "Creative Writing",
                "Screenwriting",
                "Painting",
                "Digital Art",
            ],
        )
        personal_skills = add_skills(
            cat_personal,
            [
                "Life Coaching",
                "Mindfulness & Meditation",
                "Productivity",
                "Time Management",
                "Confidence Building",
                "Anxiety Management",
                "Goal Setting",
                "Habit Formation",
                "Journaling",
            ],
        )

        db.flush()

        # ── MENTOR HELPERS ────────────────────────────────────────────
        def make_mentor(
            email,
            name,
            bio,
            hourly_rate,
            years_exp,
            languages,
            session_format,
            tags,
            location,
            skills_and_primary,
        ):
            user = User(
                email=email,
                name=name,
                password_hash=hash_password("mentor123"),
                role="mentor",
            )
            db.add(user)
            db.flush()

            profile = MentorProfile(
                user_id=user.id,
                bio=bio,
                hourly_rate=hourly_rate,
                is_visible=True,
                years_experience=years_exp,
                languages=languages,
                session_format=session_format,
                tags=tags,
                location=location,
            )
            db.add(profile)
            db.flush()

            for skill_obj, is_primary in skills_and_primary:
                db.add(
                    MentorSkill(
                        mentor_profile_id=profile.id,
                        skill_id=skill_obj.id,
                        is_primary=is_primary,
                    )
                )

            return profile

        def add_service(profile, title, description, duration_minutes, price):
            db.add(
                MentorService(
                    mentor_profile_id=profile.id,
                    title=title,
                    description=description,
                    duration_minutes=duration_minutes,
                    price=price,
                    is_active=True,
                )
            )

        # ── MENTORS ───────────────────────────────────────────────────
        print("Creating mentors...")

        # 1. Python / backend
        p1 = make_mentor(
            email="alex.murphy@example.com",
            name="Alex Murphy",
            bio="Senior backend developer with 8 years building APIs in Python and FastAPI. I love helping beginners get their first project off the ground and helping intermediate devs level up their architecture skills.",
            hourly_rate=45.0,
            years_exp=8,
            languages="English",
            session_format="online",
            tags="beginner_friendly,portfolio_building,exam_prep",
            location="Dublin, Ireland",
            skills_and_primary=[
                (tech_skills["Python"], True),
                (tech_skills["FastAPI"], False),
                (tech_skills["SQL"], False),
            ],
        )
        add_service(
            p1,
            "Python Fundamentals",
            "60 min covering Python basics, OOP, or API development depending on your level.",
            60,
            45.0,
        )
        add_service(
            p1,
            "Code Review & Architecture",
            "90 min deep dive into your codebase with actionable feedback.",
            90,
            65.0,
        )

        # 2. React / frontend
        p2 = make_mentor(
            email="sara.o.brien@example.com",
            name="Sara O'Brien",
            bio="Frontend developer specialising in React and JavaScript. I help learners build real projects from scratch with a strong focus on clean code and component design.",
            hourly_rate=40.0,
            years_exp=5,
            languages="English,Irish",
            session_format="online",
            tags="beginner_friendly,portfolio_building",
            location="Cork, Ireland",
            skills_and_primary=[
                (tech_skills["React"], True),
                (tech_skills["JavaScript"], False),
                (tech_skills["React Native"], False),
            ],
        )
        add_service(
            p2,
            "React from Zero",
            "Build a real component together from scratch. Perfect for beginners.",
            60,
            40.0,
        )
        add_service(
            p2,
            "React Native Intro",
            "Get your first mobile app running with Expo and React Native.",
            60,
            40.0,
        )

        # 3. Football coach
        p3 = make_mentor(
            email="james.kavanagh@example.com",
            name="James Kavanagh",
            bio="UEFA B licensed football coach with 10 years coaching at club level. I work with players aged 16+ on technical skill, positioning, and match intelligence.",
            hourly_rate=35.0,
            years_exp=10,
            languages="English",
            session_format="in_person",
            tags="beginner_friendly,structured",
            location="Limerick, Ireland",
            skills_and_primary=[
                (fit_skills["Football"], True),
                (fit_skills["Running"], False),
            ],
        )
        add_service(
            p3,
            "Technical Skills Session",
            "90 min on-pitch session: dribbling, passing, positioning.",
            90,
            35.0,
        )

        # 4. Strength & conditioning
        p4 = make_mentor(
            email="nadia.walsh@example.com",
            name="Nadia Walsh",
            bio="Certified personal trainer and strength coach. I build personalised programmes for beginners and intermediate lifters. Online and in-person sessions available.",
            hourly_rate=30.0,
            years_exp=6,
            languages="English",
            session_format="both",
            tags="beginner_friendly,structured,accountability_heavy",
            location="Galway, Ireland",
            skills_and_primary=[
                (fit_skills["Strength Training"], True),
                (fit_skills["Nutrition"], False),
                (fit_skills["Running"], False),
            ],
        )
        add_service(
            p4,
            "Beginner Programme Design",
            "60 min to build your first 8-week strength programme.",
            60,
            30.0,
        )
        add_service(
            p4,
            "Form Check Session",
            "45 min reviewing your technique on key compound lifts.",
            45,
            25.0,
        )

        # 5. Spanish tutor
        p5 = make_mentor(
            email="lucia.fernandez@example.com",
            name="Lucia Fernandez",
            bio="Native Spanish speaker from Madrid, living in Ireland for 7 years. Conversational Spanish at all levels. Relaxed, practical, and focused on speaking from day one.",
            hourly_rate=28.0,
            years_exp=7,
            languages="English,Spanish",
            session_format="online",
            tags="beginner_friendly,conversational_fluency",
            location="Dublin, Ireland",
            skills_and_primary=[
                (lang_skills["Spanish"], True),
                (lang_skills["English"], False),
            ],
        )
        add_service(
            p5,
            "Conversational Spanish",
            "60 min speaking practice at your level.",
            60,
            28.0,
        )

        # 6. French tutor
        p6 = make_mentor(
            email="pierre.martin@example.com",
            name="Pierre Martin",
            bio="French teacher and translator with 12 years experience. Grammar, conversation, and exam preparation for Leaving Cert and university level.",
            hourly_rate=32.0,
            years_exp=12,
            languages="English,French",
            session_format="both",
            tags="exam_prep,structured",
            location="Dublin, Ireland",
            skills_and_primary=[
                (lang_skills["French"], True),
            ],
        )
        add_service(
            p6,
            "French Exam Preparation",
            "60 min on past papers, grammar, and oral practice.",
            60,
            32.0,
        )

        # 7. Guitar teacher
        p7 = make_mentor(
            email="conor.ryan@example.com",
            name="Conor Ryan",
            bio="Guitarist with 15 years playing across rock, folk, and classical. Beginners through to advanced players welcome. Online only.",
            hourly_rate=25.0,
            years_exp=15,
            languages="English",
            session_format="online",
            tags="beginner_friendly,structured,casual",
            location="Tipperary, Ireland",
            skills_and_primary=[
                (creative_skills["Guitar"], True),
                (creative_skills["Music Theory"], False),
            ],
        )
        add_service(
            p7, "Guitar Lesson", "45 min tailored to your level and goals.", 45, 25.0
        )

        # 8. CV & career coach
        p8 = make_mentor(
            email="aoife.kelly@example.com",
            name="Aoife Kelly",
            bio="HR professional and career coach with 9 years in tech recruitment. I help people land jobs in tech by fixing their CV, LinkedIn, and interview technique.",
            hourly_rate=50.0,
            years_exp=9,
            languages="English",
            session_format="online",
            tags="career_coaching,interview_prep,portfolio_building",
            location="Dublin, Ireland",
            skills_and_primary=[
                (biz_skills["CV Review"], False),
                (biz_skills["Interview Prep"], True),
                (biz_skills["LinkedIn Optimisation"], False),
            ],
        )
        add_service(
            p8,
            "CV & LinkedIn Review",
            "60 min reviewing your CV and LinkedIn with actionable feedback.",
            60,
            50.0,
        )
        add_service(
            p8,
            "Mock Interview",
            "45 min mock interview with structured feedback.",
            45,
            45.0,
        )

        # 9. Piano teacher
        p9 = make_mentor(
            email="mei.zhang@example.com",
            name="Mei Zhang",
            bio="Classical piano graduate and music teacher with 8 years teaching experience. I teach theory alongside piano so students actually understand what they are playing.",
            hourly_rate=30.0,
            years_exp=8,
            languages="English",
            session_format="both",
            tags="beginner_friendly,structured,exam_prep",
            location="Cork, Ireland",
            skills_and_primary=[
                (creative_skills["Piano"], True),
                (creative_skills["Music Theory"], False),
            ],
        )
        add_service(
            p9,
            "Piano Lesson",
            "45 min covering technique, pieces, and theory.",
            45,
            30.0,
        )

        # 10. Full-stack / startup mentor
        p10 = make_mentor(
            email="david.oconnor@example.com",
            name="David O'Connor",
            bio="Founder of two startups and full-stack developer. I mentor developers transitioning into product roles or building their own products. Practical outcomes only.",
            hourly_rate=60.0,
            years_exp=11,
            languages="English",
            session_format="online",
            tags="career_coaching,portfolio_building,startup_coaching",
            location="Dublin, Ireland",
            skills_and_primary=[
                (tech_skills["Python"], False),
                (tech_skills["React"], False),
                (tech_skills["JavaScript"], False),
                (biz_skills["Startup Coaching"], True),
                (biz_skills["Product Management"], False),
            ],
        )
        add_service(
            p10,
            "Product Strategy Session",
            "60 min covering your product idea, market fit, and next steps.",
            60,
            60.0,
        )
        add_service(
            p10,
            "Technical Co-founder Advice",
            "60 min on tech stack decisions and early engineering choices.",
            60,
            60.0,
        )

        db.flush()

        # ── AVAILABILITY SLOTS ────────────────────────────────────────
        print("Creating availability slots...")

        def add_slots(profile, slots):
            base = datetime.now(timezone.utc).replace(
                hour=0, minute=0, second=0, microsecond=0
            )
            for days, hour, duration in slots:
                start = base + timedelta(days=days, hours=hour)
                end = start + timedelta(hours=duration)
                db.add(
                    AvailabilitySlot(
                        mentor_profile_id=profile.id,
                        start_time=start,
                        end_time=end,
                        status="available",
                    )
                )

        add_slots(p1, [(1, 18, 2), (2, 18, 2), (5, 10, 3), (7, 18, 2)])
        add_slots(p2, [(1, 19, 2), (3, 19, 2), (6, 11, 2)])
        add_slots(p3, [(2, 10, 2), (4, 10, 2), (6, 9, 3)])
        add_slots(p4, [(1, 7, 1.5), (3, 7, 1.5), (6, 8, 2)])
        add_slots(p5, [(1, 17, 2), (2, 17, 2), (4, 17, 2), (6, 10, 2)])
        add_slots(p6, [(2, 16, 2), (4, 16, 2), (5, 16, 2)])
        add_slots(p7, [(1, 20, 1.5), (3, 20, 1.5), (6, 14, 2)])
        add_slots(p8, [(1, 12, 1.5), (3, 12, 1.5), (5, 12, 1.5)])
        add_slots(p9, [(2, 15, 2), (4, 15, 2), (6, 10, 2)])
        add_slots(p10, [(1, 18, 1.5), (2, 18, 1.5), (4, 18, 1.5)])

        db.flush()

        # ── LEARNERS ──────────────────────────────────────────────────
        print("Creating learners...")

        def make_learner(
            email,
            name,
            bio,
            cat,
            languages,
            fmt,
            min_p,
            max_p,
            level,
            goal_tags,
            goal_desc,
            availability,
            location,
            interests,
        ):
            user = User(
                email=email,
                name=name,
                password_hash=hash_password("learner123"),
                role="learner",
            )
            db.add(user)
            db.flush()
            lp = LearnerProfile(
                user_id=user.id,
                bio=bio,
                preferred_category_id=cat.id,
                preferred_languages=languages,
                preferred_session_format=fmt,
                min_price=min_p,
                max_price=max_p,
                experience_level=level,
                goal_tags=goal_tags,
                goal_description=goal_desc,
                availability_preference=availability,
                location=location,
            )
            db.add(lp)
            db.flush()
            for skill_obj, current, target in interests:
                db.add(
                    LearnerInterest(
                        learner_profile_id=lp.id,
                        skill_id=skill_obj.id,
                        current_level=current,
                        target_level=target,
                    )
                )
            return lp

        make_learner(
            email="student.one@example.com",
            name="Jamie Brennan",
            bio="Computer science student looking to improve my Python and web skills.",
            cat=cat_technology,
            languages="English",
            fmt="online",
            min_p=0.0,
            max_p=50.0,
            level="beginner",
            goal_tags="portfolio_building,exam_prep",
            goal_desc="Build college projects and prepare for end of year exams.",
            availability="weekday_evenings,weekend_mornings",
            location="Dublin, Ireland",
            interests=[
                (tech_skills["Python"], "beginner", "intermediate"),
                (tech_skills["React"], "beginner", "beginner"),
            ],
        )

        make_learner(
            email="student.two@example.com",
            name="Ciara Daly",
            bio="Looking to get stronger and improve my running form.",
            cat=cat_fitness,
            languages="English",
            fmt="both",
            min_p=0.0,
            max_p=40.0,
            level="intermediate",
            goal_tags="fitness",
            goal_desc="Improve strength and prepare for a 5k race.",
            availability="weekday_mornings,weekend_mornings",
            location="Galway, Ireland",
            interests=[
                (fit_skills["Strength Training"], "intermediate", "advanced"),
                (fit_skills["Running"], "beginner", "intermediate"),
            ],
        )

        make_learner(
            email="student.three@example.com",
            name="Fionn McCarthy",
            bio="Planning a trip to South America, want to get conversational in Spanish.",
            cat=cat_languages,
            languages="English",
            fmt="online",
            min_p=0.0,
            max_p=35.0,
            level="beginner",
            goal_tags="conversational_fluency",
            goal_desc="Get conversational in Spanish before travelling.",
            availability="weekday_evenings",
            location="Cork, Ireland",
            interests=[
                (lang_skills["Spanish"], "beginner", "intermediate"),
            ],
        )

        db.commit()

        print("\nSeed complete.")
        print("  8 categories, 80+ skills")
        print("  10 mentors  (password: mentor123)")
        print("  3 learners  (password: learner123)")
        print("\nMentor logins:")
        for email in [
            "alex.murphy@example.com",
            "sara.o.brien@example.com",
            "james.kavanagh@example.com",
            "nadia.walsh@example.com",
            "lucia.fernandez@example.com",
            "pierre.martin@example.com",
            "conor.ryan@example.com",
            "aoife.kelly@example.com",
            "mei.zhang@example.com",
            "david.oconnor@example.com",
        ]:
            print(f"  {email}")
        print("\nLearner logins:")
        print("  student.one@example.com    (Python / Dublin / evenings)")
        print("  student.two@example.com    (Strength / Galway / mornings)")
        print("  student.three@example.com  (Spanish / Cork / evenings)")

    except Exception as e:
        db.rollback()
        print(f"\nSeed failed: {e}")
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
