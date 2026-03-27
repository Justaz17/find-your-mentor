import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import StackNavigator from './StackNavigator';
import { useAuth } from '../context/AuthContext';
import OnboardingScreen from '../screens/learner/OnboardingScreen';

const AppNavigator = () => {
  const { isAuthenticated, isLoading, pendingOnboarding } = useAuth();

  // Don't render anything until auth state is loaded
  if (isLoading) return null;

  // New user — show onboarding fullscreen before any navigation stack
  if (isAuthenticated && pendingOnboarding) {
    return <OnboardingScreen />;
  }

  return (
    <NavigationContainer>
      <StackNavigator />
    </NavigationContainer>
  );
};

export default AppNavigator;