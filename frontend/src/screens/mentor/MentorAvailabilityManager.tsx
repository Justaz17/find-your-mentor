import React, { useState } from 'react';
import {
  View, Text, ScrollView, TouchableOpacity,
  ActivityIndicator, Alert,
} from 'react-native';
import { useNavigation, useRoute, CommonActions } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing } from '../../utils/constants';
import { useAvailability } from '../../hooks/useAvailability';
import { useAuth } from '../../context/AuthContext';
import { RootStackParamList } from '../../navigation/types';
import SlotCard from '../../components/mentor/SlotCard';
import PatternCard from '../../components/mentor/PatternCard';
import AddSlotModal from '../../components/mentor/AddSlotModal';
import RecurringPatternModal from '../../components/mentor/RecurringPatternModal';
import Toast from '../../components/common/Toast';
import { useToast } from '../../hooks/useToast';

type Nav = NativeStackNavigationProp<RootStackParamList>;

const MentorAvailabilityManager = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<Nav>();
  const route = useRoute<any>();
  const isOnboarding = route.params?.isOnboarding ?? false;
  const { clearPendingOnboarding } = useAuth();
  const { toast, showToast, hideToast } = useToast();

  const {
    slots, patterns, isLoading, error,
    addSlot, removeSlot, addPattern, togglePatternActive, removePattern,
  } = useAvailability();

  const [showAddSlotModal, setShowAddSlotModal] = useState(false);
  const [showAddPatternModal, setShowAddPatternModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'slots' | 'patterns'>('slots');

  // ── Handlers ──────────────────────────────────────────────────────────

  const handleAddSlot = async (startTime: string, endTime: string) => {
    try {
      await addSlot({ start_time: startTime, end_time: endTime });
      setShowAddSlotModal(false);
      showToast('Slot added successfully');
    } catch {
      showToast('Failed to add slot', 'error');
    }
  };

  const handleAddPattern = async (
    day: string, startTime: string, endTime: string, generateUntil: string
  ) => {
    try {
      await addPattern({
        day_of_week: day,
        start_time: startTime,
        end_time: endTime,
        generate_until: generateUntil,
      });
      setShowAddPatternModal(false);
      showToast('Pattern created — slots generated');
    } catch (err: any) {
      const detail = err?.response?.data?.detail;
      const message = typeof detail === 'string' 
      ? detail 
      : err?.message || 'Failed to create pattern';
      showToast(message, 'error');
    }
  };

  const handleDeleteSlot = (slotId: number) => {
    Alert.alert('Delete Slot', 'Remove this availability slot?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await removeSlot(slotId);
            showToast('Slot deleted');
          } catch {
            showToast('Failed to delete slot', 'error');
          }
        },
      },
    ]);
  };

  const handleDeletePattern = (patternId: number) => {
    Alert.alert('Delete Pattern', 'This will remove all future slots from this pattern.', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await removePattern(patternId);
            showToast('Pattern deleted');
          } catch {
            showToast('Failed to delete pattern', 'error');
          }
        },
      },
    ]);
  };

  const handleDone = async () => {
    if (isOnboarding) {
      await clearPendingOnboarding();
    } else {
      navigation.goBack();
    }
  };

  // ── Loading / error states ────────────────────────────────────────────

  if (isLoading) return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center' }}>
      <ActivityIndicator size="large" color={Colors.primary} />
      <Text style={{ marginTop: Spacing.sm, color: Colors.textSecondary, fontWeight: '600' }}>
        Loading availability...
      </Text>
    </View>
  );

  if (error) return (
    <View style={{ flex: 1, justifyContent: 'center', alignItems: 'center', padding: Spacing.lg }}>
      <MaterialCommunityIcons name="alert-circle-outline" size={48} color={Colors.error} />
      <Text style={{ color: Colors.error, fontWeight: '700', marginTop: Spacing.sm, fontSize: FontSize.sm }}>
        {error}
      </Text>
    </View>
  );

  const availableSlots = slots.filter(s => s.status === 'available');
  const bookedSlots = slots.filter(s => s.status === 'booked');

  // ── Render ────────────────────────────────────────────────────────────

  return (
    <View style={{ flex: 1, backgroundColor: Colors.surface }}>

      {/* ── Header ── */}
      <View style={{
        backgroundColor: Colors.background,
        paddingTop: insets.top + Spacing.md,
        paddingHorizontal: Spacing.lg,
        paddingBottom: Spacing.lg,
        borderBottomWidth: 1, borderBottomColor: Colors.border,
        flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
      }}>
        <TouchableOpacity onPress={handleDone} activeOpacity={0.7}>
          <MaterialCommunityIcons name="arrow-left" size={24} color={Colors.text} />
        </TouchableOpacity>
        <View style={{ flex: 1 }}>
          <Text style={{ fontSize: FontSize.xl, fontWeight: '900', color: Colors.text }}>
            Availability
          </Text>
          <Text style={{ fontSize: FontSize.xs, color: Colors.textSecondary, fontWeight: '600' }}>
            Manage your teaching schedule
          </Text>
        </View>
        {isOnboarding && (
          <TouchableOpacity
            style={{
              backgroundColor: Colors.secondary, borderRadius: 12,
              paddingHorizontal: Spacing.md, paddingVertical: 8,
              flexDirection: 'row', alignItems: 'center', gap: 6,
            }}
            onPress={handleDone}
            activeOpacity={0.85}
          >
            <Text style={{ color: '#fff', fontWeight: '800', fontSize: FontSize.sm }}>Done</Text>
            <MaterialCommunityIcons name="check" size={16} color="#fff" />
          </TouchableOpacity>
        )}
      </View>

      {/* ── Tab navigation ── */}
      <View style={{
        flexDirection: 'row', backgroundColor: Colors.background,
        paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md,
        paddingTop: Spacing.sm, gap: Spacing.sm,
        borderBottomWidth: 1, borderBottomColor: Colors.border,
      }}>
        {(['slots', 'patterns'] as const).map(tab => (
          <TouchableOpacity
            key={tab}
            style={{
              flex: 1, paddingVertical: 10, borderRadius: 12, alignItems: 'center',
              backgroundColor: activeTab === tab ? Colors.primary : Colors.surface,
              borderWidth: 1,
              borderColor: activeTab === tab ? Colors.primary : Colors.border,
            }}
            onPress={() => setActiveTab(tab)}
            activeOpacity={0.85}
          >
            <Text style={{
              fontSize: FontSize.sm, fontWeight: '800',
              color: activeTab === tab ? '#fff' : Colors.textSecondary,
            }}>
              {tab === 'slots'
                ? `Slots (${availableSlots.length})`
                : `Recurring (${patterns.length})`
              }
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* ── Content ── */}
      <ScrollView
        contentContainerStyle={{
          padding: Spacing.lg, gap: Spacing.md,
          paddingBottom: insets.bottom + 40,
        }}
        showsVerticalScrollIndicator={false}
      >
        {activeTab === 'slots' ? (
          <>
            <TouchableOpacity
              style={{
                backgroundColor: Colors.primary, borderRadius: 14,
                paddingVertical: 14, flexDirection: 'row',
                justifyContent: 'center', alignItems: 'center', gap: 8,
              }}
              onPress={() => setShowAddSlotModal(true)}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons name="plus" size={20} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '900', fontSize: FontSize.sm }}>
                Add Single Slot
              </Text>
            </TouchableOpacity>

            {availableSlots.length === 0 && bookedSlots.length === 0 ? (
              <View style={{ alignItems: 'center', paddingTop: 60, gap: Spacing.md }}>
                <MaterialCommunityIcons name="calendar-blank-outline" size={48} color={Colors.border} />
                <Text style={{ fontSize: FontSize.lg, fontWeight: '900', color: Colors.text }}>
                  No slots yet
                </Text>
                <Text style={{
                  fontSize: FontSize.sm, color: Colors.textSecondary,
                  textAlign: 'center', lineHeight: 20,
                }}>
                  Add slots manually or use recurring patterns
                </Text>
              </View>
            ) : (
              <>
                {availableSlots.length > 0 && (
                  <>
                    <Text style={{
                      fontSize: FontSize.xs, fontWeight: '700',
                      color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5,
                    }}>
                      Available ({availableSlots.length})
                    </Text>
                    {availableSlots.map(slot => (
                      <SlotCard
                        key={slot.id}
                        slot={slot}
                        onDelete={() => handleDeleteSlot(slot.id)}
                      />
                    ))}
                  </>
                )}
                {bookedSlots.length > 0 && (
                  <>
                    <Text style={{
                      fontSize: FontSize.xs, fontWeight: '700',
                      color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5,
                    }}>
                      Booked ({bookedSlots.length})
                    </Text>
                    {bookedSlots.map(slot => (
                      <SlotCard key={slot.id} slot={slot} />
                    ))}
                  </>
                )}
              </>
            )}
          </>
        ) : (
          <>
            <TouchableOpacity
              style={{
                backgroundColor: Colors.primary, borderRadius: 14,
                paddingVertical: 14, flexDirection: 'row',
                justifyContent: 'center', alignItems: 'center', gap: 8,
              }}
              onPress={() => setShowAddPatternModal(true)}
              activeOpacity={0.85}
            >
              <MaterialCommunityIcons name="plus" size={20} color="#fff" />
              <Text style={{ color: '#fff', fontWeight: '900', fontSize: FontSize.sm }}>
                Add Recurring Pattern
              </Text>
            </TouchableOpacity>

            {patterns.length === 0 ? (
              <View style={{ alignItems: 'center', paddingTop: 60, gap: Spacing.md }}>
                <MaterialCommunityIcons name="calendar-blank-outline" size={48} color={Colors.border} />
                <Text style={{ fontSize: FontSize.lg, fontWeight: '900', color: Colors.text }}>
                  No recurring patterns
                </Text>
                <Text style={{
                  fontSize: FontSize.sm, color: Colors.textSecondary,
                  textAlign: 'center', lineHeight: 20,
                }}>
                  Create a pattern to auto-generate weekly slots
                </Text>
              </View>
            ) : (
              patterns.map(pattern => (
                <PatternCard
                  key={pattern.id}
                  pattern={pattern}
                  onToggleActive={isActive => togglePatternActive(pattern.id, isActive)}
                  onDelete={async () => handleDeletePattern(pattern.id)}
                />
              ))
            )}
          </>
        )}
      </ScrollView>

      {/* ── Modals ── */}
      <AddSlotModal
        visible={showAddSlotModal}
        onClose={() => setShowAddSlotModal(false)}
        onAdd={handleAddSlot}
      />
      <RecurringPatternModal
        visible={showAddPatternModal}
        onClose={() => setShowAddPatternModal(false)}
        onAdd={handleAddPattern}
      />

      {/* ── Toast ── */}
      <Toast
        visible={toast.visible}
        message={toast.message}
        type={toast.type}
        onHide={hideToast}
      />
    </View>
  );
};

export default MentorAvailabilityManager;