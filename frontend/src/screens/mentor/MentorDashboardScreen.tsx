import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, Alert,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { LinearGradient } from 'expo-linear-gradient';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize } from '../../utils/constants';
import { useAuth } from '../../context/AuthContext';
import { RootStackParamList } from '../../navigation/types';
import {
  getMentorDashboard, approveBooking, denyBooking,
  MentorDashboardData, DashboardBooking, DashboardReview,
} from '../../services/mentorDashboardService';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

// ── Small components ──────────────────────────────────────────────────────

const StatCard = ({
  icon, label, value, sub, color, onPress,
}: {
  icon: string; label: string; value: string; sub?: string; color: string; onPress?: () => void;
}) => (
  <TouchableOpacity
    style={[statStyles.card, { borderTopColor: color }]}
    onPress={onPress}
    activeOpacity={onPress ? 0.82 : 1}
  >
    <MaterialCommunityIcons name={icon as any} size={20} color={color} style={{ marginBottom: 6 }} />
    <Text style={statStyles.value}>{value}</Text>
    {sub && <Text style={statStyles.sub}>{sub}</Text>}
    <Text style={statStyles.label}>{label}</Text>
    {onPress && (
      <MaterialCommunityIcons name="chevron-right" size={14} color={Colors.textSecondary} style={{ marginTop: 4 }} />
    )}
  </TouchableOpacity>
);

