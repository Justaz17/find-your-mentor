import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TabParamList } from './types';
import { Colors } from '../utils/constants';
import { styles } from '../styles/TabNavigator.styles';
import { useAuth } from '../context/AuthContext';
import HomeScreen from '../screens/home/HomeScreen';
import SearchScreen from '../screens/home/SearchScreen';
import BookingScreen from '../screens/booking/BookingScreen';
import LearnerDashboardScreen from '../screens/learner/LearnerDashboardScreen';
import MentorDashboardScreen from '../screens/mentor/MentorDashboardScreen';
import NotificationsScreen from '../screens/mentor/NotificationScreen';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const Tab = createBottomTabNavigator<TabParamList>();
const NullScreen = () => null;

const TabNavigator = () => {
  const insets = useSafeAreaInsets();
  const { isAuthenticated, user } = useAuth();
  const isMentor = user?.role === 'mentor' || user?.role === 'both';

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
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="home" size={24} color={color} />
          ),
        }}
      />

      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="magnify" size={24} color={color} />
          ),
        }}
      />

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

      {isAuthenticated && isMentor && (
        <Tab.Screen
          name="Notifications"
          component={NotificationsScreen}
          options={{
            tabBarLabel: 'Requests',
            tabBarIcon: ({ color }) => (
              <MaterialCommunityIcons name="bell-outline" size={24} color={color} />
            ),
          }}
        />
      )}

      {isAuthenticated && (
        <Tab.Screen
          name="Dashboard"
          component={isMentor ? MentorDashboardScreen : LearnerDashboardScreen}
          options={{
            tabBarLabel: 'Profile',
            tabBarIcon: ({ color }) => (
              <MaterialCommunityIcons name="account" size={24} color={color} />
            ),
          }}
        />
      )}

      {!isAuthenticated && (
        <Tab.Screen
          name="Login"
          component={NullScreen}
          options={{
            tabBarLabel: 'Log in',
            tabBarIcon: ({ color }) => (
              <MaterialCommunityIcons name="login" size={24} color={color} />
            ),
          }}
          listeners={({ navigation }) => ({
            tabPress: (e) => {
              e.preventDefault();
              navigation.navigate('Auth');
            },
          })}
        />
      )}
    </Tab.Navigator>
  );
};

export default TabNavigator;