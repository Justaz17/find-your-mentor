export interface LearnerInterest {
  id: number;
  skill_id: number;
  skill_name: string;
  current_level: string | null;
  target_level: string | null;
}

export interface LearnerProfile {
  id: number;
  user_id: number;
  bio: string | null;
  preferred_category_id: number | null;
  preferred_category_name: string | null;
  preferred_languages: string | null;
  preferred_session_format: string | null;
  min_price: number | null;
  max_price: number | null;
  experience_level: string | null;
  location: string | null;
  goal_tags: string | null;
  goal_description: string | null;
  availability_preference: string | null;
  interests: LearnerInterest[];
}

export interface LearnerInterestCreate {
  skill_id: number;
  current_level: string | null;
  target_level: string | null;
}

export interface LearnerProfileCreate {
  bio?: string;
  preferred_category_id?: number | null;
  preferred_languages?: string;
  preferred_session_format?: string | null;
  min_price?: number | null;
  max_price?: number | null;
  experience_level?: string | null;
  location?: string;
  goal_tags?: string;
  goal_description?: string;
  availability_preference?: string;
  interests: LearnerInterestCreate[];
}

// ── Display helpers ───────────────────────────────────────────────────────

export const EXPERIENCE_LEVELS = ['beginner', 'intermediate', 'advanced'] as const;

export const SESSION_FORMATS = [
  { label: 'Online', value: 'online' },
  { label: 'In person', value: 'in_person' },
  { label: 'Both', value: 'both' },
] as const;

export const GOAL_TAGS = [
  { label: 'Exam prep', value: 'exam_prep' },
  { label: 'Beginner support', value: 'beginner_support' },
  { label: 'Career change', value: 'career_change' },
  { label: 'Fitness', value: 'fitness' },
  { label: 'Conversational fluency', value: 'conversational_fluency' },
  { label: 'Portfolio building', value: 'portfolio_building' },
  { label: 'Interview prep', value: 'interview_prep' },
  { label: 'Startup coaching', value: 'startup_coaching' },
] as const;

export const AVAILABILITY_WINDOWS = [
  { label: 'Weekday mornings', value: 'weekday_mornings' },
  { label: 'Weekday afternoons', value: 'weekday_afternoons' },
  { label: 'Weekday evenings', value: 'weekday_evenings' },
  { label: 'Weekend mornings', value: 'weekend_mornings' },
  { label: 'Weekend afternoons', value: 'weekend_afternoons' },
  { label: 'Weekend evenings', value: 'weekend_evenings' },
] as const;