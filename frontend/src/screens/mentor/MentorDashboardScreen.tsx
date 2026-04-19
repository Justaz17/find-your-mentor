import React from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, RefreshControl,
} from 'react-native';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize } from '../../utils/constants';
import { useAuth } from '../../context/AuthContext';
import { useMentorDashboard } from '../../hooks/useMentorDashboard';
import { useMentorProfile } from '../../hooks/useMentorProfile';
import { RootStackParamList } from '../../navigation/types';

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface MentorDashboardProps {
  onSwitchToLearner?: () => void;
}

const StatCard = ({ icon, label, value, color, onPress }: {
  icon: string; label: string; value: string | number; color: string; onPress?: () => void;
}) => (
  <TouchableOpacity
    style={{
      flex: 1, backgroundColor: Colors.background, borderRadius: 16,
      padding: Spacing.md, borderWidth: 1, borderColor: Colors.border,
      alignItems: 'center', gap: 4,
    }}
    onPress={onPress}
    activeOpacity={onPress ? 0.85 : 1}
    disabled={!onPress}
  >
    <MaterialCommunityIcons name={icon as any} size={22} color={color} />
    <Text style={{ fontSize: FontSize.xl, fontWeight: '900', color: Colors.text }}>{value}</Text>
    <Text style={{ fontSize: FontSize.xs, fontWeight: '700', color: Colors.textSecondary, textAlign: 'center' }}>{label}</Text>
  </TouchableOpacity>
);

