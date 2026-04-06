export interface User {
  id: number;
  email: string;
  name: string;
  role: 'learner' | 'mentor' | 'both';
}

export interface UserCreate {
  email: string;
  name: string;
  password: string;
  role?: 'learner' | 'mentor';
}

export interface UserLogin {
  email: string;
  password: string;
}

export interface AuthResponse {
  access_token: string;
  token_type: string;
}