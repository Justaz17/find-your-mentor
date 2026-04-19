import React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import StackNavigator from './StackNavigator';
import { useAuth } from '../context/AuthContext';
import MentorOnboardingNavigator from './MentorOnboardingNavigator';
import OnboardingScreen from '../screens/learner/OnboardingScreen';

const AppNavigator = () => {
  const auth = useAuth();
  console.log('AppNavigator hook called, pendingOnboarding:', auth.pendingOnboarding);
  const { isAuthenticated, isLoading, pendingOnboarding, user, transitioning } = auth;
  console.log('AppNavigator render:', { isAuthenticated, pendingOnboarding, role: user?.role });

  if (isLoading || transitioning) return null;

  if (isAuthenticated && pendingOnboarding && (user?.role === 'mentor' || user?.role === 'both')) {
    return (
      
      <NavigationContainer key="mentor-onboarding">
        <MentorOnboardingNavigator />
      </NavigationContainer>
      
    );
  }

  if (isAuthenticated && pendingOnboarding && user?.role === 'learner') {
    return (
      <NavigationContainer key="learner-onboarding">
        <OnboardingScreen />
      </NavigationContainer>
    );
  }

  return (
    <NavigationContainer key="main-app">
      <StackNavigator />
    </NavigationContainer>
  );
};

export default AppNavigator;