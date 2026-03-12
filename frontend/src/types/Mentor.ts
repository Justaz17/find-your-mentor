export interface Skill {
  id: number;
  name: string;
  category_id: number | null;
}

export interface Category {
  id: number;
  name: string;
  description: string | null;
  icon: string | null;
  skills: Skill[];
}

export interface MentorProfile {
  id: number;
  user_id: number;
  user_name: string;
  bio: string;
  hourly_rate: number;
  is_visible: boolean;
  skills: Skill[];
  average_rating: number | null;
  total_reviews: number;
  // Smart sort fields
  years_experience: number | null;
  languages: string | null;
  session_format: string | null;
  location: string | null;
  tags: string | null;
  relevance_score: number | null;
  match_reasons: string[];
  available_slot_count: number;
}

export interface Review {
  id: number;
  mentor_profile_id: number;
  reviewer_id: number;
  reviewer_name: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

export interface AvailabilitySlot {
  id: number;
  mentor_profile_id: number;
  start_time: string;
  end_time: string;
  status: string;
  created_at: string;
}

export interface MentorService {
  id: number;
  mentor_profile_id: number;
  title: string;
  description: string | null;
  duration_minutes: number;
  price: number;
  is_active: boolean;
}

export interface Booking {
  id: number;
  learner_id: number;
  learner_name: string;
  mentor_service_id: number;
  service_title: string;
  availability_slot_id: number;
  slot_start: string;
  slot_end: string;
  learner_note: string | null;
  status: string;
  payment_status: string;
  amount_paid: number;
  created_at: string;
}

export interface MentorResource {
  id: number;
  mentor_profile_id: number;
  title: string;
  type: string;
  content: string;
  is_public: boolean;
  created_at: string;
}

export interface SearchFilters {
  query: string;
  category_id: number | null;
  skill: string;
  language: string;
  min_price: number | null;
  max_price: number | null;
  session_format: string | null;
}