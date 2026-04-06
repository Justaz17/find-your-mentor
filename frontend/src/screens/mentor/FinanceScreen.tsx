import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, ScrollView,
  TouchableOpacity, ActivityIndicator, RefreshControl,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize } from '../../utils/constants';
import ScreenHeader from '../../components/common/ScreenHeader';
import { getMentorBookings } from '../../services/bookingService';

interface SessionBooking {
  id: number;
  learner_name: string;
  service_title: string;
  slot_start: string;
  slot_end: string;
  status: string;
  payment_status: string;
  amount_paid: number;
  learner_note: string | null;
}

type PeriodType = 'week' | 'month' | 'all';

const FinanceScreen = () => {
  const insets = useSafeAreaInsets();
  const [bookings, setBookings] = useState<SessionBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [period, setPeriod] = useState<PeriodType>('month');

  const load = useCallback(async () => {
    try {
      const data = await getMentorBookings();
      setBookings(data as any);
    } catch {}
    finally { setIsLoading(false); setIsRefreshing(false); }
  }, []);

  useFocusEffect(useCallback(() => { setIsLoading(true); load(); }, [load]));

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthStart = new Date(now.getFullYear(), now.getMonth(), 1);

  const completed = bookings.filter(b => b.status === 'completed');

  const inPeriod = (iso: string) => {
    const d = new Date(iso);
    if (period === 'week') return d >= weekAgo;
    if (period === 'month') return d >= monthStart;
    return true;
  };

  const periodBookings = completed.filter(b => inPeriod(b.slot_start));
  const periodEarnings = periodBookings.reduce((s, b) => s + b.amount_paid, 0);
  const totalEarnings = completed.reduce((s, b) => s + b.amount_paid, 0);
  const avgPerSession = completed.length > 0 ? totalEarnings / completed.length : 0;

  // Group by month for breakdown
  const byMonth: Record<string, { count: number; total: number }> = {};
  completed.forEach(b => {
    const key = new Date(b.slot_start).toLocaleDateString('en-IE', { month: 'short', year: 'numeric' });
    if (!byMonth[key]) byMonth[key] = { count: 0, total: 0 };
    byMonth[key].count++;
    byMonth[key].total += b.amount_paid;
  });
  const monthlyBreakdown = Object.entries(byMonth).reverse();

  const formatDate = (iso: string) =>
    new Date(iso).toLocaleDateString('en-IE', { day: 'numeric', month: 'short' });

  const PERIODS: { key: PeriodType; label: string }[] = [
    { key: 'week', label: 'This week' },
    { key: 'month', label: 'This month' },
    { key: 'all', label: 'All time' },
  ];

  if (isLoading) return (
    <View style={styles.centred}><ActivityIndicator size="large" color={Colors.primary} /></View>
  );

  return (
    <View style={styles.container}>
      <ScreenHeader title="Finances" />

      <ScrollView
        showsVerticalScrollIndicator={false}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => { setIsRefreshing(true); load(); }} tintColor={Colors.primary} />}
      >
        {/* Period selector */}
        <View style={styles.periodRow}>
          {PERIODS.map(p => (
            <TouchableOpacity
              key={p.key}
              style={[styles.periodChip, period === p.key && styles.periodChipActive]}
              onPress={() => setPeriod(p.key)}
              activeOpacity={0.85}
            >
              <Text style={[styles.periodChipText, period === p.key && styles.periodChipTextActive]}>
                {p.label}
              </Text>
            </TouchableOpacity>
          ))}
        </View>

        {/* Hero stat */}
        <View style={styles.heroCard}>
          <Text style={styles.heroLabel}>
            {period === 'week' ? 'This week' : period === 'month' ? 'This month' : 'All time'}
          </Text>
          <Text style={styles.heroValue}>€{periodEarnings.toFixed(2)}</Text>
          <Text style={styles.heroSub}>
            {periodBookings.length} completed session{periodBookings.length !== 1 ? 's' : ''}
          </Text>
        </View>

        {/* Summary cards */}
        <View style={styles.summaryRow}>
          <View style={styles.summaryCard}>
            <MaterialCommunityIcons name="currency-eur" size={18} color={Colors.secondary} />
            <Text style={styles.summaryValue}>€{totalEarnings.toFixed(0)}</Text>
            <Text style={styles.summaryLabel}>Total earned</Text>
          </View>
          <View style={styles.summaryCard}>
            <MaterialCommunityIcons name="chart-line" size={18} color={Colors.primary} />
            <Text style={styles.summaryValue}>€{avgPerSession.toFixed(0)}</Text>
            <Text style={styles.summaryLabel}>Avg per session</Text>
          </View>
          <View style={styles.summaryCard}>
            <MaterialCommunityIcons name="calendar-check" size={18} color="#F59E0B" />
            <Text style={styles.summaryValue}>{completed.length}</Text>
            <Text style={styles.summaryLabel}>Total sessions</Text>
          </View>
        </View>

        {/* Monthly breakdown */}
        {monthlyBreakdown.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Monthly breakdown</Text>
            {monthlyBreakdown.map(([month, data]) => {
              const pct = totalEarnings > 0 ? (data.total / totalEarnings) * 100 : 0;
              return (
                <View key={month} style={styles.monthRow}>
                  <View style={{ flex: 1 }}>
                    <View style={styles.monthHeader}>
                      <Text style={styles.monthLabel}>{month}</Text>
                      <Text style={styles.monthAmount}>€{data.total.toFixed(0)}</Text>
                    </View>
                    <View style={styles.progressTrack}>
                      <View style={[styles.progressFill, { width: `${pct}%` as any }]} />
                    </View>
                    <Text style={styles.monthSessions}>{data.count} session{data.count !== 1 ? 's' : ''}</Text>
                  </View>
                </View>
              );
            })}
          </View>
        )}

        {/* Recent transactions */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {period === 'all' ? 'All transactions' : `Transactions — ${PERIODS.find(p => p.key === period)?.label}`}
          </Text>
          {periodBookings.length === 0 ? (
            <View style={styles.emptyWrap}>
              <Text style={styles.emptyText}>No completed sessions in this period</Text>
            </View>
          ) : (
            periodBookings
              .sort((a, b) => new Date(b.slot_start).getTime() - new Date(a.slot_start).getTime())
              .map(b => (
                <View key={b.id} style={styles.txRow}>
                  <View style={styles.txLeft}>
                    <Text style={styles.txName}>{b.learner_name}</Text>
                    <Text style={styles.txService}>{b.service_title}</Text>
                    <Text style={styles.txDate}>{formatDate(b.slot_start)}</Text>
                  </View>
                  <View style={styles.txRight}>
                    <Text style={styles.txAmount}>+€{b.amount_paid.toFixed(2)}</Text>
                    <View style={[styles.txStatusDot, { backgroundColor: Colors.secondary }]} />
                  </View>
                </View>
              ))
          )}
        </View>
      </ScrollView>
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  centred: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    backgroundColor: Colors.background,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  headerTitle: { fontSize: FontSize.xl, fontWeight: '900', color: Colors.text, letterSpacing: -0.4 },
  content: { padding: Spacing.lg, paddingBottom: Spacing.xxl, gap: Spacing.md },
  periodRow: { flexDirection: 'row', gap: Spacing.sm },
  periodChip: {
    paddingHorizontal: 14, paddingVertical: 7, borderRadius: 999,
    backgroundColor: Colors.background, borderWidth: 1, borderColor: Colors.border,
  },
  periodChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  periodChipText: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.textSecondary },
  periodChipTextActive: { color: '#fff' },
  heroCard: {
    backgroundColor: Colors.primary, borderRadius: 20,
    padding: Spacing.xl, alignItems: 'center',
    shadowColor: Colors.primary, shadowOpacity: 0.3,
    shadowRadius: 16, shadowOffset: { width: 0, height: 8 }, elevation: 5,
  },
  heroLabel: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.8)', fontWeight: '700', marginBottom: 6 },
  heroValue: { fontSize: 42, fontWeight: '900', color: '#fff', letterSpacing: -1 },
  heroSub: { fontSize: FontSize.sm, color: 'rgba(255,255,255,0.75)', fontWeight: '600', marginTop: 4 },
  summaryRow: { flexDirection: 'row', gap: Spacing.sm },
  summaryCard: {
    flex: 1, backgroundColor: Colors.background,
    borderRadius: 14, padding: Spacing.md,
    alignItems: 'center', gap: 4,
    borderWidth: 1, borderColor: Colors.border,
  },
  summaryValue: { fontSize: FontSize.lg, fontWeight: '900', color: Colors.text, letterSpacing: -0.4 },
  summaryLabel: { fontSize: 10, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5, textAlign: 'center' },
  section: {
    backgroundColor: Colors.background, borderRadius: 16,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.border,
    gap: Spacing.sm,
  },
  sectionTitle: { fontSize: FontSize.md, fontWeight: '900', color: Colors.text, letterSpacing: -0.3 },
  monthRow: { paddingVertical: 4 },
  monthHeader: { flexDirection: 'row', justifyContent: 'space-between', marginBottom: 4 },
  monthLabel: { fontSize: FontSize.sm, fontWeight: '800', color: Colors.text },
  monthAmount: { fontSize: FontSize.sm, fontWeight: '900', color: Colors.secondary },
  progressTrack: { height: 4, backgroundColor: Colors.border, borderRadius: 2, marginBottom: 4 },
  progressFill: { height: 4, backgroundColor: Colors.primary, borderRadius: 2 },
  monthSessions: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: '600' },
  txRow: {
    flexDirection: 'row', justifyContent: 'space-between',
    alignItems: 'center', paddingVertical: 10,
    borderBottomWidth: 1, borderBottomColor: Colors.surface,
  },
  txLeft: { flex: 1 },
  txName: { fontSize: FontSize.sm, fontWeight: '800', color: Colors.text },
  txService: { fontSize: FontSize.xs, color: Colors.primary, fontWeight: '700', marginTop: 1 },
  txDate: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: '600', marginTop: 1 },
  txRight: { alignItems: 'flex-end', gap: 4 },
  txAmount: { fontSize: FontSize.md, fontWeight: '900', color: Colors.secondary },
  txStatusDot: { width: 6, height: 6, borderRadius: 3 },
  emptyWrap: { paddingVertical: Spacing.lg, alignItems: 'center' },
  emptyText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '600' },
});

export default FinanceScreen;