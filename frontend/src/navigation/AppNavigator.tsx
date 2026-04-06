import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import StackNavigator from './StackNavigator';
import { useAuth } from '../context/AuthContext';
import MentorOnboardingNavigator from './MentorOnboardingNavigator';
import OnboardingScreen from '../screens/learner/OnboardingScreen';

const AppNavigator = () => {
  const { isAuthenticated, isLoading, pendingOnboarding, user } = useAuth();
  console.log('AppNavigator user:', user?.role, 'pending:', pendingOnboarding);

  if (isLoading) return null;

  // New mentor — show onboarding outside NavigationContainer
  if (isAuthenticated && pendingOnboarding && user?.role === 'mentor') {
    return (
      <NavigationContainer>
        <MentorOnboardingNavigator />
      </NavigationContainer>
    );
  }

  // New learner — show onboarding outside NavigationContainer  
  if (isAuthenticated && pendingOnboarding && user?.role === 'learner') {
    return <OnboardingScreen />;
  }

  return (
    <NavigationContainer>
      <StackNavigator />
    </NavigationContainer>
  );
};

export default AppNavigator;