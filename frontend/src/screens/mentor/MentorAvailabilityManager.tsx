import React, { useState, useEffect } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity, StyleSheet,
  ActivityIndicator, Alert, TextInput, Modal,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing } from '../../utils/constants';
import { useAvailability } from '../../hooks/useAvailability';
import SlotCard from '../../components/mentor/SlotCard';
import PatternCard from '../../components/mentor/PatternCard';
import AddSlotModal from '../../components/mentor/AddSlotModal';
import RecurringPatternModal from '../../components/mentor/RecurringPatternModal';
import { getMentorServices, createService, deleteService } from '../../services/serviceService';
import { MentorService } from '../../types/Mentor';
import { useAuth } from '../../context/AuthContext';
import ScreenHeader from '../../components/common/ScreenHeader';
import api from '../../services/api';

type Tab = 'slots' | 'patterns' | 'services';

// ── Add Service Modal ─────────────────────────────────────────────────────
const AddServiceModal = ({
  visible, onClose, onAdd,
}: {
  visible: boolean;
  onClose: () => void;
  onAdd: (data: { title: string; description: string; duration_minutes: number; price: number }) => Promise<void>;
}) => {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [duration, setDuration] = useState('60');
  const [price, setPrice] = useState('0');
  const [saving, setSaving] = useState(false);

  const reset = () => { setTitle(''); setDescription(''); setDuration('60'); setPrice('0'); };

  const handleAdd = async () => {
    if (!title.trim()) { Alert.alert('Error', 'Title is required'); return; }
    const dur = parseInt(duration);
    const pr = parseFloat(price);
    if (isNaN(dur) || dur < 15) { Alert.alert('Error', 'Duration must be at least 15 minutes'); return; }
    if (isNaN(pr) || pr < 0) { Alert.alert('Error', 'Price must be 0 or more'); return; }
    setSaving(true);
    try {
      await onAdd({ title: title.trim(), description: description.trim(), duration_minutes: dur, price: pr });
      reset();
    } finally { setSaving(false); }
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <View style={svcStyles.modal}>
        <View style={svcStyles.modalHeader}>
          <Text style={svcStyles.modalTitle}>New service</Text>
          <TouchableOpacity onPress={onClose}>
            <MaterialCommunityIcons name="close" size={22} color={Colors.textSecondary} />
          </TouchableOpacity>
        </View>
        <ScrollView contentContainerStyle={svcStyles.modalContent} keyboardShouldPersistTaps="handled">
          <Text style={svcStyles.fieldLabel}>Title *</Text>
          <TextInput
            style={svcStyles.input}
            value={title}
            onChangeText={setTitle}
            placeholder="e.g. Python coaching session"
            placeholderTextColor={Colors.textSecondary}
          />
          <Text style={svcStyles.fieldLabel}>Description</Text>
          <TextInput
            style={[svcStyles.input, svcStyles.textArea]}
            value={description}
            onChangeText={setDescription}
            placeholder="What will learners get from this session?"
            placeholderTextColor={Colors.textSecondary}
            multiline
            numberOfLines={3}
          />
          <View style={svcStyles.row}>
            <View style={{ flex: 1 }}>
              <Text style={svcStyles.fieldLabel}>Duration (minutes)</Text>
              <TextInput
                style={svcStyles.input}
                value={duration}
                onChangeText={setDuration}
                keyboardType="numeric"
                placeholder="60"
                placeholderTextColor={Colors.textSecondary}
              />
            </View>
            <View style={{ width: Spacing.md }} />
            <View style={{ flex: 1 }}>
              <Text style={svcStyles.fieldLabel}>Price (€)</Text>
              <TextInput
                style={svcStyles.input}
                value={price}
                onChangeText={setPrice}
                keyboardType="decimal-pad"
                placeholder="0"
                placeholderTextColor={Colors.textSecondary}
              />
            </View>
          </View>
          <TouchableOpacity
            style={[svcStyles.addBtn, saving && { opacity: 0.6 }]}
            onPress={handleAdd}
            disabled={saving}
            activeOpacity={0.85}
          >
            {saving
              ? <ActivityIndicator size="small" color="#fff" />
              : <Text style={svcStyles.addBtnText}>Create service</Text>
            }
          </TouchableOpacity>
        </ScrollView>
      </View>
    </Modal>
  );
};

