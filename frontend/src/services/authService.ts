import api from './api';
import { User, UserCreate, UserLogin, AuthResponse } from '../types/User';

/**
 * Register a new user account
 * POST /auth/register
 */
export const register = async (userData: UserCreate): Promise<User> => {
  const response = await api.post<User>('/auth/register', userData);
  return response.data;
};

/**
 * Login with email and password, returns JWT token
 * POST /auth/login
 */
export const login = async (credentials: UserLogin): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>('/auth/login', credentials);
  return response.data;
};

/**
 * Get current user profile using stored token
 * GET /mentors/me (or a dedicated user endpoint if you add one)
 */
export const getCurrentUser = async (): Promise<User> => {
  const response = await api.get<User>('/auth/me');
  return response.data;
};