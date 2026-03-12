import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { API_BASE_URL } from '../utils/constants';

// Create axios instance with base URL
const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 10000, // 10 second timeout
});

// Request interceptor — attach JWT token to every request if available
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

// Response interceptor — handle common errors
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response) {
      // Server responded with error status
      const { status, data } = error.response;

      if (status === 401) {
        // Token expired or invalid — could trigger logout here
        console.warn('Unauthorized request — token may be expired');
      }

      // Return a cleaner error message
      const message = data?.detail || data?.message || 'Something went wrong';
      return Promise.reject(new Error(message));
    }

    if (error.request) {
      // Request made but no response — network issue
      return Promise.reject(new Error('Network error — check your connection'));
    }

    return Promise.reject(error);
  }
);

export default api;