import api from './api';
import { MentorProfile, Category, AvailabilitySlot, SearchFilters } from '../types/Mentor';

/**
 * Get all visible mentors, optionally filtered by skill
 * GET /mentors?skill=Python
 */
export const getMentors = async (skill?: string): Promise<MentorProfile[]> => {
  const params = skill ? { skill } : {};
  const response = await api.get<MentorProfile[]>('/mentors', { params });
  return response.data;
};

/**
 * Search mentors with filters and smart sort
 * GET /mentors/search
 */
export const searchMentors = async (
  filters: Partial<SearchFilters>,
  limit = 20,
  offset = 0
): Promise<MentorProfile[]> => {
  const params: Record<string, any> = { limit, offset };

  if (filters.category_id) params.category_id = filters.category_id;
  if (filters.skill?.trim()) params.skill = filters.skill.trim();
  if (filters.language?.trim()) params.language = filters.language.trim();
  if (filters.min_price != null) params.min_price = filters.min_price;
  if (filters.max_price != null) params.max_price = filters.max_price;
  if (filters.session_format) params.session_format = filters.session_format;

  const response = await api.get<MentorProfile[]>('/mentors/search', { params });
  return response.data;
};

/**
 * Get a random visible mentor with available slots
 * GET /mentors/random
 */
export const getRandomMentor = async (): Promise<MentorProfile> => {
  const response = await api.get<MentorProfile>('/mentors/random');
  return response.data;
};

/**
 * Get all categories with their skills — used to populate filter UI
 * GET /mentors/categories
 */
export const getCategories = async (): Promise<Category[]> => {
  const response = await api.get<Category[]>('/mentors/categories');
  return response.data;
};

/**
 * Get a specific mentor profile by ID
 * GET /mentors/{id}
 */
export const getMentorById = async (id: number): Promise<MentorProfile> => {
  const response = await api.get<MentorProfile>(`/mentors/${id}`);
  return response.data;
};

/**
 * Create or update the current user's mentor profile
 * POST /mentors/me/profile
 */
export const createOrUpdateMentorProfile = async (profile: {
  bio: string;
  hourly_rate: number;
  skills: string[];
  is_visible?: boolean;
  years_experience?: number;
  languages?: string;
  session_format?: string;
  location?: string;
  tags?: string;
}): Promise<MentorProfile> => {
  const response = await api.post<MentorProfile>('/mentors/me/profile', profile);
  return response.data;
};

/**
 * Get availability slots for a mentor
 * GET /availability/mentors/{id}/availability
 */
export const getMentorAvailability = async (mentorId: number): Promise<AvailabilitySlot[]> => {
  const response = await api.get<AvailabilitySlot[]>(
    `/availability/mentors/${mentorId}/availability`
  );
  return response.data;
};