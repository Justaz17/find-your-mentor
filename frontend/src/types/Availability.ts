// Add to frontend/src/types/Availability.ts

export type AvailabilitySlotStatus = 'available' | 'booked' | 'cancelled';

export interface AvailabilitySlot {
  id: number;
  mentor_profile_id: number;
  recurring_pattern_id: number | null;
  start_time: string; // ISO datetime
  end_time: string; // ISO datetime
  status: AvailabilitySlotStatus;
  created_at: string;
  updated_at: string;
}

export interface RecurringPattern {
  id: number;
  mentor_profile_id: number;
  day_of_week: string; // MONDAY, TUESDAY, etc.
  start_time: string; // HH:MM format
  end_time: string; // HH:MM format
  is_active: boolean;
  generate_until: string; // YYYY-MM-DD
}

export interface CreateAvailabilitySlotInput {
  start_time: string; // ISO datetime
  end_time: string; // ISO datetime
}

export interface CreateRecurringPatternInput {
  day_of_week: string;
  start_time: string; // HH:MM
  end_time: string; // HH:MM
  generate_until: string; // YYYY-MM-DD
}

export interface UpdateRecurringPatternInput {
  is_active?: boolean;
  generate_until?: string;
  start_time?: string;
  end_time?: string;
}