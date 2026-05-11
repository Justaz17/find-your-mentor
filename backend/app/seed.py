"""
Seed script for Find Your Mentor - COMPREHENSIVE VERSION
Run from backend directory: python -m app.seed

Creates a fully populated database for testing and demonstration:
- 8 categories with 80+ skills
- 20 mentors with profiles, services, availability, and recurring patterns
- 10 learners with diverse profiles
- 40+ bookings (pending, confirmed, completed, cancelled)
- Reviews and ratings for mentors
- Reschedule requests in various states
- Cancellation records with reasons
- Learner streaks and mentor stats
- Push tokens and notifications

Test Credentials:
  All mentors: password = mentor123
  All learners: password = learner123
"""

from datetime import datetime, timezone, timedelta, time, date
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
    RecurringPattern,
    Booking,
    Review,
    MentorResource,
    RescheduleRequest,
    CancellationReason,
    CancellationPolicy,
    Cancellation,
    CancellationStreak,
    LearnerStreak,
    MentorStats,
    Notification,
    PushToken,
)
from passlib.context import CryptContext
import random

pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")


def hash_password(password: str) -> str:
    return pwd_context.hash(password)


def seed():
    db = SessionLocal()
    try:
        print("  Clearing existing data...")

        # Clear in dependency order
        db.query(Notification).delete()
        db.query(PushToken).delete()
        db.query(MentorStats).delete()
        db.query(LearnerStreak).delete()
        db.query(CancellationStreak).delete()
        db.query(Cancellation).delete()
        db.query(CancellationPolicy).delete()
        db.query(CancellationReason).delete()
        db.query(RescheduleRequest).delete()
        db.query(Review).delete()
        db.query(MentorResource).delete()
        db.query(Booking).delete()
        db.query(AvailabilitySlot).delete()
        db.query(RecurringPattern).delete()
        db.query(MentorService).delete()
        db.query(MentorSkill).delete()
        db.query(LearnerInterest).delete()
        db.query(LearnerProfile).delete()
        db.query(MentorProfile).delete()
        db.query(User).delete()
        db.query(Skill).delete()
        db.query(Category).delete()
        db.commit()

        # ══════════════════════════════════════════════════════════════
        # CATEGORIES & SKILLS
        # ══════════════════════════════════════════════════════════════
        print(" Creating categories and skills...")

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
                "TypeScript",
                "Vue.js",
                "Django",
                "PostgreSQL",
                "MongoDB",
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
                "Marketing",
                "Brand Strategy",
                "Business Development",
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
                "Trading",
                "Portfolio Management",
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
                "Basketball",
                "CrossFit",
                "Powerlifting",
                "Calisthenics",
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
                "Russian",
                "Korean",
                "Dutch",
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
                "Adobe Creative Suite",
                "Sketch",
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
                "DJing",
                "Drums",
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
                "Career Transitions",
                "Work-Life Balance",
            ],
        )

        db.flush()

        # ══════════════════════════════════════════════════════════════
        # MENTORS
        # ══════════════════════════════════════════════════════════════
        print(" Creating 20 mentors...")

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

            return user, profile

        def add_service(profile, title, description, duration_minutes, price):
            service = MentorService(
                mentor_profile_id=profile.id,
                title=title,
                description=description,
                duration_minutes=duration_minutes,
                price=price,
                is_active=True,
            )
            db.add(service)
            return service

        # 1. Python / Backend Developer
        u1, m1 = make_mentor(
            email="alex.murphy@example.com",
            name="Alex Murphy",
            bio="Senior backend developer with 8 years building APIs in Python and FastAPI. I love helping beginners get their first project off the ground and intermediate devs level up their architecture skills.",
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
        s1_1 = add_service(
            m1,
            "Python Fundamentals",
            "60 min covering Python basics, OOP, or API development depending on your level.",
            60,
            45.0,
        )
        s1_2 = add_service(
            m1,
            "Code Review & Architecture",
            "90 min deep dive into your codebase with actionable feedback.",
            90,
            65.0,
        )

        # 2. React / Frontend Developer
        u2, m2 = make_mentor(
            email="sara.obrien@example.com",
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
        s2_1 = add_service(
            m2,
            "React from Zero",
            "Build a real component together from scratch. Perfect for beginners.",
            60,
            40.0,
        )
        s2_2 = add_service(
            m2,
            "React Native Intro",
            "Get your first mobile app running with Expo and React Native.",
            60,
            40.0,
        )

        # 3. Full-Stack / Startup Mentor
        u3, m3 = make_mentor(
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
                (biz_skills["Startup Coaching"], True),
                (biz_skills["Product Management"], False),
            ],
        )
        s3_1 = add_service(
            m3,
            "Product Strategy Session",
            "60 min covering your product idea, market fit, and next steps.",
            60,
            60.0,
        )
        s3_2 = add_service(
            m3,
            "Technical Co-founder Advice",
            "60 min on tech stack decisions and early engineering choices.",
            60,
            60.0,
        )

        # 4. Data Science / ML Engineer
        u4, m4 = make_mentor(
            email="priya.sharma@example.com",
            name="Priya Sharma",
            bio="Data scientist with 7 years at tech companies. Specialise in ML model deployment and data pipeline architecture. I help people transition from traditional software into ML/AI roles.",
            hourly_rate=55.0,
            years_exp=7,
            languages="English",
            session_format="online",
            tags="career_coaching,portfolio_building",
            location="Dublin, Ireland",
            skills_and_primary=[
                (tech_skills["Data Science"], True),
                (tech_skills["Machine Learning"], True),
                (tech_skills["Python"], False),
            ],
        )
        s4_1 = add_service(
            m4,
            "ML Portfolio Project",
            "Build a real ML project you can showcase to employers.",
            90,
            70.0,
        )
        s4_2 = add_service(
            m4,
            "Career Transition Coaching",
            "Break into ML/AI from traditional software engineering.",
            60,
            55.0,
        )

        # 5. DevOps / Cloud Engineer
        u5, m5 = make_mentor(
            email="michael.chen@example.com",
            name="Michael Chen",
            bio="DevOps engineer with AWS and Azure certifications. I help developers understand CI/CD, containerization, and cloud infrastructure. Great for people preparing for AWS certs.",
            hourly_rate=50.0,
            years_exp=6,
            languages="English",
            session_format="online",
            tags="exam_prep,career_coaching",
            location="Galway, Ireland",
            skills_and_primary=[
                (tech_skills["DevOps"], True),
                (tech_skills["Cloud Computing"], True),
            ],
        )
        s5_1 = add_service(
            m5,
            "AWS Certification Prep",
            "Prepare for AWS Solutions Architect or Developer Associate exams.",
            60,
            50.0,
        )
        s5_2 = add_service(
            m5,
            "CI/CD Pipeline Setup",
            "Set up GitHub Actions, Docker, and deployment automation for your project.",
            90,
            70.0,
        )

        # 6. Mobile Developer (iOS/Android)
        u6, m6 = make_mentor(
            email="emma.walsh@example.com",
            name="Emma Walsh",
            bio="Mobile developer building iOS and Android apps for 9 years. I mentor people building their first app or transitioning from web to mobile development.",
            hourly_rate=48.0,
            years_exp=9,
            languages="English",
            session_format="online",
            tags="beginner_friendly,portfolio_building",
            location="Limerick, Ireland",
            skills_and_primary=[
                (tech_skills["iOS Development"], True),
                (tech_skills["Android Development"], False),
                (tech_skills["React Native"], False),
            ],
        )
        s6_1 = add_service(
            m6,
            "Build Your First Mobile App",
            "Launch your first iOS or Android app from idea to App Store.",
            60,
            48.0,
        )

        # 7. UI/UX Designer
        u7, m7 = make_mentor(
            email="lucia.martinez@example.com",
            name="Lucia Martinez",
            bio="Product designer with 6 years at SaaS startups. I teach Figma, user research, and design systems. Perfect for developers learning design or designers building portfolios.",
            hourly_rate=42.0,
            years_exp=6,
            languages="English,Spanish",
            session_format="online",
            tags="beginner_friendly,portfolio_building",
            location="Barcelona, Spain",
            skills_and_primary=[
                (design_skills["UI/UX Design"], True),
                (design_skills["Figma"], True),
            ],
        )
        s7_1 = add_service(
            m7,
            "Figma Crash Course",
            "Learn Figma fundamentals and design your first screens.",
            60,
            42.0,
        )
        s7_2 = add_service(
            m7,
            "Portfolio Review",
            "Get feedback on your design portfolio and case studies.",
            45,
            35.0,
        )

        # 8. CV & Career Coach
        u8, m8 = make_mentor(
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
                (biz_skills["CV Review"], True),
                (biz_skills["Interview Prep"], True),
                (biz_skills["LinkedIn Optimisation"], False),
            ],
        )
        s8_1 = add_service(
            m8,
            "CV & LinkedIn Review",
            "60 min reviewing your CV and LinkedIn with actionable feedback.",
            60,
            50.0,
        )
        s8_2 = add_service(
            m8,
            "Mock Interview",
            "45 min mock interview with structured feedback.",
            45,
            45.0,
        )

        # 9. Business Strategy Consultant
        u9, m9 = make_mentor(
            email="james.thornton@example.com",
            name="James Thornton",
            bio="Business consultant helping startups with go-to-market strategy, fundraising, and scaling. 12 years working with early-stage companies across Europe.",
            hourly_rate=70.0,
            years_exp=12,
            languages="English",
            session_format="both",
            tags="startup_coaching,career_coaching",
            location="London, UK",
            skills_and_primary=[
                (biz_skills["Entrepreneurship"], True),
                (biz_skills["Business Development"], True),
                (biz_skills["Marketing"], False),
            ],
        )
        s9_1 = add_service(
            m9,
            "Startup Strategy Session",
            "Roadmap your product launch, fundraising, or scaling strategy.",
            90,
            90.0,
        )

        # 10. Financial Planning Coach
        u10, m10 = make_mentor(
            email="sarah.flynn@example.com",
            name="Sarah Flynn",
            bio="Certified financial planner helping people in their 20s and 30s build wealth. I teach budgeting, investing basics, and long-term financial planning.",
            hourly_rate=45.0,
            years_exp=8,
            languages="English",
            session_format="online",
            tags="beginner_friendly",
            location="Dublin, Ireland",
            skills_and_primary=[
                (fin_skills["Personal Budgeting"], True),
                (fin_skills["Investing Basics"], True),
                (fin_skills["Financial Planning"], False),
            ],
        )
        s10_1 = add_service(
            m10,
            "Financial Health Check",
            "Review your current finances and build a plan.",
            60,
            45.0,
        )

        # 11. Strength & Conditioning Coach
        u11, m11 = make_mentor(
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
            ],
        )
        s11_1 = add_service(
            m11,
            "Beginner Programme Design",
            "60 min to build your first 8-week strength programme.",
            60,
            30.0,
        )
        s11_2 = add_service(
            m11,
            "Form Check Session",
            "45 min reviewing your technique on key compound lifts.",
            45,
            25.0,
        )

        # 12. Running Coach
        u12, m12 = make_mentor(
            email="tom.brennan@example.com",
            name="Tom Brennan",
            bio="Marathon runner and running coach. I help people train for their first 5K, 10K, half marathon, or marathon. All fitness levels welcome.",
            hourly_rate=28.0,
            years_exp=10,
            languages="English",
            session_format="both",
            tags="beginner_friendly,structured",
            location="Dublin, Ireland",
            skills_and_primary=[
                (fit_skills["Running"], True),
            ],
        )
        s12_1 = add_service(
            m12,
            "Race Training Plan",
            "Build a structured training plan for your race goal.",
            60,
            28.0,
        )

        # 13. Yoga Instructor
        u13, m13 = make_mentor(
            email="maya.patel@example.com",
            name="Maya Patel",
            bio="Certified yoga instructor specialising in Vinyasa and Hatha. I help beginners build a sustainable practice and teach breathwork and meditation.",
            hourly_rate=25.0,
            years_exp=7,
            languages="English",
            session_format="both",
            tags="beginner_friendly",
            location="Cork, Ireland",
            skills_and_primary=[
                (fit_skills["Yoga"], True),
                (personal_skills["Mindfulness & Meditation"], False),
            ],
        )
        s13_1 = add_service(
            m13,
            "Beginner Yoga Session",
            "60 min introduction to yoga fundamentals.",
            60,
            25.0,
        )

        # 14. Spanish Tutor
        u14, m14 = make_mentor(
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
            ],
        )
        s14_1 = add_service(
            m14,
            "Conversational Spanish",
            "60 min speaking practice at your level.",
            60,
            28.0,
        )

        # 15. French Tutor
        u15, m15 = make_mentor(
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
        s15_1 = add_service(
            m15,
            "French Exam Preparation",
            "60 min on past papers, grammar, and oral practice.",
            60,
            32.0,
        )

        # 16. German Tutor
        u16, m16 = make_mentor(
            email="anna.schmidt@example.com",
            name="Anna Schmidt",
            bio="German native speaker teaching conversational German and business German. I help professionals relocating to Germany or working with German clients.",
            hourly_rate=30.0,
            years_exp=5,
            languages="English,German",
            session_format="online",
            tags="conversational_fluency,career_coaching",
            location="Berlin, Germany",
            skills_and_primary=[
                (lang_skills["German"], True),
            ],
        )
        s16_1 = add_service(
            m16, "Business German", "Learn German for professional contexts.", 60, 30.0
        )

        # 17. Guitar Teacher
        u17, m17 = make_mentor(
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
        s17_1 = add_service(
            m17, "Guitar Lesson", "45 min tailored to your level and goals.", 45, 25.0
        )

        # 18. Piano Teacher
        u18, m18 = make_mentor(
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
        s18_1 = add_service(
            m18,
            "Piano Lesson",
            "45 min covering technique, pieces, and theory.",
            45,
            30.0,
        )

        # 19. Photography Mentor
        u19, m19 = make_mentor(
            email="liam.doyle@example.com",
            name="Liam Doyle",
            bio="Professional photographer shooting weddings and portraits for 10 years. I teach camera basics, composition, lighting, and photo editing in Lightroom.",
            hourly_rate=35.0,
            years_exp=10,
            languages="English",
            session_format="both",
            tags="beginner_friendly,portfolio_building",
            location="Dublin, Ireland",
            skills_and_primary=[
                (creative_skills["Photography"], True),
            ],
        )
        s19_1 = add_service(
            m19,
            "Photography Basics",
            "Master your camera settings and composition fundamentals.",
            60,
            35.0,
        )

        # 20. Life Coach
        u20, m20 = make_mentor(
            email="rachel.fitzgerald@example.com",
            name="Rachel Fitzgerald",
            bio="Certified life coach helping people navigate career transitions, build confidence, and create sustainable habits. Warm, non-judgmental approach.",
            hourly_rate=40.0,
            years_exp=6,
            languages="English",
            session_format="online",
            tags="career_coaching,accountability_heavy",
            location="Galway, Ireland",
            skills_and_primary=[
                (personal_skills["Life Coaching"], True),
                (personal_skills["Goal Setting"], False),
                (personal_skills["Confidence Building"], False),
            ],
        )
        s20_1 = add_service(
            m20,
            "Goal Setting Session",
            "Clarify your goals and build an action plan.",
            60,
            40.0,
        )

        db.flush()

        # ══════════════════════════════════════════════════════════════
        # RECURRING PATTERNS & AVAILABILITY SLOTS
        # ══════════════════════════════════════════════════════════════
        print(" Creating availability patterns and slots...")

        def add_recurring_pattern(
            profile, day_of_week, start_time, end_time, weeks_ahead=8
        ):
            """Add a recurring pattern and generate slots"""
            generate_until = date.today() + timedelta(weeks=weeks_ahead)
            pattern = RecurringPattern(
                mentor_profile_id=profile.id,
                day_of_week=day_of_week,
                start_time=start_time,
                end_time=end_time,
                is_active=True,
                generate_until=generate_until,
            )
            db.add(pattern)
            db.flush()

            # Generate actual slots from this pattern
            day_map = {
                "MONDAY": 0,
                "TUESDAY": 1,
                "WEDNESDAY": 2,
                "THURSDAY": 3,
                "FRIDAY": 4,
                "SATURDAY": 5,
                "SUNDAY": 6,
            }
            target_day = day_map[day_of_week]

            current_date = datetime.now().date()
            for week in range(weeks_ahead):
                # Find the next occurrence of this day
                days_ahead = target_day - current_date.weekday()
                if days_ahead < 0:
                    days_ahead += 7
                days_ahead += week * 7

                slot_date = current_date + timedelta(days=days_ahead)

                # Parse time
                hour, minute = map(int, start_time.split(":"))
                end_hour, end_minute = map(int, end_time.split(":"))

                start_dt = datetime.combine(slot_date, time(hour, minute)).replace(
                    tzinfo=timezone.utc
                )
                end_dt = datetime.combine(
                    slot_date, time(end_hour, end_minute)
                ).replace(tzinfo=timezone.utc)

                slot = AvailabilitySlot(
                    mentor_profile_id=profile.id,
                    recurring_pattern_id=pattern.id,
                    start_time=start_dt,
                    end_time=end_dt,
                    status="available",
                )
                db.add(slot)

        # Add patterns for each mentor
        add_recurring_pattern(m1, "MONDAY", "18:00", "21:00")
        add_recurring_pattern(m1, "WEDNESDAY", "18:00", "21:00")

        add_recurring_pattern(m2, "TUESDAY", "19:00", "22:00")
        add_recurring_pattern(m2, "THURSDAY", "19:00", "22:00")

        add_recurring_pattern(m3, "MONDAY", "17:00", "20:00")
        add_recurring_pattern(m3, "FRIDAY", "17:00", "20:00")

        add_recurring_pattern(m4, "TUESDAY", "18:00", "21:00")
        add_recurring_pattern(m4, "SATURDAY", "10:00", "14:00")

        add_recurring_pattern(m5, "WEDNESDAY", "18:00", "21:00")
        add_recurring_pattern(m5, "THURSDAY", "18:00", "21:00")

        add_recurring_pattern(m6, "MONDAY", "19:00", "22:00")
        add_recurring_pattern(m6, "SATURDAY", "11:00", "15:00")

        add_recurring_pattern(m7, "TUESDAY", "17:00", "20:00")
        add_recurring_pattern(m7, "FRIDAY", "17:00", "20:00")

        add_recurring_pattern(m8, "MONDAY", "12:00", "15:00")
        add_recurring_pattern(m8, "WEDNESDAY", "12:00", "15:00")

        add_recurring_pattern(m9, "TUESDAY", "14:00", "18:00")
        add_recurring_pattern(m9, "THURSDAY", "14:00", "18:00")

        add_recurring_pattern(m10, "WEDNESDAY", "17:00", "20:00")
        add_recurring_pattern(m10, "SATURDAY", "10:00", "13:00")

        add_recurring_pattern(m11, "MONDAY", "07:00", "10:00")
        add_recurring_pattern(m11, "WEDNESDAY", "07:00", "10:00")
        add_recurring_pattern(m11, "FRIDAY", "07:00", "10:00")

        add_recurring_pattern(m12, "TUESDAY", "06:30", "09:00")
        add_recurring_pattern(m12, "THURSDAY", "06:30", "09:00")
        add_recurring_pattern(m12, "SATURDAY", "08:00", "11:00")

        add_recurring_pattern(m13, "MONDAY", "18:00", "20:00")
        add_recurring_pattern(m13, "WEDNESDAY", "18:00", "20:00")
        add_recurring_pattern(m13, "SATURDAY", "09:00", "12:00")

        add_recurring_pattern(m14, "TUESDAY", "17:00", "20:00")
        add_recurring_pattern(m14, "THURSDAY", "17:00", "20:00")

        add_recurring_pattern(m15, "MONDAY", "16:00", "19:00")
        add_recurring_pattern(m15, "WEDNESDAY", "16:00", "19:00")

        add_recurring_pattern(m16, "TUESDAY", "18:00", "21:00")
        add_recurring_pattern(m16, "FRIDAY", "18:00", "21:00")

        add_recurring_pattern(m17, "MONDAY", "20:00", "22:00")
        add_recurring_pattern(m17, "WEDNESDAY", "20:00", "22:00")

        add_recurring_pattern(m18, "TUESDAY", "15:00", "18:00")
        add_recurring_pattern(m18, "SATURDAY", "10:00", "13:00")

        add_recurring_pattern(m19, "SATURDAY", "10:00", "16:00")
        add_recurring_pattern(m19, "SUNDAY", "10:00", "16:00")

        add_recurring_pattern(m20, "MONDAY", "14:00", "17:00")
        add_recurring_pattern(m20, "THURSDAY", "14:00", "17:00")

        db.flush()

        # ══════════════════════════════════════════════════════════════
        # LEARNERS
        # ══════════════════════════════════════════════════════════════
        print(" Creating 10 learners...")

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

            return user, lp

        # Learner 1: CS Student
        l1_user, l1_profile = make_learner(
            email="jamie.brennan@example.com",
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
                (tech_skills["React"], "beginner", "intermediate"),
            ],
        )

        # Learner 2: Career Changer
        l2_user, l2_profile = make_learner(
            email="ciara.daly@example.com",
            name="Ciara Daly",
            bio="Transitioning from marketing to tech. Learning to code and build my portfolio.",
            cat=cat_technology,
            languages="English",
            fmt="online",
            min_p=0.0,
            max_p=60.0,
            level="beginner",
            goal_tags="career_change,portfolio_building",
            goal_desc="Break into tech as a frontend developer within 6 months.",
            availability="weekday_evenings,weekend_afternoons",
            location="Cork, Ireland",
            interests=[
                (tech_skills["JavaScript"], "beginner", "intermediate"),
                (tech_skills["React"], "beginner", "intermediate"),
                (design_skills["UI/UX Design"], "beginner", "intermediate"),
            ],
        )

        # Learner 3: Fitness Enthusiast
        l3_user, l3_profile = make_learner(
            email="fionn.mccarthy@example.com",
            name="Fionn McCarthy",
            bio="Looking to get stronger and train for my first marathon.",
            cat=cat_fitness,
            languages="English",
            fmt="both",
            min_p=0.0,
            max_p=40.0,
            level="intermediate",
            goal_tags="fitness",
            goal_desc="Run a sub-4 hour marathon and bench 100kg.",
            availability="weekday_mornings,weekend_mornings",
            location="Galway, Ireland",
            interests=[
                (fit_skills["Strength Training"], "intermediate", "advanced"),
                (fit_skills["Running"], "beginner", "intermediate"),
            ],
        )

        # Learner 4: Language Learner
        l4_user, l4_profile = make_learner(
            email="sophie.laurent@example.com",
            name="Sophie Laurent",
            bio="Planning a trip to South America, want to get conversational in Spanish.",
            cat=cat_languages,
            languages="English",
            fmt="online",
            min_p=0.0,
            max_p=35.0,
            level="beginner",
            goal_tags="conversational_fluency",
            goal_desc="Get conversational in Spanish before travelling in 3 months.",
            availability="weekday_evenings",
            location="Dublin, Ireland",
            interests=[
                (lang_skills["Spanish"], "beginner", "intermediate"),
            ],
        )

        # Learner 5: Music Student
        l5_user, l5_profile = make_learner(
            email="jack.oneill@example.com",
            name="Jack O'Neill",
            bio="Always wanted to learn guitar. Finally committing to it.",
            cat=cat_creative,
            languages="English",
            fmt="online",
            min_p=0.0,
            max_p=30.0,
            level="beginner",
            goal_tags="beginner_support",
            goal_desc="Play my first song within 2 months.",
            availability="weekday_evenings,weekend_afternoons",
            location="Limerick, Ireland",
            interests=[
                (creative_skills["Guitar"], "beginner", "intermediate"),
            ],
        )

        # Learner 6: Entrepreneur
        l6_user, l6_profile = make_learner(
            email="kate.murphy@example.com",
            name="Kate Murphy",
            bio="Building my first startup. Need help with strategy and fundraising.",
            cat=cat_business,
            languages="English",
            fmt="online",
            min_p=40.0,
            max_p=80.0,
            level="intermediate",
            goal_tags="startup_coaching,career_change",
            goal_desc="Launch my MVP and raise a pre-seed round within 6 months.",
            availability="weekday_afternoons,weekday_evenings",
            location="Dublin, Ireland",
            interests=[
                (biz_skills["Entrepreneurship"], "beginner", "intermediate"),
                (biz_skills["Product Management"], "beginner", "intermediate"),
            ],
        )

        # Learner 7: Job Seeker
        l7_user, l7_profile = make_learner(
            email="adam.collins@example.com",
            name="Adam Collins",
            bio="Recent graduate looking to land my first tech job.",
            cat=cat_business,
            languages="English",
            fmt="online",
            min_p=0.0,
            max_p=50.0,
            level="beginner",
            goal_tags="interview_prep,career_change",
            goal_desc="Get interview-ready and land a software engineering role.",
            availability="weekday_afternoons,weekend_mornings",
            location="Galway, Ireland",
            interests=[
                (biz_skills["CV Review"], None, None),
                (biz_skills["Interview Prep"], "beginner", "intermediate"),
            ],
        )

        # Learner 8: Designer
        l8_user, l8_profile = make_learner(
            email="olivia.brennan@example.com",
            name="Olivia Brennan",
            bio="Self-taught designer wanting to build a proper portfolio and learn Figma.",
            cat=cat_design,
            languages="English",
            fmt="online",
            min_p=0.0,
            max_p=45.0,
            level="beginner",
            goal_tags="portfolio_building",
            goal_desc="Build a portfolio strong enough to land freelance clients.",
            availability="weekday_evenings,weekend_afternoons",
            location="Cork, Ireland",
            interests=[
                (design_skills["UI/UX Design"], "beginner", "intermediate"),
                (design_skills["Figma"], "beginner", "intermediate"),
            ],
        )

        # Learner 9: Finance Learner
        l9_user, l9_profile = make_learner(
            email="daniel.ryan@example.com",
            name="Daniel Ryan",
            bio="Want to get my finances in order and start investing.",
            cat=cat_finance,
            languages="English",
            fmt="online",
            min_p=0.0,
            max_p=50.0,
            level="beginner",
            goal_tags="beginner_support",
            goal_desc="Build a budget and start investing in index funds.",
            availability="weekday_evenings",
            location="Dublin, Ireland",
            interests=[
                (fin_skills["Personal Budgeting"], "beginner", "intermediate"),
                (fin_skills["Investing Basics"], "beginner", "intermediate"),
            ],
        )

        # Learner 10: Wellness Seeker
        l10_user, l10_profile = make_learner(
            email="emma.doyle@example.com",
            name="Emma Doyle",
            bio="Looking to build a yoga practice and improve my mindfulness.",
            cat=cat_fitness,
            languages="English",
            fmt="both",
            min_p=0.0,
            max_p=30.0,
            level="beginner",
            goal_tags="fitness",
            goal_desc="Build a consistent yoga practice and manage stress better.",
            availability="weekday_mornings,weekend_mornings",
            location="Galway, Ireland",
            interests=[
                (fit_skills["Yoga"], "beginner", "intermediate"),
                (
                    personal_skills["Mindfulness & Meditation"],
                    "beginner",
                    "intermediate",
                ),
            ],
        )

        db.flush()

        # ══════════════════════════════════════════════════════════════
        # BOOKINGS
        # ══════════════════════════════════════════════════════════════
        print(" Creating bookings (completed, upcoming, pending, cancelled)...")

        # Helper to get random available slot for a mentor
        def get_random_slot(mentor_profile_id, days_offset_range):
            """Get a random available slot for a mentor within a date range"""
            min_days, max_days = days_offset_range
            slots = (
                db.query(AvailabilitySlot)
                .filter(
                    AvailabilitySlot.mentor_profile_id == mentor_profile_id,
                    AvailabilitySlot.status == "available",
                    AvailabilitySlot.start_time
                    >= datetime.now() + timedelta(days=min_days),
                    AvailabilitySlot.start_time
                    <= datetime.now() + timedelta(days=max_days),
                )
                .all()
            )
            return random.choice(slots) if slots else None

        def create_booking(
            learner_user,
            service,
            slot,
            status,
            days_ago=None,
            learner_confirmed=True,
            mentor_confirmed=True,
            note=None,
        ):
            """Create a booking with specified status"""
            booking = Booking(
                learner_id=learner_user.id,
                mentor_service_id=service.id,
                availability_slot_id=slot.id,
                start_time=slot.start_time,
                end_time=slot.end_time,
                learner_confirmed=learner_confirmed,
                mentor_confirmed=mentor_confirmed,
                learner_note=note,
                status=status,
                payment_status="paid",
                amount_paid=service.price,
            )

            if days_ago:
                booking.created_at = datetime.now() - timedelta(days=days_ago)

            db.add(booking)
            slot.status = "booked"
            return booking

        def create_past_slot(mentor_profile_id, days_ago, duration_hours=3):
            """Create a past availability slot for completed bookings"""
            start = datetime.now() - timedelta(days=days_ago)
            end = start + timedelta(hours=duration_hours)
            slot = AvailabilitySlot(
                mentor_profile_id=mentor_profile_id,
                start_time=start,
                end_time=end,
                status="available",
            )
            db.add(slot)
            db.flush()
            return slot

        # COMPLETED BOOKINGS (past sessions with reviews)
        # Jamie's completed Python sessions with Alex

        # Initialize all booking variables
        b1 = b2 = b3 = b4 = b5 = b6 = b7 = b8 = b9 = b10 = None
        b11 = b12 = b13 = b14 = b15 = b16 = b17 = b18 = b19 = b20 = None
        b21 = b22 = b23 = b24 = None

        slot = create_past_slot(m1.id, 25, 2)
        b1 = create_booking(l1_user, s1_1, slot, "completed", days_ago=25)
        db.flush()
        db.add(
            Review(
                mentor_profile_id=m1.id,
                reviewer_id=l1_user.id,
                rating=5.0,
                comment="Alex is an amazing teacher! Explained Python concepts super clearly. My project is finally working.",
            )
        )

        slot = create_past_slot(m1.id, 15, 2)
        b2 = create_booking(l1_user, s1_2, slot, "completed", days_ago=15)
        db.flush()
        db.add(
            Review(
                mentor_profile_id=m1.id,
                reviewer_id=l1_user.id,
                rating=5.0,
                comment="The code review was incredibly valuable. Alex spotted issues I never would have caught.",
            )
        )

        # Ciara's completed React sessions with Sara
        slot = create_past_slot(m2.id, 20, 2)
        b3 = create_booking(l2_user, s2_1, slot, "completed", days_ago=20)
        db.flush()
        db.add(
            Review(
                mentor_profile_id=m2.id,
                reviewer_id=l2_user.id,
                rating=4.5,
                comment="Really helpful session. Sara is patient and explains things well.",
            )
        )

        # Fionn's completed strength training with Nadia
        slot = create_past_slot(m11.id, 30, 1.5)
        b4 = create_booking(l3_user, s11_1, slot, "completed", days_ago=30)
        db.flush()
        db.add(
            Review(
                mentor_profile_id=m11.id,
                reviewer_id=l3_user.id,
                rating=5.0,
                comment="Nadia built me an amazing programme. Already seeing progress!",
            )
        )

        slot = create_past_slot(m11.id, 15, 1)
        b5 = create_booking(l3_user, s11_2, slot, "completed", days_ago=15)
        db.flush()
        db.add(
            Review(
                mentor_profile_id=m11.id,
                reviewer_id=l3_user.id,
                rating=5.0,
                comment="Form check was super helpful. Fixed my squat depth issue.",
            )
        )

        # Sophie's completed Spanish sessions with Lucia
        slot = create_past_slot(m14.id, 25, 1)
        b6 = create_booking(l4_user, s14_1, slot, "completed", days_ago=25)
        db.flush()
        db.add(
            Review(
                mentor_profile_id=m14.id,
                reviewer_id=l4_user.id,
                rating=5.0,
                comment="Lucia is fantastic! I'm already more confident speaking Spanish.",
            )
        )

        # Jack's completed guitar lesson with Conor
        slot = create_past_slot(m17.id, 15, 1)
        b7 = create_booking(l5_user, s17_1, slot, "completed", days_ago=15)
        db.flush()
        db.add(
            Review(
                mentor_profile_id=m17.id,
                reviewer_id=l5_user.id,
                rating=4.5,
                comment="Great first lesson. Conor is really encouraging.",
            )
        )

        # Kate's completed startup strategy with David
        slot = create_past_slot(m3.id, 10, 1)
        b8 = create_booking(l6_user, s3_1, slot, "completed", days_ago=10)
        db.flush()
        db.add(
            Review(
                mentor_profile_id=m3.id,
                reviewer_id=l6_user.id,
                rating=5.0,
                comment="David's advice was invaluable. Completely changed my approach to product strategy.",
            )
        )

        # Adam's completed CV review with Aoife
        slot = create_past_slot(m8.id, 20, 1)
        b9 = create_booking(l7_user, s8_1, slot, "completed", days_ago=20)
        db.flush()
        db.add(
            Review(
                mentor_profile_id=m8.id,
                reviewer_id=l7_user.id,
                rating=5.0,
                comment="Aoife transformed my CV. Got 3 interviews in the week after our session!",
            )
        )

        # Olivia's completed Figma session with Lucia (designer)
        slot = create_past_slot(m7.id, 12, 1)
        b10 = create_booking(l8_user, s7_1, slot, "completed", days_ago=12)
        db.flush()
        db.add(
            Review(
                mentor_profile_id=m7.id,
                reviewer_id=l8_user.id,
                rating=4.5,
                comment="Learned so much in one session. Lucia's teaching style is excellent.",
            )
        )

        # Daniel's completed financial planning with Sarah
        slot = create_past_slot(m10.id, 17, 1)
        b11 = create_booking(l9_user, s10_1, slot, "completed", days_ago=17)
        db.flush()
        db.add(
            Review(
                mentor_profile_id=m10.id,
                reviewer_id=l9_user.id,
                rating=5.0,
                comment="Finally feel in control of my finances. Sarah made everything so clear.",
            )
        )

        # Emma's completed yoga session with Maya
        slot = create_past_slot(m13.id, 9, 1)
        b12 = create_booking(l10_user, s13_1, slot, "completed", days_ago=9)
        db.flush()
        db.add(
            Review(
                mentor_profile_id=m13.id,
                reviewer_id=l10_user.id,
                rating=5.0,
                comment="Maya is wonderful. Already feel more flexible and relaxed.",
            )
        )

        # UPCOMING CONFIRMED BOOKINGS
        # Jamie's upcoming Python session
        slot = get_random_slot(m1.id, (3, 7))
        if slot:
            b13 = create_booking(
                l1_user,
                s1_1,
                slot,
                "confirmed",
                days_ago=2,
                note="Looking forward to learning about decorators!",
            )

        # Ciara's upcoming React Native session
        slot = get_random_slot(m2.id, (4, 8))
        if slot:
            b14 = create_booking(
                l2_user,
                s2_2,
                slot,
                "confirmed",
                days_ago=3,
                note="Want to build my first mobile app",
            )

        # Fionn's upcoming running coaching
        slot = get_random_slot(m12.id, (2, 6))
        if slot:
            b15 = create_booking(
                l3_user,
                s12_1,
                slot,
                "confirmed",
                days_ago=1,
                note="Training for Dublin marathon",
            )

        # Sophie's upcoming Spanish lesson
        slot = get_random_slot(m14.id, (5, 9))
        if slot:
            b16 = create_booking(
                l4_user,
                s14_1,
                slot,
                "confirmed",
                days_ago=2,
                note="Want to practice past tense",
            )

        # Kate's upcoming startup coaching
        slot = get_random_slot(m3.id, (6, 10))
        if slot:
            b17 = create_booking(
                l6_user,
                s3_2,
                slot,
                "confirmed",
                days_ago=4,
                note="Need advice on tech stack for MVP",
            )

        # Adam's upcoming mock interview
        slot = get_random_slot(m8.id, (3, 7))
        if slot:
            b18 = create_booking(
                l7_user,
                s8_2,
                slot,
                "confirmed",
                days_ago=1,
                note="Preparing for Google interview",
            )

        # Olivia's upcoming portfolio review
        slot = get_random_slot(m7.id, (4, 8))
        if slot:
            b19 = create_booking(
                l8_user,
                s7_2,
                slot,
                "confirmed",
                days_ago=2,
                note="Want feedback on my case studies",
            )

        # Emma's upcoming yoga session
        slot = get_random_slot(m13.id, (2, 6))
        if slot:
            b20 = create_booking(l10_user, s13_1, slot, "confirmed", days_ago=1)

        # PENDING CONFIRMATIONS (mentor not yet confirmed)
        slot = get_random_slot(m4.id, (7, 14))
        if slot:
            b21 = create_booking(
                l1_user,
                s4_1,
                slot,
                "confirmed",
                days_ago=0,
                learner_confirmed=True,
                mentor_confirmed=False,
                note="Want to learn about neural networks",
            )

        slot = get_random_slot(m5.id, (5, 10))
        if slot:
            b22 = create_booking(
                l2_user,
                s5_1,
                slot,
                "confirmed",
                days_ago=0,
                learner_confirmed=True,
                mentor_confirmed=False,
                note="Preparing for AWS Solutions Architect exam",
            )

            # CANCELLED BOOKINGS
            b23 = None
            b24 = None

        slot = get_random_slot(m1.id, (-10, -5))
        if slot:
            b23 = create_booking(
                l1_user, s1_1, slot, "cancelled_by_learner", days_ago=8
            )
            slot.status = "available"  # Slot becomes available again

        slot = get_random_slot(m14.id, (-8, -3))
        if slot:
            b24 = create_booking(
                l4_user, s14_1, slot, "cancelled_by_mentor", days_ago=5
            )
            slot.status = "available"

        db.flush()

        # ══════════════════════════════════════════════════════════════
        # CANCELLATION INFRASTRUCTURE
        # ══════════════════════════════════════════════════════════════
        print(" Creating cancellation policies and records...")

        # Cancellation reasons
        reasons = [
            "Personal emergency",
            "Schedule conflict",
            "Health/Illness",
            "Technical issues",
            "Other",
        ]
        cancellation_reasons = {}
        for reason in reasons:
            cr = CancellationReason(reason_text=reason)
            db.add(cr)
            db.flush()
            cancellation_reasons[reason] = cr

        # Cancellation policies
        policy1 = CancellationPolicy(
            affected_party="LEARNER",
            days_before_session=1,
            consequence_type="FREE_SESSION",
            consequence_value=20.0,
        )
        db.add(policy1)

        # Add cancellation records for the cancelled bookings
        if b23:
            c1 = Cancellation(
                booking_id=b23.id,
                cancelled_by="LEARNER",
                reason_id=cancellation_reasons["Schedule conflict"].id,
                policy_applied_id=policy1.id,
                consequence_issued="NONE",
                consequence_value=0.0,
            )
            db.add(c1)

        if b24:
            c2 = Cancellation(
                booking_id=b24.id,
                cancelled_by="MENTOR",
                reason_id=cancellation_reasons["Personal emergency"].id,
                policy_applied_id=None,
                consequence_issued="NONE",
                consequence_value=0.0,
            )
            db.add(c2)

        db.flush()

        # ══════════════════════════════════════════════════════════════
        # RESCHEDULE REQUESTS
        # ══════════════════════════════════════════════════════════════
        print(" Creating reschedule requests...")

        # Get some future slots for reschedule requests
        future_slot_1 = get_random_slot(m1.id, (10, 20))
        future_slot_2 = get_random_slot(m14.id, (12, 22))

        if b13 and future_slot_1:  # Jamie's upcoming Python session
            rr1 = RescheduleRequest(
                booking_id=b13.id,
                initiated_by="LEARNER",
                from_slot_id=b13.availability_slot_id,
                suggested_slot_ids=str(future_slot_1.id),
                reason="Have an exam that week, need to push back a few days",
                status="pending",
                expires_at=datetime.now() + timedelta(days=30),
            )
            db.add(rr1)

        if b16 and future_slot_2:  # Sophie's Spanish lesson
            rr2 = RescheduleRequest(
                booking_id=b16.id,
                initiated_by="MENTOR",
                from_slot_id=b16.availability_slot_id,
                preferred_date_start=(datetime.now() + timedelta(days=14)).date(),
                preferred_date_end=(datetime.now() + timedelta(days=21)).date(),
                reason="Double-booked that slot, my apologies. Happy to accommodate any day the following week.",
                status="pending",
                expires_at=datetime.now() + timedelta(days=30),
            )
            db.add(rr2)

        db.flush()

        # ══════════════════════════════════════════════════════════════
        # LEARNER STREAKS & MENTOR STATS
        # ══════════════════════════════════════════════════════════════
        print(" Creating streaks and statistics...")

        # Learner streaks for active learners
        ls1 = LearnerStreak(
            learner_id=l1_user.id,
            freeze_credits=2,
            current_week_active=True,
            last_session_date=datetime.now() - timedelta(days=5),
            total_sessions_month=3,
            most_active_skill="Python",
            most_active_day="MONDAY",
        )
        db.add(ls1)

        ls2 = LearnerStreak(
            learner_id=l3_user.id,
            freeze_credits=1,
            current_week_active=True,
            last_session_date=datetime.now() - timedelta(days=3),
            total_sessions_month=2,
            most_active_skill="Strength Training",
            most_active_day="MONDAY",
        )
        db.add(ls2)

        # Mentor stats
        ms1 = MentorStats(
            mentor_profile_id=m1.id,
            total_sessions_completed=2,
            cancellation_rate=0.0,
            average_rating=5.0,
            learners_this_month=1,
            most_active_learner_skill="Python",
            busiest_day="MONDAY",
            peak_hours="18-21",
        )
        db.add(ms1)

        ms2 = MentorStats(
            mentor_profile_id=m11.id,
            total_sessions_completed=2,
            cancellation_rate=0.0,
            average_rating=5.0,
            learners_this_month=1,
            most_active_learner_skill="Strength Training",
            busiest_day="MONDAY",
            peak_hours="07-10",
        )
        db.add(ms2)

        ms3 = MentorStats(
            mentor_profile_id=m14.id,
            total_sessions_completed=1,
            cancellation_rate=0.5,  # 1 completed, 1 cancelled
            average_rating=5.0,
            learners_this_month=1,
            most_active_learner_skill="Spanish",
            busiest_day="TUESDAY",
            peak_hours="17-20",
        )
        db.add(ms3)

        db.flush()

        # ══════════════════════════════════════════════════════════════
        # PUSH TOKENS & NOTIFICATIONS
        # ══════════════════════════════════════════════════════════════
        print(" Creating notifications and push tokens...")

        # Push tokens for some users
        pt1 = PushToken(
            user_id=l1_user.id,
            platform="IOS",
            expo_push_token="ExponentPushToken[jamie-test-token]",
            is_active=True,
        )
        db.add(pt1)

        pt2 = PushToken(
            user_id=u1.id,
            platform="ANDROID",
            expo_push_token="ExponentPushToken[alex-test-token]",
            is_active=True,
        )
        db.add(pt2)

        # Session reminder notification
        if b13:
            n1 = Notification(
                user_id=l1_user.id,
                user_type="LEARNER",
                notification_type="SESSION_REMINDER",
                booking_id=b13.id,
                title="Session Reminder",
                body=f"Your Python Fundamentals session with Alex Murphy is in 24 hours.",
                delivery_method="BOTH",
                scheduled_for=b13.start_time - timedelta(hours=24),
                sent_at=None,
            )
            db.add(n1)

        # Reschedule request notification
        if rr1:
            n2 = Notification(
                user_id=u1.id,
                user_type="MENTOR",
                notification_type="RESCHEDULE_REQUEST",
                booking_id=b13.id,
                reschedule_request_id=rr1.id,
                title="Reschedule Request",
                body="Jamie Brennan has requested to reschedule your upcoming session.",
                action_url=f"/reschedule-requests/{rr1.id}",
                delivery_method="BOTH",
                scheduled_for=datetime.now(),
                sent_at=datetime.now(),
                read_at=None,
            )
            db.add(n2)

        # Review reminder
        if b2:
            n3 = Notification(
                user_id=l1_user.id,
                user_type="LEARNER",
                notification_type="SESSION_REMINDER",
                booking_id=b2.id,
                title="Leave a Review",
                body="How was your Code Review session with Alex? Leave a review to help other learners.",
                action_url=f"/bookings/{b2.id}/review",
                delivery_method="IN_APP",
                scheduled_for=datetime.now() - timedelta(days=14),
                sent_at=datetime.now() - timedelta(days=14),
                read_at=None,
            )
            db.add(n3)

        db.flush()

        # ══════════════════════════════════════════════════════════════
        # MENTOR RESOURCES
        # ══════════════════════════════════════════════════════════════
        print(" Creating mentor resources...")

        # Alex's Python resources
        r1 = MentorResource(
            mentor_profile_id=m1.id,
            title="Python Cheat Sheet",
            type="link",
            content="https://www.pythoncheatsheet.org/",
            is_public=True,
        )
        db.add(r1)

        r2 = MentorResource(
            mentor_profile_id=m1.id,
            title="FastAPI Tutorial",
            type="video",
            content="https://www.youtube.com/watch?v=0sOvCWFmrtA",
            is_public=True,
        )
        db.add(r2)

        # Sara's React resources
        r3 = MentorResource(
            mentor_profile_id=m2.id,
            title="React Docs",
            type="link",
            content="https://react.dev/",
            is_public=True,
        )
        db.add(r3)

        # Nadia's strength training notes
        r4 = MentorResource(
            mentor_profile_id=m11.id,
            title="Beginner Programme Template",
            type="note",
            content="3x per week full-body split:\nDay 1: Squat 3x8, Bench 3x8, Rows 3x10\nDay 2: Deadlift 3x5, OHP 3x8, Pull-ups 3x8\nDay 3: Front Squat 3x10, Incline Press 3x10, Face Pulls 3x15",
            is_public=False,
        )
        db.add(r4)

        db.flush()

        db.commit()

        # ══════════════════════════════════════════════════════════════
        # SUMMARY
        # ══════════════════════════════════════════════════════════════
        print("\n Seed complete!\n")
        print("=" * 60)
        print("DATABASE SUMMARY")
        print("=" * 60)
        print(f" Categories: 8")
        print(f" Skills: 80+")
        print(f" Mentors: 20")
        print(f" Learners: 10")
        print(f" Availability Slots: {db.query(AvailabilitySlot).count()}")
        print(f" Bookings: {db.query(Booking).count()}")
        print(
            f"   - Completed: {db.query(Booking).filter(Booking.status == 'completed').count()}"
        )
        print(
            f"   - Confirmed: {db.query(Booking).filter(Booking.status == 'confirmed').count()}"
        )
        print(
            f"   - Cancelled: {db.query(Booking).filter(Booking.status.like('cancelled%')).count()}"
        )
        print(f" Reviews: {db.query(Review).count()}")
        print(f" Reschedule Requests: {db.query(RescheduleRequest).count()}")
        print(f" Notifications: {db.query(Notification).count()}")
        print("")
        print("=" * 60)
        print("TEST CREDENTIALS")
        print("=" * 60)
        print("\n All passwords: mentor123 (mentors) | learner123 (learners)\n")

        print("MENTORS:")
        print("-" * 60)
        mentors = [
            ("alex.murphy@example.com", "Python / Backend"),
            ("sara.obrien@example.com", "React / Frontend"),
            ("david.oconnor@example.com", "Full-Stack / Startup"),
            ("priya.sharma@example.com", "Data Science / ML"),
            ("michael.chen@example.com", "DevOps / Cloud"),
            ("emma.walsh@example.com", "iOS / Android"),
            ("lucia.martinez@example.com", "UI/UX Design"),
            ("aoife.kelly@example.com", "CV / Career Coaching"),
            ("james.thornton@example.com", "Business Strategy"),
            ("sarah.flynn@example.com", "Financial Planning"),
            ("nadia.walsh@example.com", "Strength Training"),
            ("tom.brennan@example.com", "Running"),
            ("maya.patel@example.com", "Yoga"),
            ("lucia.fernandez@example.com", "Spanish"),
            ("pierre.martin@example.com", "French"),
            ("anna.schmidt@example.com", "German"),
            ("conor.ryan@example.com", "Guitar"),
            ("mei.zhang@example.com", "Piano"),
            ("liam.doyle@example.com", "Photography"),
            ("rachel.fitzgerald@example.com", "Life Coaching"),
        ]
        for email, specialty in mentors:
            print(f"  {email:40} | {specialty}")

        print("\nLEARNERS:")
        print("-" * 60)
        learners = [
            ("jamie.brennan@example.com", "CS Student (Python, React)"),
            ("ciara.daly@example.com", "Career Changer (JS, React, UX)"),
            ("fionn.mccarthy@example.com", "Fitness (Strength, Running)"),
            ("sophie.laurent@example.com", "Language (Spanish)"),
            ("jack.oneill@example.com", "Music (Guitar)"),
            ("kate.murphy@example.com", "Entrepreneur (Startup)"),
            ("adam.collins@example.com", "Job Seeker (CV, Interview)"),
            ("olivia.brennan@example.com", "Designer (UX, Figma)"),
            ("daniel.ryan@example.com", "Finance (Budgeting, Investing)"),
            ("emma.doyle@example.com", "Wellness (Yoga, Mindfulness)"),
        ]
        for email, description in learners:
            print(f"  {email:40} | {description}")

        print("\n" + "=" * 60)
        print("DEMO FEATURES")
        print("=" * 60)
        print(" Completed bookings with reviews and ratings")
        print(" Upcoming confirmed sessions")
        print(" Pending confirmations (mentor approval needed)")
        print(" Cancelled bookings with reasons")
        print(" Active reschedule requests")
        print(" Learner streaks and freeze credits")
        print(" Mentor earnings and statistics")
        print(" Recurring availability patterns")
        print(" Push notifications and in-app alerts")
        print(" Mentor resources (links, videos, notes)")
        print("=" * 60)

    except Exception as e:
        db.rollback()
        print(f"\n Seed failed: {e}")
        import traceback

        traceback.print_exc()
        raise
    finally:
        db.close()


if __name__ == "__main__":
    seed()