const statStyles = StyleSheet.create({
  card: {
    flex: 1,
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: Spacing.md,
    alignItems: 'center',
    borderTopWidth: 3,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  value: {
    fontSize: FontSize.xl,
    fontWeight: '900',
    color: Colors.text,
    letterSpacing: -0.5,
  },
  sub: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  label: {
    fontSize: 10,
    fontWeight: '700',
    color: Colors.textSecondary,
    textTransform: 'uppercase',
    letterSpacing: 0.5,
    marginTop: 2,
    textAlign: 'center',
  },
});

const StarRow = ({ rating }: { rating: number }) => {
  const full = Math.floor(rating);
  const half = rating - full >= 0.5;
  const empty = 5 - full - (half ? 1 : 0);
  return (
    <View style={{ flexDirection: 'row', gap: 2 }}>
      {Array.from({ length: full }).map((_, i) => (
        <MaterialCommunityIcons key={`f${i}`} name="star" size={13} color="#F59E0B" />
      ))}
      {half && <MaterialCommunityIcons name="star-half-full" size={13} color="#F59E0B" />}
      {Array.from({ length: empty }).map((_, i) => (
        <MaterialCommunityIcons key={`e${i}`} name="star-outline" size={13} color="#F59E0B" />
      ))}
    </View>
  );
};

const SectionHeader = ({ title, subtitle }: { title: string; subtitle?: string }) => (
  <View style={styles.sectionHeader}>
    <Text style={styles.sectionTitle}>{title}</Text>
    {subtitle && <Text style={styles.sectionSubtitle}>{subtitle}</Text>}
  </View>
);

// ── Main screen ───────────────────────────────────────────────────────────

const MentorDashboardScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavProp>();
  const { user, signOut } = useAuth();

  const [data, setData] = useState<MentorDashboardData | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      setIsLoading(true);
      getMentorDashboard()
        .then(setData)
        .catch(() => {})
        .finally(() => setIsLoading(false));
    }, [])
  );

  const handleApprove = async (bookingId: number) => {
    setActionLoading(bookingId);
    try {
      await approveBooking(bookingId);
      const updated = await getMentorDashboard();
      setData(updated);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to approve booking');
    } finally {
      setActionLoading(null);
    }
  };

  const handleDeny = async (bookingId: number) => {
    Alert.alert(
      'Decline booking',
      'Are you sure? The learner will be notified and the slot freed.',
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Decline', style: 'destructive',
          onPress: async () => {
            setActionLoading(bookingId);
            try {
              await denyBooking(bookingId);
              const updated = await getMentorDashboard();
              setData(updated);
            } catch (e: any) {
              Alert.alert('Error', e.message || 'Failed to decline booking');
            } finally {
              setActionLoading(null);
            }
          },
        },
      ]
    );
  };

  const formatDateTime = (iso: string) =>
    new Date(iso).toLocaleDateString('en-IE', {
      weekday: 'short', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('en-IE', { hour: '2-digit', minute: '2-digit' });

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-IE', { month: 'short', day: 'numeric' });

  const getGreeting = () => {
    const h = new Date().getHours();
    if (h < 12) return 'Good morning';
    if (h < 18) return 'Good afternoon';
    return 'Good evening';
  };

  const firstName = user?.name?.split(' ')[0] ?? '';

  const initials = user?.name
    ? user.name.split(' ').map((n: string) => n[0]).join('').toUpperCase().slice(0, 2)
    : '?';

  const avatarColors = ['#6C3AED', '#3B82F6', '#10B981', '#F59E0B', '#EF4444', '#EC4899'];
  const avatarColor = avatarColors[(user?.name?.length ?? 0) % avatarColors.length];

  if (isLoading) {
    return (
      <View style={styles.centred}>
        <ActivityIndicator size="large" color={Colors.primary} />
      </View>
    );
  }

  const stats = data?.stats;

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: insets.bottom + Spacing.xxl }}
      showsVerticalScrollIndicator={false}
    >
      {/* ── Header banner ─────────────────────────────────────────── */}
      <LinearGradient
        colors={['#6C3AED', '#3B82F6']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={[styles.banner, { paddingTop: insets.top + Spacing.md }]}
      >
        <View style={styles.bannerContent}>
          <View style={styles.bannerLeft}>
            <Text style={styles.bannerGreeting}>{getGreeting()}</Text>
            <Text style={styles.bannerName}>{firstName}</Text>
            <Text style={styles.bannerSub}>
              {stats?.pending_count
                ? `You have ${stats.pending_count} request${stats.pending_count > 1 ? 's' : ''} waiting`
                : "You're all caught up"}
            </Text>
          </View>
          <View style={[styles.avatar, { backgroundColor: avatarColor }]}>
            <Text style={styles.avatarText}>{initials}</Text>
          </View>
        </View>
      </LinearGradient>

      {/* ── Stats grid ────────────────────────────────────────────── */}
      <View style={styles.statsSection}>
        <View style={styles.statsRow}>
          <StatCard
            icon="currency-eur"
            label="Total earned"
            value={`€${stats?.total_earnings ?? 0}`}
            sub={`€${stats?.earnings_this_month ?? 0} this month`}
            color={Colors.secondary}
            onPress={() => navigation.getParent()?.navigate('MentorFinance')}
          />
          <StatCard
            icon="calendar-check"
            label="Sessions"
            value={String(stats?.total_sessions ?? 0)}
            sub={`${stats?.sessions_this_month ?? 0} this month`}
            color={Colors.primary}
            onPress={() => navigation.getParent()?.navigate('MentorSessions')}
          />
        </View>
        <View style={styles.statsRow}>
          <StatCard
            icon="star"
            label="Avg rating"
            value={stats?.average_rating != null ? stats.average_rating.toFixed(1) : '—'}
            sub={`${stats?.total_reviews ?? 0} review${stats?.total_reviews !== 1 ? 's' : ''}`}
            color="#F59E0B"
            onPress={() => navigation.getParent()?.navigate('MentorReviews')}
          />
          <StatCard
            icon="clock-alert-outline"
            label="Pending"
            value={String(stats?.pending_count ?? 0)}
            sub="need your action"
            color={stats?.pending_count ? Colors.warning : Colors.textSecondary}
            onPress={() => navigation.getParent()?.navigate('MentorNotifications')}
          />
        </View>
      </View>

      {/* ── No profile prompt ─────────────────────────────────────── */}
      {!data?.has_profile && (
        <TouchableOpacity
          style={styles.noProfileCard}
          onPress={() => navigation.getParent()?.navigate('MentorAvailability')}
          activeOpacity={0.88}
        >
          <MaterialCommunityIcons name="account-edit-outline" size={32} color={Colors.primary} />
          <View style={{ flex: 1 }}>
            <Text style={styles.noProfileTitle}>Set up your mentor profile</Text>
            <Text style={styles.noProfileSub}>Add your bio, skills and hourly rate to start accepting bookings</Text>
          </View>
          <MaterialCommunityIcons name="arrow-right" size={20} color={Colors.primary} />
        </TouchableOpacity>
      )}

      {/* ── Pending requests ──────────────────────────────────────── */}
      {(data?.pending_bookings?.length ?? 0) > 0 && (
        <View style={styles.section}>
          <SectionHeader
            title="Pending requests"
            subtitle="These learners are waiting for your response"
          />
          {data!.pending_bookings.map(booking => (
            <View key={booking.id} style={[styles.bookingCard, styles.bookingCardPending]}>
              <View style={styles.bookingRow}>
                <View style={styles.bookingLeft}>
                  <Text style={styles.bookingName}>{booking.learner_name}</Text>
                  <Text style={styles.bookingService}>{booking.service_title}</Text>
                  <Text style={styles.bookingTime}>{formatDateTime(booking.slot_start)}</Text>
                  {booking.learner_note && (
                    <Text style={styles.bookingNote} numberOfLines={2}>
                      "{booking.learner_note}"
                    </Text>
                  )}
                </View>
                <Text style={styles.bookingAmount}>
                  {booking.amount_paid === 0 ? 'Free' : `€${booking.amount_paid}`}
                </Text>
              </View>
              <View style={styles.bookingActions}>
                <TouchableOpacity
                  style={styles.approveBtn}
                  onPress={() => handleApprove(booking.id)}
                  activeOpacity={0.85}
                  disabled={actionLoading === booking.id}
                >
                  {actionLoading === booking.id
                    ? <ActivityIndicator size="small" color="#fff" />
                    : <Text style={styles.approveBtnText}>Accept</Text>
                  }
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.denyBtn}
                  onPress={() => handleDeny(booking.id)}
                  activeOpacity={0.85}
                  disabled={actionLoading === booking.id}
                >
                  <Text style={styles.denyBtnText}>Decline</Text>
                </TouchableOpacity>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* ── Upcoming sessions ─────────────────────────────────────── */}
      {(data?.upcoming_bookings?.length ?? 0) > 0 && (
        <View style={styles.section}>
          <SectionHeader
            title="Upcoming sessions"
            subtitle="Your confirmed schedule"
          />
          {data!.upcoming_bookings.map(booking => (
            <View key={booking.id} style={styles.bookingCard}>
              <View style={styles.bookingRow}>
                <View style={styles.upcomingDateBox}>
                  <Text style={styles.upcomingDay}>
                    {new Date(booking.slot_start).toLocaleDateString('en-IE', { weekday: 'short' })}
                  </Text>
                  <Text style={styles.upcomingDate}>
                    {new Date(booking.slot_start).getDate()}
                  </Text>
                </View>
                <View style={styles.bookingLeft}>
                  <Text style={styles.bookingName}>{booking.learner_name}</Text>
                  <Text style={styles.bookingService}>{booking.service_title}</Text>
                  <Text style={styles.bookingTime}>
                    {formatTime(booking.slot_start)} – {formatTime(booking.slot_end)}
                  </Text>
                </View>
                <Text style={styles.bookingAmount}>
                  {booking.amount_paid === 0 ? 'Free' : `€${booking.amount_paid}`}
                </Text>
              </View>
            </View>
          ))}
        </View>
      )}

      {/* ── Empty state if no activity ────────────────────────────── */}
      {(data?.pending_bookings?.length ?? 0) === 0 &&
       (data?.upcoming_bookings?.length ?? 0) === 0 && data?.has_profile && (
        <View style={styles.emptyCard}>
          <MaterialCommunityIcons name="calendar-blank-outline" size={40} color={Colors.textSecondary} />
          <Text style={styles.emptyTitle}>No bookings yet</Text>
          <Text style={styles.emptySub}>
            Make sure your availability is set and your profile is visible to learners
          </Text>
          <TouchableOpacity
            style={styles.manageAvailBtn}
            onPress={() => navigation.getParent()?.navigate('MentorAvailability')}
            activeOpacity={0.88}
          >
            <Text style={styles.manageAvailText}>Manage availability</Text>
          </TouchableOpacity>
        </View>
      )}

      {/* ── Recent reviews ────────────────────────────────────────── */}
      {(data?.recent_reviews?.length ?? 0) > 0 && (
        <View style={styles.section}>
          <SectionHeader
            title="Recent reviews"
            subtitle="What learners are saying"
          />
          {data!.recent_reviews.map(review => (
            <View key={review.id} style={styles.reviewCard}>
              <View style={styles.reviewTop}>
                <Text style={styles.reviewerName}>{review.reviewer_name}</Text>
                <StarRow rating={review.rating} />
              </View>
              {review.comment && (
                <Text style={styles.reviewComment}>"{review.comment}"</Text>
              )}
              <Text style={styles.reviewDate}>{formatDate(review.created_at)}</Text>
            </View>
          ))}
        </View>
      )}

      {/* ── Quick actions ─────────────────────────────────────────── */}
      <View style={styles.section}>
        <SectionHeader title="Quick actions" />
        <View style={styles.quickActions}>
          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => navigation.getParent()?.navigate('MentorAvailability')}
            activeOpacity={0.85}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: Colors.primaryLight }]}>
              <MaterialCommunityIcons name="calendar-edit" size={22} color={Colors.primary} />
            </View>
            <Text style={styles.quickActionLabel}>Manage{'\n'}Availability</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickAction}
            onPress={() => navigation.navigate('EditLearnerProfile', {})}
            activeOpacity={0.85}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#ECFDF5' }]}>
              <MaterialCommunityIcons name="account-edit-outline" size={22} color={Colors.secondary} />
            </View>
            <Text style={styles.quickActionLabel}>Edit{'\n'}Profile</Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.quickAction}
            onPress={signOut}
            activeOpacity={0.85}
          >
            <View style={[styles.quickActionIcon, { backgroundColor: '#FEF2F2' }]}>
              <MaterialCommunityIcons name="logout" size={22} color={Colors.error} />
            </View>
            <Text style={[styles.quickActionLabel, { color: Colors.error }]}>Sign{'\n'}Out</Text>
          </TouchableOpacity>
        </View>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  centred: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.surface },

  // Banner
  banner: {
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.xl,
    borderBottomLeftRadius: 28,
    borderBottomRightRadius: 28,
  },
  bannerContent: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  bannerLeft: { flex: 1 },
  bannerGreeting: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.8)', fontWeight: '600' },
  bannerName: { fontSize: 28, fontWeight: '900', color: '#fff', letterSpacing: -0.5, marginVertical: 2 },
  bannerSub: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.75)', fontWeight: '600' },
  avatar: {
    width: 52, height: 52, borderRadius: 26,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 2, borderColor: 'rgba(255,255,255,0.4)',
  },
  avatarText: { color: '#fff', fontSize: 18, fontWeight: '900' },

  // Stats
  statsSection: {
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    gap: Spacing.sm,
  },
  statsRow: { flexDirection: 'row', gap: Spacing.sm },

  // Sections
  section: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl },
  sectionHeader: { marginBottom: Spacing.md },
  sectionTitle: {
    fontSize: FontSize.lg, fontWeight: '900',
    color: Colors.text, letterSpacing: -0.4, marginBottom: 2,
  },
  sectionSubtitle: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: '600' },

  // No profile
  noProfileCard: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.lg,
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.md,
    backgroundColor: Colors.primaryLight,
    borderRadius: 18,
    padding: Spacing.md,
    borderWidth: 1.5,
    borderColor: Colors.primary + '30',
  },
  noProfileTitle: { fontSize: FontSize.md, fontWeight: '900', color: Colors.text, marginBottom: 2 },
  noProfileSub: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: '600', lineHeight: 16 },

  // Booking cards
  bookingCard: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    shadowColor: '#000',
    shadowOpacity: 0.04,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 },
    elevation: 1,
  },
  bookingCardPending: {
    borderColor: Colors.warning,
    borderWidth: 1.5,
    backgroundColor: Colors.warning + '06',
  },
  bookingRow: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  bookingLeft: { flex: 1 },
  bookingName: { fontSize: FontSize.md, fontWeight: '900', color: Colors.text, marginBottom: 2 },
  bookingService: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.primary, marginBottom: 2 },
  bookingTime: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: '600' },
  bookingNote: {
    fontSize: FontSize.xs, color: Colors.textSecondary,
    fontStyle: 'italic', marginTop: 4, lineHeight: 16,
  },
  bookingAmount: { fontSize: FontSize.md, fontWeight: '900', color: Colors.secondary },

  // Pending actions
  bookingActions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md },
  approveBtn: {
    flex: 1, backgroundColor: Colors.secondary,
    borderRadius: 12, paddingVertical: 10,
    alignItems: 'center', justifyContent: 'center',
  },
  approveBtnText: { color: '#fff', fontWeight: '900', fontSize: FontSize.sm },
  denyBtn: {
    flex: 1, backgroundColor: Colors.background,
    borderRadius: 12, paddingVertical: 10,
    alignItems: 'center', borderWidth: 1.5, borderColor: Colors.error,
  },
  denyBtnText: { color: Colors.error, fontWeight: '900', fontSize: FontSize.sm },

  // Upcoming date box
  upcomingDateBox: {
    width: 44, alignItems: 'center',
    backgroundColor: Colors.primaryLight,
    borderRadius: 12, paddingVertical: 6,
    borderWidth: 1, borderColor: Colors.border,
  },
  upcomingDay: { fontSize: 10, fontWeight: '700', color: Colors.primary, textTransform: 'uppercase' },
  upcomingDate: { fontSize: FontSize.lg, fontWeight: '900', color: Colors.primary },

  // Empty state
  emptyCard: {
    marginHorizontal: Spacing.lg,
    marginTop: Spacing.xl,
    backgroundColor: Colors.background,
    borderRadius: 18,
    padding: Spacing.xl,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
    gap: Spacing.sm,
  },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: '900', color: Colors.text },
  emptySub: {
    fontSize: FontSize.sm, color: Colors.textSecondary,
    textAlign: 'center', lineHeight: 20, fontWeight: '600',
  },
  manageAvailBtn: {
    marginTop: Spacing.sm,
    backgroundColor: Colors.primary,
    borderRadius: 14,
    paddingHorizontal: Spacing.xl,
    paddingVertical: Spacing.sm,
  },
  manageAvailText: { color: '#fff', fontWeight: '900', fontSize: FontSize.sm },

  // Reviews
  reviewCard: {
    backgroundColor: Colors.background,
    borderRadius: 16,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    borderWidth: 1,
    borderColor: Colors.border,
    gap: 4,
  },
  reviewTop: { flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center' },
  reviewerName: { fontSize: FontSize.sm, fontWeight: '900', color: Colors.text },
  reviewComment: {
    fontSize: FontSize.sm, color: Colors.textSecondary,
    fontStyle: 'italic', lineHeight: 20,
  },
  reviewDate: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: '600' },

  // Quick actions
  quickActions: { flexDirection: 'row', gap: Spacing.sm },
  quickAction: { flex: 1, alignItems: 'center', gap: 8 },
  quickActionIcon: {
    width: 56, height: 56, borderRadius: 18,
    justifyContent: 'center', alignItems: 'center',
    borderWidth: 1, borderColor: Colors.border,
  },
  quickActionLabel: {
    fontSize: 11, fontWeight: '700',
    color: Colors.text, textAlign: 'center', lineHeight: 15,
  },
});

export default MentorDashboardScreen;