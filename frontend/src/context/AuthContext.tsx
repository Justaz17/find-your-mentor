import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types/User';
import { jwtDecode } from 'jwt-decode';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  signIn: (token: string) => Promise<void>;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Decode JWT to extract user info (your backend stores aemail in 'sub')
const getUserFromToken = (token: string): User | null => {
  try {
    const decoded: any = jwtDecode(token);
    return {
      id: decoded.user_id || 0,
      email: decoded.sub || '',
      name: decoded.name || decoded.sub?.split('@')[0] || '',
    };
  } catch {
    return null;
  }
};

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  // Check for existing token on app start
  useEffect(() => {
    const loadToken = async () => {
      try {
        console.log('AuthContext: Loading token...');
        const storedToken = await AsyncStorage.getItem('token');
        console.log('AuthContext: Token found:', !!storedToken);
        if (storedToken) {
          const userData = getUserFromToken(storedToken);
          if (userData) {
            setToken(storedToken);
            setUser(userData);
          } else {
            await AsyncStorage.removeItem('token');
          }
        }
      } catch (error) {
        console.error('Failed to load auth token:', error);
      } finally {
        console.log('AuthContext: Done loading');
        setIsLoading(false);
      }
    };

    // Safety timeout — if loading takes more than 3 seconds, force it
    const timeout = setTimeout(() => {
      console.log('AuthContext: Timeout — forcing load complete');
      setIsLoading(false);
    }, 3000);

    loadToken().then(() => clearTimeout(timeout));
  }, []);

  const signIn = async (newToken: string) => {
    const userData = getUserFromToken(newToken);
    if (userData) {
      await AsyncStorage.setItem('token', newToken);
      setToken(newToken);
      setUser(userData);
    }
  };

  const signOut = async () => {
    await AsyncStorage.removeItem('token');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token && !!user,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook for easy access
export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};