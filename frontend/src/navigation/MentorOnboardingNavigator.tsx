import React from 'react';
import { createNativeStackNavigator } from '@react-navigation/native-stack';
import { MentorOnboardingProvider } from '../context/MentorOnboardingContext';
import AboutScreen from '../screens/mentor/onboarding/AboutScreen';
import FormatScreen from '../screens/mentor/onboarding/FormatScreen';
import ExpertiseScreen from '../screens/mentor/onboarding/ExpertiseScreen';
import CongratsScreen from '../screens/mentor/onboarding/CongratsScreen';
import ManageServicesScreen from '../screens/mentor/ManageServicesScreen';
import MentorAvailabilityManager from '../screens/mentor/MentorAvailabilityManager';

export type MentorOnboardingParamList = {
  OnboardingAbout: undefined;
  OnboardingFormat: undefined;
  OnboardingExpertise: undefined;
  OnboardingCongrats: undefined;
  OnboardingServices: { isOnboarding: boolean };
  OnboardingAvailability: { isOnboarding: boolean };
};

const Stack = createNativeStackNavigator<MentorOnboardingParamList>();

const MentorOnboardingNavigator = () => {
  return (
    <MentorOnboardingProvider>
      <Stack.Navigator screenOptions={{ headerShown: false, animation: 'slide_from_right' }}>
        <Stack.Screen name="OnboardingAbout" component={AboutScreen} />
        <Stack.Screen name="OnboardingFormat" component={FormatScreen} />
        <Stack.Screen name="OnboardingExpertise" component={ExpertiseScreen} />
        <Stack.Screen name="OnboardingCongrats" component={CongratsScreen} />
        <Stack.Screen
          name="OnboardingServices"
          component={ManageServicesScreen}
          initialParams={{ isOnboarding: true }}
        />
        <Stack.Screen
          name="OnboardingAvailability"
          component={MentorAvailabilityManager}
          initialParams={{ isOnboarding: true }}
        />
      </Stack.Navigator>
    </MentorOnboardingProvider>
  );
};

export default MentorOnboardingNavigator;