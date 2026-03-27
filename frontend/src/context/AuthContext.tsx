import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types/User';
import { jwtDecode } from 'jwt-decode';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  pendingOnboarding: boolean;
  signIn: (token: string, isNewUser?: boolean) => Promise<void>;
  signOut: () => Promise<void>;
  clearPendingOnboarding: () => void | Promise<void>;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

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
  const [pendingOnboarding, setPendingOnboarding] = useState(false);

  useEffect(() => {
    const loadToken = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('token');
        if (storedToken) {
          const userData = getUserFromToken(storedToken);
          if (userData) {
            // Load pending_onboarding BEFORE setting isLoading false
            // so StackNavigator gets the correct initialRouteName on first render
            const pending = await AsyncStorage.getItem('pending_onboarding');
            setToken(storedToken);
            setUser(userData);
            if (pending === '1') setPendingOnboarding(true);
          } else {
            await AsyncStorage.removeItem('token');
          }
        }
      } catch (error) {
        console.error('Failed to load auth token:', error);
      } finally {
        setIsLoading(false);
      }
    };

    const timeout = setTimeout(() => setIsLoading(false), 3000);
    loadToken().then(() => clearTimeout(timeout));
  }, []);

  const signIn = async (newToken: string, isNewUser = false) => {
    const userData = getUserFromToken(newToken);
    if (userData) {
      await AsyncStorage.setItem('token', newToken);
      if (isNewUser) await AsyncStorage.setItem('pending_onboarding', '1');
      setToken(newToken);
      setUser(userData);
      if (isNewUser) setPendingOnboarding(true);
    }
  };

  const signOut = async () => {
    await AsyncStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setPendingOnboarding(false);
  };

  const clearPendingOnboarding = async () => {
    await AsyncStorage.removeItem('pending_onboarding');
    setPendingOnboarding(false);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isLoading,
        isAuthenticated: !!token && !!user,
        pendingOnboarding,
        signIn,
        signOut,
        clearPendingOnboarding,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};