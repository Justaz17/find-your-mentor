import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../utils/constants';

// -- Auth event emitter --
// to allows non-React code (this file) to notify React (AuthContext) of 401s
type AuthListener = () => void;
let authExpiredListener: AuthListener | null = null;

export const onAuthExpired = (listener: AuthListener) => {
  authExpiredListener = listener;
};

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000,
});

// Request interceptor - attach JWT token to every request if available
api.interceptors.request.use(
  async (config) => {
    try {
      const token = await AsyncStorage.getItem('token');
      if (token) {
        config.headers.Authorization = `Bearer ${token}`;
      }
    } catch (error) {
      console.error('Error reading token from storage:', error);
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor - handle common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      const { status, data } = error.response;

      if (status === 401) {
        // Token expired - notify AuthContext to sign out
        if (authExpiredListener) {
          authExpiredListener();
        }
      }

      const message = data?.detail || data?.message || 'Something went wrong';
      return Promise.reject(new Error(message));
    }

    if (error.request) {
      return Promise.reject(new Error('Network error — check your connection'));
    }

    return Promise.reject(error);
  }
);

export default api;