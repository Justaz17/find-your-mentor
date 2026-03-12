// frontend/src/services/availabilityService.ts

import api from './api';
import {
  AvailabilitySlot,
  RecurringPattern,
  CreateAvailabilitySlotInput,
  CreateRecurringPatternInput,
  UpdateRecurringPatternInput,
} from '../types/Availability';

/**
 * Get all availability slots for the current mentor
 * GET /availability/mentors/me/availability
 */
export const getMentorAvailabilitySlots = async (): Promise<AvailabilitySlot[]> => {
  const response = await api.get<AvailabilitySlot[]>('/availability/mentors/me/availability');
  return response.data;
};

/**
 * Get all availability slots for a specific mentor (for learners viewing)
 * GET /availability/mentors/{mentorId}/availability
 */
export const getAvailabilitySlotsForMentor = async (mentorId: number): Promise<AvailabilitySlot[]> => {
  const response = await api.get<AvailabilitySlot[]>(
    `/availability/mentors/${mentorId}/availability`
  );
  return response.data;
};

/**
 * Create an ad-hoc availability slot
 * POST /availability/mentors/me/availability
 */
export const createAvailabilitySlot = async (
  slot: CreateAvailabilitySlotInput
): Promise<AvailabilitySlot> => {
  const response = await api.post<AvailabilitySlot>(
    '/availability/mentors/me/availability',
    slot
  );
  return response.data;
};

/**
 * Delete an availability slot
 * DELETE /availability/mentors/me/availability/{slotId}
 */
export const deleteAvailabilitySlot = async (slotId: number): Promise<void> => {
  await api.delete(`/availability/mentors/me/availability/${slotId}`);
};

/**
 * Get all recurring patterns for the current mentor
 * GET /recurring/mentors/me/recurring
 */
export const getMentorRecurringPatterns = async (): Promise<RecurringPattern[]> => {
  const response = await api.get<RecurringPattern[]>('/recurring/mentors/me/recurring');
  return response.data;
};

/**
 * Create a new recurring pattern
 * POST /recurring/mentors/me/recurring
 */
export const createRecurringPattern = async (
  pattern: CreateRecurringPatternInput
): Promise<RecurringPattern> => {
  const response = await api.post<RecurringPattern>(
    '/recurring/mentors/me/recurring',
    pattern
  );
  return response.data;
};

/**
 * Update a recurring pattern (toggle active or extend generate_until)
 * PATCH /recurring/mentors/me/recurring/{patternId}
 */
export const updateRecurringPattern = async (
  patternId: number,
  updates: UpdateRecurringPatternInput
): Promise<RecurringPattern> => {
  const response = await api.patch<RecurringPattern>(
    `/recurring/mentors/me/recurring/${patternId}`,
    updates
  );
  return response.data;
};

/**
 * Delete a recurring pattern
 * DELETE /recurring/mentors/me/recurring/{patternId}
 */
export const deleteRecurringPattern = async (patternId: number): Promise<void> => {
  await api.delete(`/recurring/mentors/me/recurring/${patternId}`);
};