const MentorDashboardScreen = ({ onSwitchToLearner }: MentorDashboardProps) => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { user, signOut } = useAuth();
  const { stats, isLoading, isRefreshing, refresh } = useMentorDashboard();
  const { completion } = useMentorProfile();

  const handleCompleteProfile = () => {
    const { missing, pct } = completion;
    console.log('completion:', pct, missing);
    if (missing.includes('Bio') || missing.includes('Skills') || missing.includes('Session format')) {
      navigation.navigate('MentorOnboarding');
    } else if (missing.includes('Services')) {
      navigation.navigate('ManageServices');
    } else if (missing.includes('Availability')) {
      navigation.navigate('MentorAvailability');
    }
  };

  if (isLoading) return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color={Colors.primary} />
    </View>
  );

  const QUICK_ACTIONS = [
    {
      icon: 'calendar-edit',
      label: 'Manage Availability',
      sub: 'Add or edit your time slots',
      onPress: () => navigation.navigate('MentorAvailability'),
    },
    {
      icon: 'briefcase-outline',
      label: 'Manage Services',
      sub: 'Create and edit your services',
      onPress: () => navigation.navigate('ManageServices'),
    },
    {
      icon: 'account-edit-outline',
      label: 'Edit Profile',
      sub: 'Update bio, skills and rate',
      onPress: () => navigation.navigate('MentorEditProfile'),
    },
  ];

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: Colors.surface }}
      contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={refresh} tintColor={Colors.primary} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* Header */}
      <View style={{
        backgroundColor: Colors.background,
        paddingTop: insets.top + Spacing.md,
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.lg,
        borderBottomWidth: 1,
        borderBottomColor: Colors.border,
      }}>
        <Text style={{ fontSize: FontSize.xs, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Mentor Dashboard
        </Text>

        {/* Name + Switch */}
        <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', marginTop: 2, marginBottom: Spacing.md }}>
          <Text style={{ fontSize: FontSize.xxl, fontWeight: '900', color: Colors.text }}>
            Hi, {user?.name?.split(' ')[0]}
          </Text>

          {user?.role === 'both' && onSwitchToLearner && (
            <TouchableOpacity
              style={{
                paddingVertical: 8, paddingHorizontal: 12,
                borderRadius: 8, backgroundColor: Colors.primary,
                flexDirection: 'row', alignItems: 'center', gap: 6,
              }}
              onPress={onSwitchToLearner}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="account" size={14} color="#fff" />
              <Text style={{ fontSize: FontSize.xs, fontWeight: '700', color: '#fff' }}>
                Learner
              </Text>
            </TouchableOpacity>
          )}

          {user?.role === 'mentor' && (
            <TouchableOpacity
              style={{
                paddingVertical: 8, paddingHorizontal: 12,
                borderRadius: 8, backgroundColor: Colors.primary,
                flexDirection: 'row', alignItems: 'center', gap: 6,
              }}
              onPress={() => navigation.navigate('Onboarding', {})}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="account-plus" size={14} color="#fff" />
              <Text style={{ fontSize: FontSize.xs, fontWeight: '700', color: '#fff' }}>
                Setup learner
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {stats.pending.length > 0 && (
          <View style={{
            marginTop: Spacing.md, backgroundColor: Colors.primaryLight,
            borderRadius: 12, padding: Spacing.md, flexDirection: 'row',
            alignItems: 'center', gap: 8, borderWidth: 1, borderColor: Colors.primary + '30',
          }}>
            <MaterialCommunityIcons name="bell-ring-outline" size={18} color={Colors.primary} />
            <Text style={{ fontSize: FontSize.sm, fontWeight: '800', color: Colors.primary, flex: 1 }}>
              {stats.pending.length} pending booking{stats.pending.length > 1 ? 's' : ''} waiting for approval
            </Text>
          </View>
        )}
      </View>

      <View style={{ padding: Spacing.lg, gap: Spacing.lg }}>

        {/* Profile completion nudge */}
        {completion.pct < 100 && (
          <TouchableOpacity
            onPress={handleCompleteProfile}
            activeOpacity={0.85}
            style={{
              backgroundColor: Colors.primaryLight,
              borderRadius: 16, padding: Spacing.md,
              borderWidth: 1, borderColor: Colors.primary + '30',
              flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
            }}
          >
            <View style={{
              width: 44, height: 44, borderRadius: 22,
              backgroundColor: Colors.primary,
              justifyContent: 'center', alignItems: 'center',
            }}>
              <MaterialCommunityIcons name="account-edit-outline" size={22} color="#fff" />
            </View>
            <View style={{ flex: 1 }}>
              <Text style={{ fontSize: FontSize.md, fontWeight: '900', color: Colors.primary }}>
                Complete your profile
              </Text>
              <Text style={{ fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: '600' }}>
                {completion.pct}% done — missing: {completion.missing.slice(0, 2).join(', ')}
              </Text>
            </View>
            <View style={{
              width: 40, height: 40, borderRadius: 20,
              backgroundColor: Colors.background,
              justifyContent: 'center', alignItems: 'center',
            }}>
              <Text style={{ fontSize: FontSize.sm, fontWeight: '900', color: Colors.primary }}>
                {completion.pct}%
              </Text>
            </View>
          </TouchableOpacity>
        )}

        {/* Stats */}
        <View style={{ flexDirection: 'row', gap: Spacing.sm }}>
          <StatCard
            icon="calendar-check"
            label="Upcoming"
            value={stats.upcoming.length}
            color={Colors.primary}
            onPress={() => navigation.navigate('SessionsList', { filter: 'upcoming' })}
          />
          <StatCard
            icon="clock-alert-outline"
            label="Pending"
            value={stats.pending.length}
            color={Colors.warning}
            onPress={() => navigation.navigate('SessionsList', { filter: 'pending' })}
          />
          <StatCard
            icon="currency-eur"
            label="Earned"
            value={`€${stats.totalEarned}`}
            color={Colors.secondary}
            onPress={() => navigation.navigate('Earnings')}
          />
          <StatCard
            icon="check-circle-outline"
            label="Completed"
            value={stats.completed.length}
            color={Colors.secondary}
            onPress={() => navigation.navigate('SessionsList', { filter: 'completed' })}
          />
        </View>

        {/* Quick actions */}
        <View style={{ gap: Spacing.sm }}>
          <Text style={{ fontSize: FontSize.sm, fontWeight: '800', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            Quick Actions
          </Text>
          {QUICK_ACTIONS.map(action => (
            <TouchableOpacity
              key={action.label}
              style={{
                backgroundColor: Colors.background, borderRadius: 16,
                padding: Spacing.md, flexDirection: 'row', alignItems: 'center',
                gap: Spacing.md, borderWidth: 1, borderColor: Colors.border,
              }}
              onPress={action.onPress}
              activeOpacity={0.85}
            >
              <View style={{ width: 44, height: 44, borderRadius: 22, backgroundColor: Colors.primaryLight, justifyContent: 'center', alignItems: 'center' }}>
                <MaterialCommunityIcons name={action.icon as any} size={22} color={Colors.primary} />
              </View>
              <View style={{ flex: 1 }}>
                <Text style={{ fontSize: FontSize.md, fontWeight: '800', color: Colors.text }}>{action.label}</Text>
                <Text style={{ fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: '600' }}>{action.sub}</Text>
              </View>
              <MaterialCommunityIcons name="chevron-right" size={20} color={Colors.textSecondary} />
            </TouchableOpacity>
          ))}
        </View>

        {/* Upcoming sessions */}
        {stats.upcoming.length > 0 && (
          <View style={{ gap: Spacing.sm }}>
            <Text style={{ fontSize: FontSize.sm, fontWeight: '800', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 }}>
              Upcoming Sessions
            </Text>
            {stats.upcoming.slice(0, 3).map(b => (
              <View key={b.id} style={{
                backgroundColor: Colors.background, borderRadius: 16,
                padding: Spacing.md, borderWidth: 1, borderColor: Colors.border, gap: 4,
              }}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' }}>
                  <Text style={{ fontSize: FontSize.md, fontWeight: '900', color: Colors.text }}>{b.learner_name}</Text>
                  <View style={{
                    backgroundColor: b.status === 'confirmed' ? Colors.primary : Colors.warning,
                    borderRadius: 999, paddingHorizontal: 10, paddingVertical: 3,
                  }}>
                    <Text style={{ fontSize: 10, fontWeight: '800', color: '#fff', textTransform: 'uppercase' }}>{b.status}</Text>
                  </View>
                </View>
                <Text style={{ fontSize: FontSize.sm, fontWeight: '700', color: Colors.primary }}>{b.service_title}</Text>
                <Text style={{ fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: '600' }}>
                  {new Date(b.slot_start).toLocaleDateString('en-IE', {
                    weekday: 'short', month: 'short', day: 'numeric',
                    hour: '2-digit', minute: '2-digit',
                  })}
                </Text>
              </View>
            ))}
          </View>
        )}

        {/* Sign out */}
        <TouchableOpacity
          onPress={signOut}
          style={{ alignItems: 'center', paddingVertical: Spacing.md }}
          activeOpacity={0.7}
        >
          <Text style={{ fontSize: FontSize.sm, fontWeight: '700', color: Colors.error }}>Sign Out</Text>
        </TouchableOpacity>
      </View>
    </ScrollView>
  );
};

export default MentorDashboardScreen;