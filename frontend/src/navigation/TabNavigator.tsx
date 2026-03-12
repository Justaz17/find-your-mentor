import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { Text, StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TabParamList } from './types';
import { Colors, FontSize } from '../utils/constants';
import { useAuth } from '../context/AuthContext';
import HomeScreen from '../screens/home/HomeScreen';
import SearchScreen from '../screens/home/SearchScreen';
import BookingScreen from '../screens/booking/BookingScreen';
import LearnerDashboardScreen from '../screens/learner/LearnerDashboardScreen';
import { MaterialCommunityIcons } from '@expo/vector-icons';


const Tab = createBottomTabNavigator<TabParamList>();

const TabNavigator = () => {
  const insets = useSafeAreaInsets();
  const { isAuthenticated } = useAuth();

  return (
    <Tab.Navigator
      screenOptions={{
        headerShown: false,
        tabBarStyle: {
          backgroundColor: Colors.background,
          borderTopWidth: 1,
          borderTopColor: Colors.border,
          paddingTop: 8,
          paddingBottom: Math.max(insets.bottom, 8),
          height: 60 + Math.max(insets.bottom, 0),
        },
        tabBarActiveTintColor: Colors.primary,
        tabBarInactiveTintColor: Colors.textSecondary,
        tabBarLabelStyle: styles.tabLabel,
      }}
    >
      {/* Home - always visible */}
      <Tab.Screen
  name="Home"
  component={HomeScreen}
  options={{
    tabBarIcon: ({ color }) => (
      <MaterialCommunityIcons name="home" size={24} color={color} />
    ),
  }}
/>

      {/* Search - always visible */}
<Tab.Screen
  name="Search"
  component={SearchScreen}
  options={{
    tabBarIcon: ({ color }) => (
      <MaterialCommunityIcons name="magnify" size={24} color={color} />
    ),
  }}
/>

      {/* Bookings - only if logged in */}
      {isAuthenticated && (
        <Tab.Screen
  name="Bookings"
  component={BookingScreen}
  options={{
    tabBarIcon: ({ color }) => (
      <MaterialCommunityIcons name="calendar" size={24} color={color} />
    ),
  }}
/>
      )}

      {/* Dashboard - only if logged in */}
      {isAuthenticated && (
        <Tab.Screen
  name="Dashboard"
  component={LearnerDashboardScreen}
  options={{
    tabBarLabel: 'Profile',
    tabBarIcon: ({ color }) => (
      <MaterialCommunityIcons name="account" size={24} color={color} />
    ),
  }}
/>
      )}
    </Tab.Navigator>
  );
};

const styles = StyleSheet.create({
  tabLabel: {
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
  tabIcon: {
    fontSize: 22,
  },
});

export default TabNavigator;