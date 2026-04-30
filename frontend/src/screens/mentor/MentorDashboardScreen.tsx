import React from 'react';
import {
  View,
  ScrollView,
  ActivityIndicator,
  RefreshControl,
} from 'react-native';
import {
  Text,
  Card,
  Chip,
  Button,
  Surface,
  IconButton,
} from 'react-native-paper';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing } from '../../utils/constants';
import { useAuth } from '../../context/AuthContext';
import { useMentorDashboard } from '../../hooks/useMentorDashboard';
import { useMentorProfile } from '../../hooks/useMentorProfile';
import { RootStackParamList } from '../../navigation/types';
import { styles } from '../../styles/MentorDashboardScreen.styles';

type Nav = NativeStackNavigationProp<RootStackParamList>;

interface MentorDashboardProps {
  onSwitchToLearner?: () => void;
}

// ── Stat Card ───────────────────────────────────────────────────────────
const StatCard = ({ icon, label, value, color, onPress }: {
  icon: string; label: string; value: string | number; color: string; onPress?: () => void;
}) => (
  <Card
    mode="outlined"
    style={styles.statCard}
    onPress={onPress}
  >
    <Card.Content style={styles.statCardContent}>
      <MaterialCommunityIcons name={icon as any} size={22} color={color} />
      <Text variant="titleLarge" style={styles.statValue}>{value}</Text>
      <Text variant="labelSmall" style={styles.statLabel}>{label}</Text>
    </Card.Content>
  </Card>
);

// ── Main Screen ─────────────────────────────────────────────────────────
const MentorDashboardScreen = ({ onSwitchToLearner }: MentorDashboardProps) => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const { user, signOut } = useAuth();
  const { stats, isLoading, isRefreshing, refresh } = useMentorDashboard();
  const { completion } = useMentorProfile();

  const handleCompleteProfile = () => {
    const { missing } = completion;
    if (missing.includes('Bio') || missing.includes('Skills') || missing.includes('Session format')) {
      navigation.navigate('MentorOnboarding');
    } else if (missing.includes('Services')) {
      navigation.navigate('ManageServices');
    } else if (missing.includes('Availability')) {
      navigation.navigate('MentorAvailability');
    }
  };

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

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
      style={styles.container}
      contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
      refreshControl={
        <RefreshControl refreshing={isRefreshing} onRefresh={refresh} tintColor={Colors.primary} />
      }
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header ──────────────────────────────────────────────── */}
      <Surface style={[styles.headerSurface, { paddingTop: insets.top + Spacing.md }]} elevation={0}>
        <Text variant="labelSmall" style={styles.headerLabel}>
          Mentor Dashboard
        </Text>

        <View style={styles.headerRow}>
          <Text variant="headlineMedium" style={styles.headerName}>
            Hi, {user?.name?.split(' ')[0]}
          </Text>

          {user?.role === 'both' && onSwitchToLearner && (
            <Button
              mode="contained"
              compact
              icon="account"
              onPress={onSwitchToLearner}
              style={styles.switchButton}
              labelStyle={styles.switchButtonLabel}
            >
              Learner
            </Button>
          )}

          {user?.role === 'mentor' && (
            <Button
              mode="contained"
              compact
              icon="account-plus"
              onPress={() => navigation.navigate('Onboarding', {})}
              style={styles.switchButton}
              labelStyle={styles.switchButtonLabel}
            >
              Setup learner
            </Button>
          )}
        </View>

        {stats.pending.length > 0 && (
          <View style={styles.pendingBanner}>
            <MaterialCommunityIcons name="bell-ring-outline" size={18} color={Colors.primary} />
            <Text style={styles.pendingText}>
              {stats.pending.length} pending booking{stats.pending.length > 1 ? 's' : ''} waiting for approval
            </Text>
          </View>
        )}
      </Surface>

      <View style={styles.body}>

        {/* ── Profile completion ──────────────────────────────────── */}
        {completion.pct < 100 && (
          <Card
            mode="outlined"
            style={styles.completionCard}
            onPress={handleCompleteProfile}
          >
            <Card.Content style={styles.completionContent}>
              <View style={styles.completionIconWrap}>
                <MaterialCommunityIcons name="account-edit-outline" size={22} color="#fff" />
              </View>
              <View style={styles.completionTextWrap}>
                <Text variant="titleSmall" style={styles.completionTitle}>
                  Complete your profile
                </Text>
                <Text variant="bodySmall" style={styles.completionSub}>
                  {completion.pct}% done — missing: {completion.missing.slice(0, 2).join(', ')}
                </Text>
              </View>
              <View style={styles.completionPctWrap}>
                <Text variant="labelLarge" style={styles.completionPctText}>
                  {completion.pct}%
                </Text>
              </View>
            </Card.Content>
          </Card>
        )}

        {/* ── Stats ──────────────────────────────────────────────── */}
        <View style={styles.statsRow}>
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

        {/* ── Quick actions ──────────────────────────────────────── */}
        <View>
          <Text variant="labelSmall" style={styles.sectionLabel}>
            Quick Actions
          </Text>
          {QUICK_ACTIONS.map(action => (
            <Card
              key={action.label}
              mode="outlined"
              style={styles.actionCard}
              onPress={action.onPress}
            >
              <Card.Content style={styles.actionContent}>
                <View style={styles.actionIconWrap}>
                  <MaterialCommunityIcons name={action.icon as any} size={22} color={Colors.primary} />
                </View>
                <View style={styles.actionTextWrap}>
                  <Text variant="bodyLarge" style={styles.actionLabel}>{action.label}</Text>
                  <Text variant="bodySmall" style={styles.actionSub}>{action.sub}</Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={20} color={Colors.textSecondary} />
              </Card.Content>
            </Card>
          ))}
        </View>

        {/* ── Upcoming sessions ──────────────────────────────────── */}
        {stats.upcoming.length > 0 && (
          <View>
            <Text variant="labelSmall" style={styles.sectionLabel}>
              Upcoming Sessions
            </Text>
            {stats.upcoming.slice(0, 3).map(b => (
              <Card key={b.id} mode="outlined" style={styles.sessionCard}>
                <Card.Content>
                  <View style={styles.sessionHeader}>
                    <Text variant="titleSmall" style={styles.sessionName}>
                      {b.learner_name}
                    </Text>
                    <Chip
                      compact
                      mode="flat"
                      style={{
                        backgroundColor: b.status === 'confirmed' ? Colors.primary : Colors.warning,
                      }}
                      textStyle={{ color: '#fff', fontSize: 10, fontWeight: '800' }}
                    >
                      {b.status.toUpperCase()}
                    </Chip>
                  </View>
                  <Text variant="bodyMedium" style={styles.sessionService}>
                    {b.service_title}
                  </Text>
                  <Text variant="bodySmall" style={styles.sessionDate}>
                    {new Date(b.slot_start).toLocaleDateString('en-IE', {
                      weekday: 'short',
                      month: 'short',
                      day: 'numeric',
                      hour: '2-digit',
                      minute: '2-digit',
                    })}
                  </Text>
                </Card.Content>
              </Card>
            ))}
          </View>
        )}

        {/* ── Sign out ──────────────────────────────────────────── */}
        <Button
          mode="text"
          onPress={signOut}
          textColor={Colors.error}
          style={styles.signOutWrap}
          labelStyle={styles.signOutText}
        >
          Sign Out
        </Button>
      </View>
    </ScrollView>
  );
};

export default MentorDashboardScreen;