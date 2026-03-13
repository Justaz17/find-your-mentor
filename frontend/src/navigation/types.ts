import { LearnerProfile } from "../types/Learner";

export type RootStackParamList = {
  Auth: undefined;
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
};

export type TabParamList = {
  Home: undefined;
  Search: undefined;
  Bookings: undefined;
  Dashboard: undefined;
};