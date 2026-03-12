import api from './api';
import { LearnerProfile, LearnerProfileCreate } from '../types/Learner';

/**
 * Get current user's learner profile
 * GET /learners/profile/me
 */
export const getMyLearnerProfile = async (): Promise<LearnerProfile> => {
  const response = await api.get<LearnerProfile>('/learners/profile/me');
  return response.data;
};

/**
 * Create or update learner profile
 * POST /learners/profile
 */
export const saveMyLearnerProfile = async (
  data: LearnerProfileCreate
): Promise<LearnerProfile> => {
  const response = await api.post<LearnerProfile>('/learners/profile', data);
  return response.data;
};

/**
 * Delete learner profile
 * DELETE /learners/profile/me
 */
export const deleteMyLearnerProfile = async (): Promise<void> => {
  await api.delete('/learners/profile/me');
};