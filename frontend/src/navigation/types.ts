import { LearnerProfile } from "../types/Learner";

export type RootStackParamList = {
  Auth: { initialTab?: 'login' | 'register'; wantsMentor?: boolean } | undefined;
  Onboarding: undefined;
  Main: undefined;
  MentorProfile: { mentorId: number };
  BookSession: { mentorId: number; preselectedDate?: string };
  BookingConfirmation: {
    mentorId: number;
    serviceId: number;
    slotId: number;
    serviceName: string;
    price: number;
    slotStart: string;
    slotEnd: string;
  };
  MentorAvailability: undefined;
  Search: { query?: string; category_id?: number };
  LearnerProfile: undefined;
  EditLearnerProfile: { profile?: LearnerProfile };
  ManageServices: undefined;
  MentorOnboarding: undefined;
  MentorEditProfile: undefined;
  SessionsList: { filter?: 'upcoming' | 'pending' | 'completed' };
  Earnings: undefined;
  Notifications: undefined;
  Reviews: undefined;
};

export type TabParamList = {
  Home: undefined;
  Search: undefined;
  Bookings: undefined;
  Notifications: undefined;
  Dashboard: undefined;
  LearnerDashboard: undefined;
  Login: undefined;
};