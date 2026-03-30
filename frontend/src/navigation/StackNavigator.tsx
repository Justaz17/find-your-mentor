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
import NotificationsScreen from '../screens/mentor/NotificationScreen';
import SessionsScreen from '../screens/mentor/SessionScreen';
import FinanceScreen from '../screens/mentor/FinanceScreen';
import ReviewsScreen from '../screens/mentor/ReviewsScreen';

const Stack = createNativeStackNavigator<RootStackParamList>();

const StackNavigator = () => {
  const { isAuthenticated, isLoading, pendingOnboarding, clearPendingOnboarding } = useAuth();

  if (isLoading) {
    return (
      <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName={isAuthenticated && pendingOnboarding ? 'Onboarding' : 'Main'}
      key={isAuthenticated && pendingOnboarding ? 'onboarding' : 'main'}
    >
        <Stack.Screen name="Main" component={TabNavigator} />
      </Stack.Navigator>
    );
  }

  return (
    <Stack.Navigator
      screenOptions={{ headerShown: false }}
      initialRouteName={isAuthenticated && pendingOnboarding ? 'Onboarding' : 'Main'}
      key={isAuthenticated && pendingOnboarding ? 'onboarding' : 'main'}
    >
      <Stack.Screen name="Main" component={TabNavigator} />

      {/* Auth modal — dismissible with swipe or X button */}
      {!isAuthenticated && (
        <Stack.Group screenOptions={{ presentation: 'modal', gestureEnabled: true }}>
          <Stack.Screen name="Auth" component={AuthScreen} />
        </Stack.Group>
      )}

      {isAuthenticated && (
        <Stack.Group screenOptions={{ presentation: 'card' }}>
          <Stack.Screen
            name="MentorAvailability"
            component={MentorAvailabilityManager}
            options={{
              headerShown: true,
              headerTitle: 'Your Availability',
              headerTintColor: Colors.primary,
              headerBackTitle: '',
              headerStyle: { backgroundColor: Colors.background },
              headerShadowVisible: false,
            }}
          />
          <Stack.Screen
            name="BookSession"
            component={BookSessionScreen}
            options={{
              headerShown: true,
              headerTitle: 'Book a Session',
              headerTintColor: Colors.primary,
              headerBackTitle: '',
              headerStyle: { backgroundColor: Colors.background },
              headerShadowVisible: false,
            }}
          />
          <Stack.Screen
            name="BookingConfirmation"
            component={BookingConfirmationScreen}
            options={{
              headerShown: true,
              headerTitle: 'Confirm Booking',
              headerTintColor: Colors.primary,
              headerBackTitle: '',
              headerStyle: { backgroundColor: Colors.background },
              headerShadowVisible: false,
            }}
          />
          <Stack.Screen
            name="Onboarding"
            component={OnboardingScreen}
            options={{ headerShown: false, gestureEnabled: false }}
            listeners={{ focus: () => clearPendingOnboarding() }}
          />
          <Stack.Screen name="MentorNotifications" component={NotificationsScreen} options={{ headerShown: false }} />
          <Stack.Screen name="MentorSessions" component={SessionsScreen} options={{ headerShown: false }} />
          <Stack.Screen name="MentorFinance" component={FinanceScreen} options={{ headerShown: false }} />
          <Stack.Screen name="MentorReviews" component={ReviewsScreen} options={{ headerShown: false }} />
          <Stack.Screen
            name="LearnerProfile"
            component={LearnerProfileScreen}
            options={{ headerShown: false }}
          />
          <Stack.Screen
            name="EditLearnerProfile"
            component={EditLearnerProfileScreen}
            options={{
              headerShown: false,
              headerTitle: 'Edit Profile',
              headerTintColor: Colors.primary,
              headerBackTitle: '',
              headerStyle: { backgroundColor: Colors.background },
              headerShadowVisible: false,
            }}
          />
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
              headerBackTitle: '',
            headerStyle: { backgroundColor: Colors.background },
              headerShadowVisible: false,
          }}
        />
        <Stack.Screen
          name="Search"
          component={SearchScreen}
          options={{ headerShown: false }}
        />
      </Stack.Group>
    </Stack.Navigator>
  );
};

export default StackNavigator;