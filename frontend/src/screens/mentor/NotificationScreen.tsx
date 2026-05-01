import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList,
  TouchableOpacity, ActivityIndicator, Alert, RefreshControl,
} from 'react-native';
import { useNavigation, useFocusEffect } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colours, Spacing, FontSize } from '../../utils/constants';
import ScreenHeader from '../../components/common/ScreenHeader';
import { RootStackParamList } from '../../navigation/types';
import { getMentorBookings, approveBooking, denyBooking } from '../../services/bookingService';
import { SessionBooking } from '../../types/Booking';

type NavProp = NativeStackNavigationProp<RootStackParamList>;

const NotificationsScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<NavProp>();
  const [pending, setPending] = useState<SessionBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [actionLoading, setActionLoading] = useState<number | null>(null);
  
  const load = useCallback(async () => {
  try {
    const data = await getMentorBookings();
    const now = new Date();
    setPending(data.filter((b: any) => b.status === 'pending'));
  } catch {}
  finally { setIsLoading(false); setIsRefreshing(false); }
}, []);

  useFocusEffect(useCallback(() => { setIsLoading(true); load(); }, [load]));

  const handleApprove = async (id: number) => {
    setActionLoading(id);
    try {
      await approveBooking(id);
      await load();
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to approve');
    } finally { setActionLoading(null); }
  };

  const handleDeny = (id: number) => {
    Alert.alert('Decline booking', 'The learner will be notified and the slot freed.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Decline', style: 'destructive',
        onPress: async () => {
          setActionLoading(id);
          try { await denyBooking(id); await load(); }
          catch (e: any) { Alert.alert('Error', e.message); }
          finally { setActionLoading(null); }
        },
      },
    ]);
  };

  const formatDateTime = (iso: string) =>
    new Date(iso).toLocaleDateString('en-IE', {
      weekday: 'short', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('en-IE', { hour: '2-digit', minute: '2-digit' });

  if (isLoading) return (
    <View style={styles.centred}><ActivityIndicator size="large" color={Colours.primary} /></View>
  );

  const allEmpty = pending.length === 0;

  return (
    <View style={styles.container}>
      <ScreenHeader title="Notifications" />

      <FlatList
        data={[]}
        renderItem={null}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => { setIsRefreshing(true); load(); }} tintColor={Colours.primary} />}
        ListHeaderComponent={
          <View>
            {/* Pending requests */}
            {pending.length > 0 && (
              <View style={styles.section}>
                <Text style={styles.sectionTitle}>Needs your action</Text>
                <Text style={styles.sectionSub}>{pending.length} booking request{pending.length > 1 ? 's' : ''} waiting</Text>
                {pending.map(b => (
                  <View key={b.id} style={[styles.card, styles.cardPending]}>
                    <View style={styles.cardTop}>
                      <View style={styles.urgentDot} />
                      <View style={{ flex: 1 }}>
                        <Text style={styles.cardName}>{b.learner_name}</Text>
                        <Text style={styles.cardService}>{b.service_title}</Text>
                        <Text style={styles.cardTime}>{formatDateTime(b.slot_start)}</Text>
                        {b.learner_note && (
                          <View style={styles.noteBox}>
                            <MaterialCommunityIcons name="message-text-outline" size={12} color={Colours.textSecondary} />
                            <Text style={styles.noteText} numberOfLines={2}>{b.learner_note}</Text>
                          </View>
                        )}
                      </View>
                      <Text style={styles.amount}>{b.amount_paid === 0 ? 'Free' : `€${b.amount_paid}`}</Text>
                    </View>
                    <View style={styles.actions}>
                      <TouchableOpacity
                        style={styles.approveBtn}
                        onPress={() => handleApprove(b.id)}
                        disabled={actionLoading === b.id}
                        activeOpacity={0.85}
                      >
                        {actionLoading === b.id
                          ? <ActivityIndicator size="small" color="#fff" />
                          : <><MaterialCommunityIcons name="check" size={16} color="#fff" /><Text style={styles.approveBtnText}>Accept</Text></>
                        }
                      </TouchableOpacity>
                      <TouchableOpacity
                        style={styles.denyBtn}
                        onPress={() => handleDeny(b.id)}
                        disabled={actionLoading === b.id}
                        activeOpacity={0.85}
                      >
                        <MaterialCommunityIcons name="close" size={16} color={Colours.error} />
                        <Text style={styles.denyBtnText}>Decline</Text>
                      </TouchableOpacity>
                    </View>
                  </View>
                ))}
              </View>
            )}

            {allEmpty && (
              <View style={styles.emptyWrap}>
                <MaterialCommunityIcons name="bell-outline" size={48} color={Colours.textSecondary} />
                <Text style={styles.emptyTitle}>No requests</Text>
                <Text style={styles.emptySub}>No pending booking requests</Text>
              </View>
            )}
          </View>
        }
        contentContainerStyle={{ paddingBottom: Spacing.xxl }}
      />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colours.surface },
  centred: { flex: 1, justifyContent: 'center', alignItems: 'center' },
  header: {
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.md,
    backgroundColor: Colours.background,
    borderBottomWidth: 1, borderBottomColor: Colours.border,
  },
  headerTitle: { fontSize: FontSize.xl, fontWeight: '900', color: Colours.text, letterSpacing: -0.4 },
  section: { paddingHorizontal: Spacing.lg, paddingTop: Spacing.xl },
  sectionTitle: { fontSize: FontSize.lg, fontWeight: '900', color: Colours.text, letterSpacing: -0.4, marginBottom: 2 },
  sectionSub: { fontSize: FontSize.xs, color: Colours.textSecondary, fontWeight: '600', marginBottom: Spacing.md },
  card: {
    backgroundColor: Colours.background, borderRadius: 16,
    padding: Spacing.md, marginBottom: Spacing.sm,
    borderWidth: 1, borderColor: Colours.border,
    shadowColor: '#000', shadowOpacity: 0.04, shadowRadius: 8,
    shadowOffset: { width: 0, height: 2 }, elevation: 1,
  },
  cardPending: { borderColor: Colours.warning, borderWidth: 1.5, backgroundColor: Colours.warning + '06' },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  urgentDot: {
    width: 8, height: 8, borderRadius: 4,
    backgroundColor: Colours.warning, marginTop: 6,
  },
  cardName: { fontSize: FontSize.md, fontWeight: '900', color: Colours.text, marginBottom: 2 },
  cardService: { fontSize: FontSize.sm, fontWeight: '700', color: Colours.primary, marginBottom: 2 },
  cardTime: { fontSize: FontSize.xs, color: Colours.textSecondary, fontWeight: '600' },
  noteBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 4,
    marginTop: 6, backgroundColor: Colours.surface,
    borderRadius: 8, padding: 8,
  },
  noteText: { flex: 1, fontSize: FontSize.xs, color: Colours.textSecondary, fontWeight: '500', lineHeight: 16 },
  amount: { fontSize: FontSize.md, fontWeight: '900', color: Colours.secondary },
  actions: { flexDirection: 'row', gap: Spacing.sm, marginTop: Spacing.md },
  approveBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, backgroundColor: Colours.secondary,
    borderRadius: 12, paddingVertical: 10,
  },
  approveBtnText: { color: '#fff', fontWeight: '900', fontSize: FontSize.sm },
  denyBtn: {
    flex: 1, flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, backgroundColor: Colours.background,
    borderRadius: 12, paddingVertical: 10,
    borderWidth: 1.5, borderColor: Colours.error,
  },
  denyBtnText: { color: Colours.error, fontWeight: '900', fontSize: FontSize.sm },
  dateBox: {
    width: 44, alignItems: 'center',
    backgroundColor: Colours.primaryLight, borderRadius: 12,
    paddingVertical: 6, borderWidth: 1, borderColor: Colours.border,
  },
  dateBoxDay: { fontSize: 10, fontWeight: '700', color: Colours.primary, textTransform: 'uppercase' },
  dateBoxNum: { fontSize: FontSize.lg, fontWeight: '900', color: Colours.primary },
  emptyWrap: { alignItems: 'center', paddingTop: 80, gap: Spacing.sm, paddingHorizontal: Spacing.xl },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: '900', color: Colours.text },
  emptySub: { fontSize: FontSize.sm, color: Colours.textSecondary, textAlign: 'center', fontWeight: '600' },
});

export default NotificationsScreen;