const svcStyles = StyleSheet.create({
  modal: { flex: 1, backgroundColor: Colors.background },
  modalHeader: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    padding: Spacing.lg, borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  modalTitle: { fontSize: FontSize.xl, fontWeight: '900', color: Colors.text },
  modalContent: { padding: Spacing.lg, gap: Spacing.md },
  fieldLabel: { fontSize: FontSize.sm, fontWeight: '800', color: Colors.text, marginBottom: 6 },
  input: {
    backgroundColor: Colors.surface, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.md, paddingVertical: 12,
    fontSize: FontSize.md, color: Colors.text, fontWeight: '600',
  },
  textArea: { minHeight: 80, textAlignVertical: 'top' },
  row: { flexDirection: 'row', alignItems: 'flex-start' },
  addBtn: {
    backgroundColor: Colors.primary, borderRadius: 14,
    paddingVertical: 15, alignItems: 'center', marginTop: Spacing.md,
  },
  addBtnText: { color: '#fff', fontWeight: '900', fontSize: FontSize.md },
});

// ── Week grouped slots ───────────────────────────────────────────────────────
const getWeekLabel = (date: Date): string => {
  const now = new Date();
  const startOfThisWeek = new Date(now);
  startOfThisWeek.setDate(now.getDate() - now.getDay());
  startOfThisWeek.setHours(0, 0, 0, 0);
  const startOfNextWeek = new Date(startOfThisWeek);
  startOfNextWeek.setDate(startOfThisWeek.getDate() + 7);

  if (date >= startOfThisWeek && date < startOfNextWeek) return 'This week';
  if (date >= startOfNextWeek && date < new Date(startOfNextWeek.getTime() + 7 * 24 * 60 * 60 * 1000)) return 'Next week';
  return date.toLocaleDateString('en-IE', { day: 'numeric', month: 'long' }) + ' week';
};

const groupSlotsByWeek = (slots: any[]) => {
  const groups: Record<string, any[]> = {};
  slots.forEach(slot => {
    const date = new Date(slot.start_time);
    const weekStart = new Date(date);
    weekStart.setDate(date.getDate() - date.getDay());
    weekStart.setHours(0, 0, 0, 0);
    const key = weekStart.toISOString();
    if (!groups[key]) groups[key] = [];
    groups[key].push(slot);
  });
  return Object.entries(groups)
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, slots]) => ({ label: getWeekLabel(new Date(key)), slots }));
};

