import React, { useState, useCallback } from 'react';
import {
  View, Text, StyleSheet, FlatList, TouchableOpacity,
  ActivityIndicator, RefreshControl, TextInput, Alert, Modal,
} from 'react-native';
import { useFocusEffect } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, Spacing, FontSize } from '../../utils/constants';
import ScreenHeader from '../../components/common/ScreenHeader';
import { getMentorBookings, mentorConfirmBooking } from '../../services/bookingService';
import api from '../../services/api';

interface SessionBooking {
  id: number;
  learner_name: string;
  service_title: string;
  slot_start: string;
  slot_end: string;
  status: string;
  amount_paid: number;
  learner_note: string | null;
  mentor_note?: string | null;
  learner_confirmed: boolean;
  mentor_confirmed: boolean;
}

type FilterType = 'all' | 'completed' | 'week' | 'month';

const SessionsScreen = () => {
  const insets = useSafeAreaInsets();
  const [sessions, setSessions] = useState<SessionBooking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [filter, setFilter] = useState<FilterType>('all');
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
  const [noteText, setNoteText] = useState('');
  const [savingNote, setSavingNote] = useState(false);
  const [confirmingId, setConfirmingId] = useState<number | null>(null);

  const load = useCallback(async () => {
    try {
      const data = await getMentorBookings();
      setSessions(data as any);
    } catch {}
    finally { setIsLoading(false); setIsRefreshing(false); }
  }, []);

  useFocusEffect(useCallback(() => { setIsLoading(true); load(); }, [load]));

  const saveNote = async (bookingId: number) => {
    setSavingNote(true);
    try {
      await api.patch(`/bookings/${bookingId}/mentor-note`, { mentor_note: noteText });
      setSessions(prev => prev.map(s => s.id === bookingId ? { ...s, mentor_note: noteText } : s));
      setEditingNoteId(null);
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to save note');
    } finally { setSavingNote(false); }
  };

  const handleMentorConfirm = async (bookingId: number) => {
  setConfirmingId(bookingId);
  try {
    await mentorConfirmBooking(bookingId);
    await load();
  } catch (e: any) {
    Alert.alert('Error', e.message || 'Failed to confirm session');
  } finally {
    setConfirmingId(null);
  }
};

  const getDuration = (start: string, end: string) => {
    const mins = Math.round((new Date(end).getTime() - new Date(start).getTime()) / 60000);
    return mins >= 60 ? `${Math.floor(mins / 60)}h ${mins % 60 > 0 ? `${mins % 60}m` : ''}`.trim() : `${mins}m`;
  };

  const formatDateTime = (iso: string) =>
    new Date(iso).toLocaleDateString('en-IE', {
      weekday: 'short', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

  const now = new Date();
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const monthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const filtered = sessions.filter(s => {
    const start = new Date(s.slot_start);
    if (filter === 'completed') return s.status === 'completed';
    if (filter === 'week') return start >= weekAgo;
    if (filter === 'month') return start >= monthAgo;
    return true;
  });

  const totalEarned = filtered
    .filter(s => s.status === 'completed')
    .reduce((sum, s) => sum + s.amount_paid, 0);

  const FILTERS: { key: FilterType; label: string }[] = [
    { key: 'all', label: 'All' },
    { key: 'completed', label: 'Completed' },
    { key: 'week', label: 'This week' },
    { key: 'month', label: 'This month' },
  ];

  if (isLoading) return (
    <View style={styles.centred}><ActivityIndicator size="large" color={Colors.primary} /></View>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <ScreenHeader title="Sessions" />

      {/* Filter tabs */}
      <View style={styles.filterRow}>
        {FILTERS.map(f => (
          <TouchableOpacity
            key={f.key}
            style={[styles.filterChip, filter === f.key && styles.filterChipActive]}
            onPress={() => setFilter(f.key)}
            activeOpacity={0.85}
          >
            <Text style={[styles.filterChipText, filter === f.key && styles.filterChipTextActive]}>
              {f.label}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      <FlatList
        data={filtered}
        keyExtractor={item => String(item.id)}
        refreshControl={<RefreshControl refreshing={isRefreshing} onRefresh={() => { setIsRefreshing(true); load(); }} tintColor={Colors.primary} />}
        contentContainerStyle={styles.list}
        ListEmptyComponent={
          <View style={styles.emptyWrap}>
            <MaterialCommunityIcons name="calendar-blank-outline" size={48} color={Colors.textSecondary} />
            <Text style={styles.emptyTitle}>No sessions found</Text>
          </View>
        }
        renderItem={({ item }) => {
          const isExpanded = expandedId === item.id;
          const isEditing = editingNoteId === item.id;
          const statusColor = item.status === 'completed' ? Colors.secondary
            : item.status === 'confirmed' ? Colors.primary
            : item.status === 'pending' ? Colors.warning : Colors.error;

          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => setExpandedId(isExpanded ? null : item.id)}
              activeOpacity={0.85}
            >
              <View style={styles.cardTop}>
                <View style={styles.dateBox}>
                  <Text style={styles.dateBoxDay}>
                    {new Date(item.slot_start).toLocaleDateString('en-IE', { weekday: 'short' })}
                  </Text>
                  <Text style={styles.dateBoxNum}>{new Date(item.slot_start).getDate()}</Text>
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.cardName}>{item.learner_name}</Text>
                  <Text style={styles.cardService}>{item.service_title}</Text>
                  <View style={styles.cardMeta}>
                    <MaterialCommunityIcons name="clock-outline" size={12} color={Colors.textSecondary} />
                    <Text style={styles.cardMetaText}>{getDuration(item.slot_start, item.slot_end)}</Text>
                    {item.mentor_note && (
                      <>
                        <MaterialCommunityIcons name="note-text-outline" size={12} color={Colors.primary} style={{ marginLeft: 8 }} />
                        <Text style={[styles.cardMetaText, { color: Colors.primary }]}>Note</Text>
                      </>
                    )}
                  </View>
                </View>
                <View style={styles.cardRight}>
                  <Text style={styles.cardAmount}>
                    {item.amount_paid === 0 ? 'Free' : `€${item.amount_paid}`}
                  </Text>
                  <View style={[styles.statusDot, { backgroundColor: statusColor }]} />
                </View>
              </View>

              {isExpanded && (
                <View style={styles.expandedSection}>
                  <View style={styles.divider} />

                  {/* Session time */}
                  <Text style={styles.expandedLabel}>Session time</Text>
                  <Text style={styles.expandedValue}>
                    {formatDateTime(item.slot_start)}
                  </Text>

                  {/* Learner note */}
                  {item.learner_note && (
                    <>
                      <Text style={[styles.expandedLabel, { marginTop: Spacing.sm }]}>Learner's note</Text>
                      <Text style={styles.expandedNote}>{item.learner_note}</Text>
                    </>
                  )}

                  {/* Mentor private note */}
                  <View style={styles.noteSection}>
                    <View style={styles.noteSectionHeader}>
                      <MaterialCommunityIcons name="lock-outline" size={14} color={Colors.primary} />
                      <Text style={styles.noteSectionTitle}>Private note (only you can see this)</Text>
                    </View>

                    {isEditing ? (
                      <View>
                        <TextInput
                          style={styles.noteInput}
                          value={noteText}
                          onChangeText={setNoteText}
                          placeholder="Add a private note about this session..."
                          placeholderTextColor={Colors.textSecondary}
                          multiline
                          numberOfLines={3}
                          autoFocus
                        />
                        <View style={styles.noteActions}>
                          <TouchableOpacity
                            onPress={() => setEditingNoteId(null)}
                            style={styles.noteCancelBtn}
                          >
                            <Text style={styles.noteCancelText}>Cancel</Text>
                          </TouchableOpacity>
                          <TouchableOpacity
                            style={styles.noteSaveBtn}
                            onPress={() => saveNote(item.id)}
                            disabled={savingNote}
                          >
                            {savingNote
                              ? <ActivityIndicator size="small" color="#fff" />
                              : <Text style={styles.noteSaveText}>Save</Text>
                            }
                          </TouchableOpacity>
                        </View>
                      </View>
                    ) : (
                      <TouchableOpacity
                        style={styles.noteDisplayBox}
                        onPress={() => { setEditingNoteId(item.id); setNoteText(item.mentor_note ?? ''); }}
                        activeOpacity={0.85}
                      >
                        {item.mentor_note
                          ? <Text style={styles.noteDisplayText}>{item.mentor_note}</Text>
                          : <Text style={styles.notePlaceholder}>Tap to add a private note...</Text>
                        }
                        <MaterialCommunityIcons name="pencil-outline" size={14} color={Colors.textSecondary} />
                      </TouchableOpacity>
                    )}
                  </View>
                  {/* Mentor confirm — past confirmed sessions */}
                  {new Date(item.slot_end) <= now && item.status === 'confirmed' || item.status === 'confirmed' && (
                    <TouchableOpacity
                      style={{
                        marginTop: Spacing.md,
                        backgroundColor: item.mentor_confirmed ? Colors.border : Colors.secondary,
                        borderRadius: 12, paddingVertical: 12,
                        flexDirection: 'row', alignItems: 'center',
                        justifyContent: 'center', gap: 6,
                        opacity: confirmingId === item.id ? 0.7 : 1,
                      }}
                      onPress={() => !item.mentor_confirmed && handleMentorConfirm(item.id)}
                      disabled={item.mentor_confirmed || confirmingId === item.id}
                      activeOpacity={0.85}
                    >
                      {confirmingId === item.id ? (
                        <ActivityIndicator size="small" color="#fff" />
                      ) : (
                        <>
                          <MaterialCommunityIcons
                            name={item.mentor_confirmed ? 'check-circle' : 'check-circle-outline'}
                            size={18} color="#fff"
                          />
                          <Text style={{ color: '#fff', fontWeight: '900', fontSize: FontSize.sm }}>
                            {item.mentor_confirmed ? 'Session confirmed ✓' : 'Mark session as done'}
                          </Text>
                        </>
                      )}
                    </TouchableOpacity>
                  )}
                </View>
              )}
            </TouchableOpacity>
          );
        }}
      />
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
  headerSub: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: '600', marginTop: 2 },
  filterRow: {
    flexDirection: 'row', gap: Spacing.sm,
    paddingHorizontal: Spacing.lg, paddingVertical: Spacing.sm,
    backgroundColor: Colors.background,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  filterChip: {
    paddingHorizontal: 14, paddingVertical: 6, borderRadius: 999,
    backgroundColor: Colors.surface, borderWidth: 1, borderColor: Colors.border,
  },
  filterChipActive: { backgroundColor: Colors.primary, borderColor: Colors.primary },
  filterChipText: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.textSecondary },
  filterChipTextActive: { color: '#fff' },
  list: { padding: Spacing.lg, paddingBottom: Spacing.xxl },
  card: {
    backgroundColor: Colors.background, borderRadius: 16,
    padding: Spacing.md, marginBottom: Spacing.sm,
    borderWidth: 1, borderColor: Colors.border,
  },
  cardTop: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  dateBox: {
    width: 44, alignItems: 'center', backgroundColor: Colors.primaryLight,
    borderRadius: 12, paddingVertical: 6, borderWidth: 1, borderColor: Colors.border,
  },
  dateBoxDay: { fontSize: 10, fontWeight: '700', color: Colors.primary, textTransform: 'uppercase' },
  dateBoxNum: { fontSize: FontSize.lg, fontWeight: '900', color: Colors.primary },
  cardName: { fontSize: FontSize.md, fontWeight: '900', color: Colors.text, marginBottom: 2 },
  cardService: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.primary, marginBottom: 4 },
  cardMeta: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  cardMetaText: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: '600' },
  cardRight: { alignItems: 'flex-end', gap: 4 },
  cardAmount: { fontSize: FontSize.md, fontWeight: '900', color: Colors.secondary },
  statusDot: { width: 8, height: 8, borderRadius: 4 },
  expandedSection: { marginTop: Spacing.md },
  divider: { height: 1, backgroundColor: Colors.border, marginBottom: Spacing.md },
  expandedLabel: {
    fontSize: FontSize.xs, fontWeight: '700', color: Colors.textSecondary,
    textTransform: 'uppercase', letterSpacing: 0.5, marginBottom: 4,
  },
  expandedValue: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.text },
  expandedNote: {
    fontSize: FontSize.sm, color: Colors.textSecondary,
    fontStyle: 'italic', lineHeight: 20,
  },
  noteSection: {
    marginTop: Spacing.md, backgroundColor: Colors.primaryLight,
    borderRadius: 12, padding: Spacing.md,
    borderWidth: 1, borderColor: Colors.primary + '30',
  },
  noteSectionHeader: { flexDirection: 'row', alignItems: 'center', gap: 5, marginBottom: Spacing.sm },
  noteSectionTitle: { fontSize: FontSize.xs, fontWeight: '800', color: Colors.primary },
  noteInput: {
    backgroundColor: Colors.background, borderRadius: 10,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.md, paddingVertical: 10,
    fontSize: FontSize.sm, color: Colors.text,
    fontWeight: '600', minHeight: 80, textAlignVertical: 'top',
  },
  noteActions: { flexDirection: 'row', justifyContent: 'flex-end', gap: Spacing.sm, marginTop: Spacing.sm },
  noteCancelBtn: { paddingHorizontal: 16, paddingVertical: 8 },
  noteCancelText: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '700' },
  noteSaveBtn: {
    backgroundColor: Colors.primary, borderRadius: 10,
    paddingHorizontal: 20, paddingVertical: 8,
  },
  noteSaveText: { color: '#fff', fontWeight: '900', fontSize: FontSize.sm },
  noteDisplayBox: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start',
    backgroundColor: Colors.background, borderRadius: 10,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.md, paddingVertical: 10, gap: 8,
  },
  noteDisplayText: { flex: 1, fontSize: FontSize.sm, color: Colors.text, fontWeight: '600', lineHeight: 20 },
  notePlaceholder: { flex: 1, fontSize: FontSize.sm, color: Colors.textSecondary, fontStyle: 'italic' },
  emptyWrap: { alignItems: 'center', paddingTop: 80, gap: Spacing.sm },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: '900', color: Colors.text },
});

export default SessionsScreen;