import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import { Colors } from '../utils/constants';
import { useAuth } from '../context/AuthContext';
import AuthScreen from '../screens/auth/AuthScreen';
import MentorProfileScreen from '../screens/mentor/MentorProfileScreen';
import TabNavigator from './TabNavigator';
import MentorAvailabilityManager from '../screens/mentor/MentorAvailabilityManager';
import BookSessionScreen from '../screens/booking/BookSessionScreen';
import BookingConfirmationScreen from '../screens/booking/BookingConfirmationScreen';
import SearchScreen from '../screens/home/SearchScreen';
import LearnerProfileScreen from '../screens/learner/LearnerDashboardScreen';
import EditLearnerProfileScreen from '../screens/learner/EditLearnerProfileScreen';
import OnboardingScreen from '../screens/learner/OnboardingScreen';
import ManageServicesScreen from '../screens/mentor/ManageServicesScreen';
import MentorEditProfileScreen from '../screens/mentor/MentorEditProfileScreen';
import SessionsListScreen from '../screens/mentor/SessionsScreen';
import EarningsScreen from '../screens/mentor/FinanceScreen';
import NotificationsScreen from '../screens/mentor/NotificationScreen';
import ReviewsScreen from '../screens/mentor/ReviewsScreen';
import MentorOnboardingNavigator from './MentorOnboardingNavigator';

const Stack = createNativeStackNavigator<RootStackParamList>();

const StackNavigator = () => {
  const { isAuthenticated, isLoading, pendingOnboarding, clearPendingOnboarding, user } = useAuth();

  if (isLoading) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }} initialRouteName="Main">
        <Stack.Screen name="Main" component={TabNavigator} />
      </Stack.Navigator>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName={
        isAuthenticated && pendingOnboarding
          ? user?.role === 'mentor' ? 'MentorOnboarding' : 'Onboarding'
          : 'Main'
      }
      key={
        isAuthenticated && pendingOnboarding
          ? user?.role === 'mentor' ? 'mentor-onboarding' : 'learner-onboarding'
          : 'main'
      }
    >
      <Stack.Screen name="Main" component={TabNavigator} />

      {!isAuthenticated && (
        <Stack.Group screenOptions={{ presentation: 'modal', gestureEnabled: true }}>
          <Stack.Screen name="Auth" component={AuthScreen} />
        </Stack.Group>
      )}

      {isAuthenticated && (
        <Stack.Group screenOptions={{ presentation: 'card' }}>
          <Stack.Screen
            name="Onboarding"
            component={OnboardingScreen}
            options={{ headerShown: false, gestureEnabled: false }}
            listeners={{ focus: () => clearPendingOnboarding() }}
          />
          <Stack.Screen name="LearnerProfile" 
          component={LearnerProfileScreen} 
          options={{ headerShown: false }} />
          <Stack.Screen name="EditLearnerProfile" 
          component={EditLearnerProfileScreen} 
          options={{ headerShown: false }} />
          <Stack.Screen name="MentorAvailability" 
          component={MentorAvailabilityManager} 
          options={{ headerShown: false }} />
          <Stack.Screen name="BookSession" 
          component={BookSessionScreen} 
          options={{ headerShown: false }} />
          <Stack.Screen name="BookingConfirmation" 
          component={BookingConfirmationScreen} 
          options={{ 
            headerShown: true, 
            headerTitle: 'Confirm Booking', 
            headerTintColor: Colors.primary, 
            headerStyle: { 
              backgroundColor: 
              Colors.background
            } 
          }} />
          <Stack.Screen name="ManageServices" 
          component={ManageServicesScreen} 
          options={{ headerShown: false }} />
          <Stack.Screen name="MentorOnboarding" 
          component={MentorOnboardingNavigator} 
          options={{ 
            headerShown: false, 
            gestureEnabled: false 
          }} />
          <Stack.Screen name="MentorEditProfile" 
          component={MentorEditProfileScreen} 
          options={{ headerShown: false }} />
          <Stack.Screen name="SessionsList" 
          component={SessionsListScreen} 
          options={{ headerShown: false }} />
          <Stack.Screen name="Earnings" 
          component={EarningsScreen} 
          options={{ headerShown: false }} />
          <Stack.Screen name="Notifications" 
          component={NotificationsScreen} 
          options={{ headerShown: false }} />
          <Stack.Screen name="Reviews" 
          component={ReviewsScreen} 
          options={{ headerShown: false }} />
        </Stack.Group>
      )}

      <Stack.Group>
        <Stack.Screen
          name="MentorProfile"
          component={MentorProfileScreen}
          options={{ 
            headerShown: true, 
            headerTitle: 'Mentor Profile', 
            headerTintColor: Colors.primary, 
            headerStyle: { 
              backgroundColor: Colors.background 
            } }}
        />
        <Stack.Screen name="Search" 
        component={SearchScreen} 
        options={{ headerShown: false }} />
      </Stack.Group>
    </Stack.Navigator>
  );
};

export default StackNavigator;