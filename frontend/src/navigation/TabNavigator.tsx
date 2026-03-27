import React from 'react';
import { createBottomTabNavigator } from '@react-navigation/bottom-tabs';
import { StyleSheet, Platform } from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { TabParamList } from './types';
import { Colors, FontSize } from '../utils/constants';
import { useAuth } from '../context/AuthContext';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from './types';
import HomeScreen from '../screens/home/HomeScreen';
import SearchScreen from '../screens/home/SearchScreen';
import BookingScreen from '../screens/booking/BookingScreen';
import LearnerDashboardScreen from '../screens/learner/LearnerDashboardScreen';
import { MaterialCommunityIcons } from '@expo/vector-icons';

const Tab = createBottomTabNavigator<TabParamList>();

// Dummy screen — never actually renders, tab press triggers navigation instead
const NullScreen = () => null;

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
      {/* Home — always visible */}
      <Tab.Screen
        name="Home"
        component={HomeScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="home" size={24} color={color} />
          ),
        }}
      />

      {/* Search — always visible */}
      <Tab.Screen
        name="Search"
        component={SearchScreen}
        options={{
          tabBarIcon: ({ color }) => (
            <MaterialCommunityIcons name="magnify" size={24} color={color} />
          ),
        }}
      />

      {/* Authenticated only */}
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

      {/* Guest only — opens Auth modal on press */}
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

const styles = StyleSheet.create({
  tabLabel: {
    fontSize: FontSize.xs,
    fontWeight: '600',
  },
});

export default TabNavigator;