import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import StackNavigator from './StackNavigator';
import { useAuth } from '../context/AuthContext';
import MentorOnboardingNavigator from './MentorOnboardingNavigator';
import OnboardingScreen from '../screens/learner/OnboardingScreen';

const AppNavigator = () => {
  const auth = useAuth();
  console.log('AppNavigator hook called, pendingOnboarding:', auth.pendingOnboarding);
  const { isAuthenticated, isLoading, pendingOnboarding, user } = auth;
  console.log('AppNavigator render:', { isAuthenticated, pendingOnboarding, role: user?.role });

  if (isLoading) return null;

  // New mentor — show onboarding outside NavigationContainer
  if (isAuthenticated && pendingOnboarding && (user?.role === 'mentor' || user?.role === 'both')){
    return (
      <NavigationContainer key="mentor-onboarding">
        <MentorOnboardingNavigator />
      </NavigationContainer>
    );
  }

  // New learner — show onboarding outside NavigationContainer  
  if (isAuthenticated && pendingOnboarding && user?.role === 'learner') {
    return <OnboardingScreen />;
  }

  return (
    <NavigationContainer key="main-app">
      <StackNavigator />
    </NavigationContainer>
  );
};

export default AppNavigator;