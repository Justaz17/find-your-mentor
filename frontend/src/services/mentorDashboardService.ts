import api from './api';

export interface DashboardStats {
  total_earnings: number;
  earnings_this_month: number;
  total_sessions: number;
  sessions_this_month: number;
  average_rating: number | null;
  total_reviews: number;
  pending_count: number;
  upcoming_count: number;
}

export interface DashboardBooking {
  id: number;
  learner_name: string;
  service_title: string;
  slot_start: string;
  slot_end: string;
  status: string;
  payment_status: string;
  amount_paid: number;
  learner_note: string | null;
}

export interface DashboardReview {
  id: number;
  reviewer_name: string;
  rating: number;
  comment: string | null;
  created_at: string;
}

export interface MentorDashboardData {
  stats: DashboardStats;
  pending_bookings: DashboardBooking[];
  upcoming_bookings: DashboardBooking[];
  recent_reviews: DashboardReview[];
  has_profile: boolean;
}

export const getMentorDashboard = async (): Promise<MentorDashboardData> => {
  const response = await api.get<MentorDashboardData>('/mentor-dashboard');
  return response.data;
};

export const approveBooking = async (bookingId: number): Promise<void> => {
  await api.post(`/bookings/${bookingId}/approve`);
};

export const denyBooking = async (bookingId: number): Promise<void> => {
  await api.post(`/bookings/${bookingId}/deny`);
};