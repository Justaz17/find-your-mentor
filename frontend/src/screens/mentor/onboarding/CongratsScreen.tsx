import React, { useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
} from 'react-native';
import { useNavigation, CommonActions } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize } from '../../../utils/constants';
import OnboardingProgress from '../../../components/common/OnboardingProgress';
import { MentorOnboardingParamList } from '../../../navigation/MentorOnboardingNavigator';
import { useAuth } from '../../../context/AuthContext';
import { styles } from '../../../styles/HomeScreen.styles';
import { getCurrentUser } from '../../../services/authService';


type Nav = NativeStackNavigationProp<MentorOnboardingParamList>;

const STEPS = [
  {
    number: '01',
    title: 'Create a service',
    body: 'Define what you offer — title, duration and price. Learners browse and book your services.',
    icon: 'briefcase-outline',
    align: 'left',
  },
  {
    number: '02',
    title: 'Set your availability',
    body: 'Add time slots when you are free. Learners can only book slots you make available.',
    icon: 'calendar-outline',
    align: 'right',
  },
  {
    number: '03',
    title: 'Start getting bookings',
    body: 'Once you are set up, learners can find and book you. You approve each session.',
    icon: 'check-circle-outline',
    align: 'left',
  },
];

const CongratsScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { clearPendingOnboarding, user, updateUser,signIn } = useAuth();
  const [shouldExit, setShouldExit] = React.useState(false);
  

  console.log('CongratsScreen user role:', user?.role);

  useEffect(() => {
      if (shouldExit) {
        clearPendingOnboarding();
      }
    }, [shouldExit]);
  
const handleSetupLater = async () => {
  await clearPendingOnboarding();

  try {
    const { user: freshUser, access_token } = await getCurrentUser();
    await signIn(access_token,false); // Update token and user in context without marking as new user
    console.log('Fetched user role after onboarding:', freshUser.role);
    updateUser(freshUser);  // Update the context with fresh user data
    console.log('Updated user role:', freshUser.role);
  } catch (error) {
    console.error('Failed to refresh user:', error);
  }
  
  setTimeout(() => {
    navigation.navigate('Main' as any);
  }, 100);
};
  return (
    <View style={{ flex: 1, backgroundColor: Colors.background }}>
      {/* Header */}
      <View style={{
        paddingTop: insets.top + Spacing.md,
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.lg,
      }}>
        <OnboardingProgress current={4} />
      </View>

      <ScrollView
        contentContainerStyle={{ paddingBottom: insets.bottom + 120 }}
        showsVerticalScrollIndicator={false}
      >
        {/* Congrats header */}
        <View style={{
          paddingHorizontal: Spacing.lg,
          paddingBottom: Spacing.xl,
          alignItems: 'center',
          gap: Spacing.md,
        }}>
          <View style={{
            width: 72, height: 72, borderRadius: 36,
            backgroundColor: Colors.primaryLight,
            justifyContent: 'center', alignItems: 'center',
            borderWidth: 2, borderColor: Colors.primary + '40',
          }}>
            <MaterialCommunityIcons name="check-circle" size={40} color={Colors.primary} />
          </View>
          <Text style={{
            fontSize: FontSize.xxl, fontWeight: '900',
            color: Colors.text, letterSpacing: -0.5, textAlign: 'center',
          }}>
            Profile set up!
          </Text>
          <Text style={{
            fontSize: FontSize.sm, color: Colors.textSecondary,
            fontWeight: '500', textAlign: 'center', lineHeight: 22,
            paddingHorizontal: Spacing.lg,
          }}>
            Now let's make you bookable. Here's how it works for mentors.
          </Text>
        </View>

        {/* How it works */}
        <View style={styles.howWrap}>
          {STEPS.map((step, i) => {
            const isRight = step.align === 'right';
            return (
              <View key={step.number} style={styles.stepRow}>
                {i < STEPS.length - 1 && (
                  <View style={[
                    styles.connector,
                    isRight ? styles.connectorRight : styles.connectorLeft,
                  ]} />
                )}
                <View style={[styles.stepSide, isRight && styles.stepSideEmpty]}>
                  {!isRight && (
                    <View style={styles.stepCard}>
                      <Text style={styles.stepNumber}>{step.number}</Text>
                      <Text style={styles.stepTitle}>{step.title}</Text>
                      <Text style={styles.stepBody}>{step.body}</Text>
                    </View>
                  )}
                </View>
                <View style={styles.stepNode}>
                  <View style={styles.stepNodeInner}>
                    <MaterialCommunityIcons
                      name={step.icon as any}
                      size={22}
                      color={Colors.primary}
                    />
                  </View>
                </View>
                <View style={[styles.stepSide, !isRight && styles.stepSideEmpty]}>
                  {isRight && (
                    <View style={styles.stepCard}>
                      <Text style={styles.stepNumber}>{step.number}</Text>
                      <Text style={styles.stepTitle}>{step.title}</Text>
                      <Text style={styles.stepBody}>{step.body}</Text>
                    </View>
                  )}
                </View>
              </View>
            );
          })}
        </View>

        {/* Info note */}
        <View style={{
          marginHorizontal: Spacing.lg, marginTop: Spacing.md,
          backgroundColor: Colors.surface, borderRadius: 14,
          padding: Spacing.md, borderWidth: 1, borderColor: Colors.border,
          flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start',
        }}>
          <MaterialCommunityIcons name="information-outline" size={18} color={Colors.primary} />
          <Text style={{
            flex: 1, fontSize: FontSize.xs,
            color: Colors.textSecondary, fontWeight: '600', lineHeight: 18,
          }}>
            You can update your profile, services and availability anytime from your dashboard.
          </Text>
        </View>
      </ScrollView>

      {/* Bottom */}
      <View style={{
        paddingHorizontal: Spacing.lg,
        paddingBottom: insets.bottom + Spacing.md,
        paddingTop: Spacing.md,
        borderTopWidth: 1, borderTopColor: Colors.border,
        backgroundColor: Colors.background,
        gap: Spacing.sm,
      }}>
        <TouchableOpacity
          style={{
            backgroundColor: Colors.primary, borderRadius: 14,
            paddingVertical: 16, flexDirection: 'row',
            justifyContent: 'center', alignItems: 'center', gap: 8,
          }}
          onPress={() => navigation.navigate('OnboardingServices', { isOnboarding: true })}
          activeOpacity={0.88}
        >
          <MaterialCommunityIcons name="briefcase-outline" size={20} color="#fff" />
          <Text style={{ color: '#fff', fontSize: FontSize.sm, fontWeight: '800' }}>
            Create my first service
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={{
            paddingVertical: 14, borderRadius: 14,
            borderWidth: 1, borderColor: Colors.border,
            flexDirection: 'row', justifyContent: 'center',
            alignItems: 'center', gap: 8,
          }}
          onPress={handleSetupLater}
          activeOpacity={0.7}
        >
          <Text style={{ fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '700' }}>
            I'll set up later
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

export default CongratsScreen;