const WeekGroupedSlots = ({
  availableSlots, bookedSlots, onDelete,
}: {
  availableSlots: any[]; bookedSlots: any[]; onDelete: (id: number) => void;
}) => {
  const [expandedWeeks, setExpandedWeeks] = React.useState<Set<string>>(new Set(['This week', 'Next week']));

  const toggleWeek = (label: string) => {
    setExpandedWeeks(prev => {
      const next = new Set(prev);
      next.has(label) ? next.delete(label) : next.add(label);
      return next;
    });
  };

  const availableGroups = groupSlotsByWeek(availableSlots);
  const bookedGroups = groupSlotsByWeek(bookedSlots);

  return (
    <View>
      {availableGroups.length > 0 && (
        <>
          <Text style={styles.sectionLabel}>Available ({availableSlots.length})</Text>
          {availableGroups.map(({ label, slots }) => (
            <View key={label}>
              <TouchableOpacity
                style={styles.weekHeader}
                onPress={() => toggleWeek(label)}
                activeOpacity={0.8}
              >
                <Text style={styles.weekLabel}>{label} ({slots.length})</Text>
                <MaterialCommunityIcons
                  name={expandedWeeks.has(label) ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={Colors.textSecondary}
                />
              </TouchableOpacity>
              {expandedWeeks.has(label) && slots.map((slot: any) => (
                <SlotCard key={slot.id} slot={slot} onDelete={() => onDelete(slot.id)} />
              ))}
            </View>
          ))}
        </>
      )}
      {bookedGroups.length > 0 && (
        <>
          <Text style={[styles.sectionLabel, { marginTop: Spacing.md }]}>Booked ({bookedSlots.length})</Text>
          {bookedGroups.map(({ label, slots }) => (
            <View key={label}>
              <TouchableOpacity
                style={styles.weekHeader}
                onPress={() => toggleWeek('booked_' + label)}
                activeOpacity={0.8}
              >
                <Text style={styles.weekLabel}>{label} ({slots.length})</Text>
                <MaterialCommunityIcons
                  name={expandedWeeks.has('booked_' + label) ? 'chevron-up' : 'chevron-down'}
                  size={18}
                  color={Colors.textSecondary}
                />
              </TouchableOpacity>
              {expandedWeeks.has('booked_' + label) && slots.map((slot: any) => (
                <SlotCard key={slot.id} slot={slot} />
              ))}
            </View>
          ))}
        </>
      )}
    </View>
  );
};

// ── Main screen ───────────────────────────────────────────────────────────
const MentorAvailabilityManager = () => {
  const { user } = useAuth();
  const { slots, patterns, isLoading, error, addSlot, removeSlot, addPattern, togglePatternActive, removePattern } =
    useAvailability();

  const [activeTab, setActiveTab] = useState<Tab>('services');
  const [showAddSlotModal, setShowAddSlotModal] = useState(false);
  const [showAddPatternModal, setShowAddPatternModal] = useState(false);
  const [showAddServiceModal, setShowAddServiceModal] = useState(false);
  const [services, setServices] = useState<MentorService[]>([]);
  const [servicesLoading, setServicesLoading] = useState(true);
  const [mentorProfileId, setMentorProfileId] = useState<number | null>(null);

  // Load mentor profile id and services
  useEffect(() => {
    const load = async () => {
      try {
        const profileRes = await api.get('/mentors/me/profile');
        const profileId = profileRes.data?.id;
        if (profileId) {
          setMentorProfileId(profileId);
          const data = await getMentorServices(profileId);
          setServices(data);
        }
      } catch (e) {
        // Profile might not exist yet
      } finally {
        setServicesLoading(false);
      }
    };
    load();
  }, []);

  const handleAddSlot = async (startTime: string, endTime: string) => {
    try {
      await addSlot({ start_time: startTime, end_time: endTime });
      setShowAddSlotModal(false);
      Alert.alert('Success', 'Slot added');
    } catch {
      Alert.alert('Error', 'Failed to add slot');
    }
  };

  const handleAddPattern = async (day: string, startTime: string, endTime: string, generateUntil: string) => {
    try {
      await addPattern({ day_of_week: day, start_time: startTime, end_time: endTime, generate_until: generateUntil });
      setShowAddPatternModal(false);
      Alert.alert('Success', 'Pattern created — slots generated');
    } catch (err) {
      Alert.alert('Error', err instanceof Error ? err.message : 'Failed to create pattern');
    }
  };

  const handleDeleteSlot = (slotId: number) => {
    Alert.alert('Delete slot', 'Remove this availability slot?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try { await removeSlot(slotId); }
          catch { Alert.alert('Error', 'Failed to delete slot'); }
        },
      },
    ]);
  };

  const handleAddService = async (data: { title: string; description: string; duration_minutes: number; price: number }) => {
    try {
      const newService = await createService(data);
      setServices(prev => [...prev, newService]);
      setShowAddServiceModal(false);
      Alert.alert('Success', 'Service created');
    } catch (e: any) {
      Alert.alert('Error', e.message || 'Failed to create service');
    }
  };

  const handleDeleteService = (serviceId: number) => {
    Alert.alert('Delete service', 'Remove this service?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete', style: 'destructive',
        onPress: async () => {
          try {
            await deleteService(serviceId);
            setServices(prev => prev.filter(s => s.id !== serviceId));
          } catch { Alert.alert('Error', 'Failed to delete service'); }
        },
      },
    ]);
  };

  const availableSlots = slots.filter(s => s.status === 'available');
  const bookedSlots = slots.filter(s => s.status === 'booked');

  const TABS: { key: Tab; label: string; count?: number }[] = [
    { key: 'services', label: 'Services', count: services.length },
    { key: 'patterns', label: 'Recurring', count: patterns.length },
    { key: 'slots', label: 'Slots', count: availableSlots.length },
  ];

  if (isLoading) return (
    <View style={styles.centred}>
      <ActivityIndicator size="large" color={Colors.primary} />
      <Text style={styles.loadingText}>Loading...</Text>
    </View>
  );

  return (
    <View style={styles.container}>
      <ScreenHeader title="Availability & Services" subtitle="Set up what you offer and when you're free" />

      {/* Tab bar */}
      <View style={styles.tabBar}>
        {TABS.map(tab => (
          <TouchableOpacity
            key={tab.key}
            style={[styles.tab, activeTab === tab.key && styles.tabActive]}
            onPress={() => setActiveTab(tab.key)}
            activeOpacity={0.85}
          >
            <Text style={[styles.tabText, activeTab === tab.key && styles.tabTextActive]}>
              {tab.label}{tab.count !== undefined ? ` (${tab.count})` : ''}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* Content */}
      <ScrollView style={styles.content} contentContainerStyle={styles.contentContainer} keyboardShouldPersistTaps="handled">

        {/* ── Services tab ── */}
        {activeTab === 'services' && (
          <>
            <View style={styles.infoBox}>
              <MaterialCommunityIcons name="information-outline" size={16} color={Colors.primary} />
              <Text style={styles.infoText}>
                Services are what learners book. Create at least one before adding availability slots.
              </Text>
            </View>

            <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddServiceModal(true)} activeOpacity={0.85}>
              <MaterialCommunityIcons name="plus" size={18} color="#fff" />
              <Text style={styles.addBtnText}>Add a service</Text>
            </TouchableOpacity>

            {servicesLoading ? (
              <ActivityIndicator color={Colors.primary} style={{ marginTop: Spacing.lg }} />
            ) : services.length === 0 ? (
              <View style={styles.empty}>
                <MaterialCommunityIcons name="briefcase-outline" size={40} color={Colors.textSecondary} />
                <Text style={styles.emptyTitle}>No services yet</Text>
                <Text style={styles.emptySub}>Create a service so learners can book sessions with you</Text>
              </View>
            ) : (
              services.map(service => (
                <View key={service.id} style={styles.serviceCard}>
                  <View style={styles.serviceTop}>
                    <View style={{ flex: 1 }}>
                      <Text style={styles.serviceName}>{service.title}</Text>
                      {service.description && (
                        <Text style={styles.serviceDesc} numberOfLines={2}>{service.description}</Text>
                      )}
                    </View>
                    <TouchableOpacity onPress={() => handleDeleteService(service.id)} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
                      <MaterialCommunityIcons name="trash-can-outline" size={20} color={Colors.error} />
                    </TouchableOpacity>
                  </View>
                  <View style={styles.serviceMeta}>
                    <View style={styles.serviceChip}>
                      <MaterialCommunityIcons name="clock-outline" size={13} color={Colors.primary} />
                      <Text style={styles.serviceChipText}>{service.duration_minutes} min</Text>
                    </View>
                    <View style={styles.serviceChip}>
                      <MaterialCommunityIcons name="currency-eur" size={13} color={Colors.secondary} />
                      <Text style={[styles.serviceChipText, { color: Colors.secondary }]}>
                        {service.price === 0 ? 'Free' : `€${service.price}`}
                      </Text>
                    </View>
                    <View style={[styles.serviceChip, { backgroundColor: service.is_active ? '#ECFDF5' : Colors.surface }]}>
                      <Text style={[styles.serviceChipText, { color: service.is_active ? Colors.secondary : Colors.textSecondary }]}>
                        {service.is_active ? 'Active' : 'Inactive'}
                      </Text>
                    </View>
                  </View>
                </View>
              ))
            )}
          </>
        )}

        {/* ── Recurring patterns tab ── */}
        {activeTab === 'patterns' && (
          <>
            <View style={styles.infoBox}>
              <MaterialCommunityIcons name="information-outline" size={16} color={Colors.primary} />
              <Text style={styles.infoText}>
                Recurring patterns auto-generate weekly slots up to a chosen date.
              </Text>
            </View>

            <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddPatternModal(true)} activeOpacity={0.85}>
              <MaterialCommunityIcons name="plus" size={18} color="#fff" />
              <Text style={styles.addBtnText}>Add recurring pattern</Text>
            </TouchableOpacity>

            {patterns.length === 0 ? (
              <View style={styles.empty}>
                <MaterialCommunityIcons name="calendar-repeat" size={40} color={Colors.textSecondary} />
                <Text style={styles.emptyTitle}>No recurring patterns</Text>
                <Text style={styles.emptySub}>Create a weekly pattern to auto-generate availability slots</Text>
              </View>
            ) : (
              patterns.map(pattern => (
                <PatternCard
                  key={pattern.id}
                  pattern={pattern}
                  onToggleActive={isActive => togglePatternActive(pattern.id, isActive)}
                  onDelete={() => removePattern(pattern.id)}
                />
              ))
            )}
          </>
        )}

        {/* ── Individual slots tab ── */}
        {activeTab === 'slots' && (
          <>
            <View style={styles.infoBox}>
              <MaterialCommunityIcons name="information-outline" size={16} color={Colors.primary} />
              <Text style={styles.infoText}>
                Add one-off slots for specific dates and times.
              </Text>
            </View>

            <TouchableOpacity style={styles.addBtn} onPress={() => setShowAddSlotModal(true)} activeOpacity={0.85}>
              <MaterialCommunityIcons name="plus" size={18} color="#fff" />
              <Text style={styles.addBtnText}>Add single slot</Text>
            </TouchableOpacity>

            {availableSlots.length === 0 && bookedSlots.length === 0 ? (
              <View style={styles.empty}>
                <MaterialCommunityIcons name="calendar-blank-outline" size={40} color={Colors.textSecondary} />
                <Text style={styles.emptyTitle}>No individual slots</Text>
                <Text style={styles.emptySub}>Add slots manually or use recurring patterns above</Text>
              </View>
            ) : (
              <WeekGroupedSlots
                availableSlots={availableSlots}
                bookedSlots={bookedSlots}
                onDelete={handleDeleteSlot}
              />
            )}
          </>
        )}
      </ScrollView>

      {/* Modals */}
      <AddSlotModal visible={showAddSlotModal} onClose={() => setShowAddSlotModal(false)} onAdd={handleAddSlot} />
      <RecurringPatternModal visible={showAddPatternModal} onClose={() => setShowAddPatternModal(false)} onAdd={handleAddPattern} />
      <AddServiceModal visible={showAddServiceModal} onClose={() => setShowAddServiceModal(false)} onAdd={handleAddService} />
    </View>
  );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: Colors.surface },
  centred: { flex: 1, justifyContent: 'center', alignItems: 'center', backgroundColor: Colors.surface },
  loadingText: { fontSize: FontSize.sm, color: Colors.textSecondary, marginTop: Spacing.sm },
  header: {
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.md,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  title: { fontSize: FontSize.xl, fontWeight: '900', color: Colors.text, letterSpacing: -0.4 },
  subtitle: { fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: '600', marginTop: 2 },
  tabBar: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1, paddingVertical: Spacing.md,
    borderBottomWidth: 2, borderBottomColor: 'transparent',
  },
  tabActive: { borderBottomColor: Colors.primary },
  tabText: {
    fontSize: FontSize.sm, fontWeight: '700',
    color: Colors.textSecondary, textAlign: 'center',
  },
  tabTextActive: { color: Colors.primary },
  content: { flex: 1 },
  contentContainer: { padding: Spacing.lg, paddingBottom: Spacing.xxl, gap: Spacing.sm },
  infoBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: Colors.primaryLight, borderRadius: 12,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.primary + '30',
  },
  infoText: { flex: 1, fontSize: FontSize.xs, color: Colors.primary, fontWeight: '600', lineHeight: 18 },
  addBtn: {
    flexDirection: 'row', alignItems: 'center', justifyContent: 'center',
    gap: 6, backgroundColor: Colors.primary, borderRadius: 14,
    paddingVertical: 13,
    shadowColor: Colors.primary, shadowOpacity: 0.25,
    shadowRadius: 10, shadowOffset: { width: 0, height: 4 }, elevation: 3,
  },
  addBtnText: { color: '#fff', fontWeight: '900', fontSize: FontSize.md },
  empty: { alignItems: 'center', paddingVertical: Spacing.xxl, gap: Spacing.sm },
  emptyTitle: { fontSize: FontSize.lg, fontWeight: '900', color: Colors.text },
  emptySub: { fontSize: FontSize.sm, color: Colors.textSecondary, textAlign: 'center', fontWeight: '600', lineHeight: 20 },
  sectionLabel: {
    fontSize: FontSize.sm, fontWeight: '900', color: Colors.text,
    textTransform: 'uppercase', letterSpacing: 0.5, marginTop: Spacing.md, marginBottom: Spacing.sm,
  },
  serviceCard: {
    backgroundColor: Colors.background, borderRadius: 16,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.border,
    gap: Spacing.sm,
  },
  serviceTop: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.sm },
  serviceName: { fontSize: FontSize.md, fontWeight: '900', color: Colors.text, marginBottom: 2 },
  serviceDesc: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '600', lineHeight: 18 },
  serviceMeta: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  serviceChip: {
    flexDirection: 'row', alignItems: 'center', gap: 4,
    paddingHorizontal: 10, paddingVertical: 4, borderRadius: 999,
    backgroundColor: Colors.primaryLight, borderWidth: 1, borderColor: Colors.border,
  },
  serviceChipText: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.primary },
  weekHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: Spacing.sm,
    paddingHorizontal: Spacing.sm,
    backgroundColor: Colors.surface,
    borderRadius: 10,
    marginBottom: Spacing.xs,
    borderWidth: 1,
    borderColor: Colors.border,
  },
  weekLabel: {
    fontSize: FontSize.sm,
    fontWeight: '800',
    color: Colors.text,
  },
});

export default MentorAvailabilityManager;