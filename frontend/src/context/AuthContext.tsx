import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback, useMemo } from 'react';
import AsyncStorage from '@react-native-async-storage/async-storage';
import { User } from '../types/User';
import { jwtDecode } from 'jwt-decode';
import { onAuthExpired } from '../services/api';

interface AuthContextType {
  user: User | null;
  token: string | null;
  isLoading: boolean;
  isAuthenticated: boolean;
  pendingOnboarding: boolean;
  signIn: (token: string, isNewUser?: boolean) => Promise<void>;
  signOut: () => Promise<void>;
  clearPendingOnboarding: () => void | Promise<void>;
  updateUser: (userData: User) => void; 
  transitioning: boolean;
  setTransitioning: (value: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const getUserFromToken = (token: string): User | null => {
  try {
    const decoded: any = jwtDecode(token);
    return {
      id: decoded.user_id || 0,
      email: decoded.sub || '',
      name: decoded.name || decoded.sub?.split('@')[0] || '',
      role: decoded.role || 'learner',
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
  const [transitioning, setTransitioning] = useState(false);


  const updateUser = useCallback((userData: User) => {
  setUser(userData);
}, []);

  useEffect(() => {
    const loadToken = async () => {
      try {
        const storedToken = await AsyncStorage.getItem('token');
        if (storedToken) {
          const userData = getUserFromToken(storedToken);
          if (userData) {
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


  const signIn = useCallback(async (newToken: string, isNewUser = false) => {
    const userData = getUserFromToken(newToken);
    if (userData) {
      await AsyncStorage.setItem('token', newToken);
      if (isNewUser) await AsyncStorage.setItem('pending_onboarding', '1');
      setToken(newToken);
      setUser(userData);
      if (isNewUser) setPendingOnboarding(true);
    }
  }, []);

  const signOut = useCallback(async () => {
    await AsyncStorage.removeItem('token');
    setToken(null);
    setUser(null);
    setPendingOnboarding(false);
  }, []);

    useEffect(() => {
    onAuthExpired(() => {
    signOut();
    });
  }, [signOut]);
  
  const clearPendingOnboarding = useCallback(async () => {
    try {
      console.log('Removing pending_onboarding from storage');
      await AsyncStorage.removeItem('pending_onboarding');
      console.log('Removed, setting state to false');
      setPendingOnboarding(false);
    } catch (error) {
      console.error('Error clearing pending onboarding:', error);
    }
  }, []);

  const value = useMemo(
    () => ({
      user,
      token,
      isLoading,
      isAuthenticated: !!token && !!user,
      pendingOnboarding,
      signIn,
      signOut,
      clearPendingOnboarding,
      updateUser,
      transitioning,
      setTransitioning,
    }),
    [user, token, isLoading, pendingOnboarding, signIn, signOut, clearPendingOnboarding, updateUser, transitioning, setTransitioning]
  );

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) throw new Error('useAuth must be used within an AuthProvider');
  return context;
};