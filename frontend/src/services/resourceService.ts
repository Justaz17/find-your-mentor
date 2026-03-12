import api from './api';
import { MentorResource } from '../types/Mentor';

export const getMentorResources = async (mentorId: number): Promise<MentorResource[]> => {
  const response = await api.get<MentorResource[]>(`/resources/mentor/${mentorId}`);
  return response.data;
};

export const createResource = async (data: {
  title: string;
  type: string;
  content: string;
  is_public?: boolean;
}): Promise<MentorResource> => {
  const response = await api.post<MentorResource>('/resources/me', data);
  return response.data;
};

export const deleteResource = async (resourceId: number): Promise<void> => {
  await api.delete(`/resources/me/${resourceId}`);
};