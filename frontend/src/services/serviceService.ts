import api from './api';
import { MentorService } from '../types/Mentor';

export const getMentorServices = async (mentorId: number): Promise<MentorService[]> => {
  const response = await api.get<MentorService[]>(`/services/mentor/${mentorId}`);
  return response.data;
};

export const getMyServices = async (): Promise<MentorService[]> => {
  const response = await api.get<MentorService[]>('/services/me');
  return response.data;
};

export const createService = async (data: {
  title: string;
  description?: string;
  duration_minutes: number;
  price: number;
  is_active?: boolean;
}): Promise<MentorService> => {
  const response = await api.post<MentorService>('/services/me', {
    ...data,
    is_active: data.is_active ?? true,
  });
  return response.data;
};

export const updateService = async (
  serviceId: number,
  data: Partial<MentorService>
): Promise<MentorService> => {
  const response = await api.put<MentorService>(`/services/me/${serviceId}`, data);
  return response.data;
};

export const deleteService = async (serviceId: number): Promise<void> => {
  await api.delete(`/services/me/${serviceId}`);
};