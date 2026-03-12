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

const Stack = createNativeStackNavigator<RootStackParamList>();

const StackNavigator = () => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        <Stack.Screen name="Main" component={TabNavigator} />
      </Stack.Navigator>
    );
  }

  return (
    <Stack.Navigator screenOptions={{ headerShown: false }}>
      {/* Always show main app */}
      <Stack.Screen name="Main" component={TabNavigator} />

      {/* Auth modal - only when NOT logged in */}
      {!isAuthenticated && (
        <Stack.Group screenOptions={{ presentation: 'modal', gestureEnabled: false }}>
          <Stack.Screen name="Auth" component={AuthScreen} />
        </Stack.Group>
      )}

      {/* Only for authenticated users */}
      {isAuthenticated && (
        <Stack.Group screenOptions={{ presentation: 'card' }}>
          <Stack.Screen
            name="MentorAvailability"
            component={MentorAvailabilityManager}
            options={{
              headerShown: true,
              headerTitle: 'Your Availability',
              headerTintColor: Colors.primary,
              headerStyle: { backgroundColor: Colors.background },
            }}
          />
          <Stack.Screen
            name="BookSession"
            component={BookSessionScreen}
            options={{
              headerShown: true,
              headerTitle: 'Book a Session',
              headerTintColor: Colors.primary,
              headerStyle: { backgroundColor: Colors.background },
            }}
          />
          <Stack.Screen
            name="BookingConfirmation"
            component={BookingConfirmationScreen}
            options={{
              headerShown: true,
              headerTitle: 'Confirm Booking',
              headerTintColor: Colors.primary,
              headerStyle: { backgroundColor: Colors.background },
            }}
          />
          <Stack.Screen name="LearnerProfile" 
          component={LearnerProfileScreen} 
          options={{ 
            headerShown: false 
            }} 
          />
          <Stack.Screen name="EditLearnerProfile" 
          component={EditLearnerProfileScreen} 
          options={{
            headerShown: false,
            headerTitle: 'Edit Profile',
            headerTintColor: Colors.primary,
            headerStyle: { backgroundColor: Colors.background },
          }}
          />
        </Stack.Group>
      )}

      {/* Shared screens (everyone) */}
      <Stack.Group>
        <Stack.Screen
          name="MentorProfile"
          component={MentorProfileScreen}
          options={{
            headerShown: true,
            headerTitle: 'Mentor Profile',
            headerTintColor: Colors.primary,
            headerStyle: { backgroundColor: Colors.background },
          }}
        />
        <Stack.Screen
          name="Search"
          component={SearchScreen}
          options={{
            headerShown: false,
          }}
        />
      </Stack.Group>
    </Stack.Navigator>
  );
};

export default StackNavigator;