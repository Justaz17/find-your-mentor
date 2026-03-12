import api from './api';
import { Review } from '../types/Mentor';

export const getMentorReviews = async (mentorId: number): Promise<Review[]> => {
  const response = await api.get<Review[]>(`/reviews/mentors/${mentorId}`);
  return response.data;
};

export const createReview = async (
  mentorId: number,
  data: { rating: number; comment?: string }
): Promise<Review> => {
  const response = await api.post<Review>(`/reviews/mentors/${mentorId}`, data);
  return response.data;
};

export const deleteReview = async (reviewId: number): Promise<void> => {
  await api.delete(`/reviews/${reviewId}`);
};