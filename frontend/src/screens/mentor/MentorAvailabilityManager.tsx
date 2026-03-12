// frontend/src/screens/mentor/MentorAvailabilityManager.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
  Alert,
  Modal,
} from 'react-native';
import { Colors, FontSize, Spacing } from '../../utils/constants';
import { useAvailability } from '../../hooks/useAvailability';
import SlotCard from '../../components/mentor/SlotCard';
import PatternCard from '../../components/mentor/PatternCard';
import AddSlotModal from '../../components/mentor/AddSlotModal';
import RecurringPatternModal from '../../components/mentor/RecurringPatternModal';

const MentorAvailabilityManager = () => {
  const { slots, patterns, isLoading, error, addSlot, removeSlot, addPattern, togglePatternActive, removePattern } =
    useAvailability();

  const [showAddSlotModal, setShowAddSlotModal] = useState(false);
  const [showAddPatternModal, setShowAddPatternModal] = useState(false);
  const [activeTab, setActiveTab] = useState<'slots' | 'patterns'>('patterns');

  // Handle add slot
  const handleAddSlot = async (startTime: string, endTime: string) => {
    try {
      await addSlot({ start_time: startTime, end_time: endTime });
      setShowAddSlotModal(false);
      Alert.alert('Success', 'Slot added successfully');
    } catch (err) {
      Alert.alert('Error', 'Failed to add slot');
    }
  };

  // Handle add pattern
  const handleAddPattern = async (day: string, startTime: string, endTime: string, generateUntil: string) => {
    try {
      await addPattern({
        day_of_week: day,
        start_time: startTime,
        end_time: endTime,
        generate_until: generateUntil,
      });
      setShowAddPatternModal(false);
      Alert.alert('Success', 'Pattern created - slots generated');
    } catch (err) {
      const message = err instanceof Error ? err.message : 'Failed to create pattern';
      Alert.alert('Error', message);
    }
  };

  // Handle delete slot
  const handleDeleteSlot = (slotId: number) => {
    Alert.alert('Delete Slot', 'Remove this availability slot?', [
      { text: 'Cancel', style: 'cancel' },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: async () => {
          try {
            await removeSlot(slotId);
            Alert.alert('Success', 'Slot deleted');
          } catch (err) {
            Alert.alert('Error', 'Failed to delete slot');
          }
        },
      },
    ]);
  };

  if (isLoading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color={Colors.primary} />
        <Text style={styles.loadingText}>Loading availability...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>⚠️ {error}</Text>
        <TouchableOpacity style={styles.retryButton}>
          <Text style={styles.retryText}>Retry</Text>
        </TouchableOpacity>
      </View>
    );
  }

  const availableSlots = slots.filter((s) => s.status === 'available');
  const bookedSlots = slots.filter((s) => s.status === 'booked');

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>📅 Availability</Text>
        <Text style={styles.subtitle}>Manage your teaching schedule</Text>
      </View>

      {/* Tab Navigation */}
      <View style={styles.tabContainer}>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'patterns' && styles.activeTab]}
          onPress={() => setActiveTab('patterns')}
        >
          <Text style={[styles.tabText, activeTab === 'patterns' && styles.activeTabText]}>
            Recurring ({patterns.length})
          </Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.tab, activeTab === 'slots' && styles.activeTab]}
          onPress={() => setActiveTab('slots')}
        >
          <Text style={[styles.tabText, activeTab === 'slots' && styles.activeTabText]}>
            Individual Slots ({availableSlots.length})
          </Text>
        </TouchableOpacity>
      </View>

      {/* Content */}
      <ScrollView style={styles.content}>
        {activeTab === 'patterns' ? (
          <>
            {/* Recurring Patterns Section */}
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowAddPatternModal(true)}
            >
              <Text style={styles.addButtonText}>+ Add Recurring Pattern</Text>
            </TouchableOpacity>

            {patterns.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateIcon}>📭</Text>
                <Text style={styles.emptyStateText}>No recurring patterns yet</Text>
                <Text style={styles.emptyStateSubtext}>
                  Create a pattern to auto-generate weekly slots
                </Text>
              </View>
            ) : (
              patterns.map((pattern) => (
                <PatternCard
                  key={pattern.id}
                  pattern={pattern}
                  onToggleActive={(isActive) => togglePatternActive(pattern.id, isActive)}
                  onDelete={() => removePattern(pattern.id)}
                />
              ))
            )}
          </>
        ) : (
          <>
            {/* Ad-hoc Slots Section */}
            <TouchableOpacity
              style={styles.addButton}
              onPress={() => setShowAddSlotModal(true)}
            >
              <Text style={styles.addButtonText}>+ Add Single Slot</Text>
            </TouchableOpacity>

            {availableSlots.length === 0 && bookedSlots.length === 0 ? (
              <View style={styles.emptyState}>
                <Text style={styles.emptyStateIcon}>📭</Text>
                <Text style={styles.emptyStateText}>No individual slots yet</Text>
                <Text style={styles.emptyStateSubtext}>
                  Add slots manually or use recurring patterns
                </Text>
              </View>
            ) : (
              <>
                {/* Available Slots */}
                {availableSlots.length > 0 && (
                  <>
                    <Text style={styles.sectionTitle}>Available ({availableSlots.length})</Text>
                    {availableSlots.map((slot) => (
                      <SlotCard
                        key={slot.id}
                        slot={slot}
                        onDelete={() => handleDeleteSlot(slot.id)}
                      />
                    ))}
                  </>
                )}

                {/* Booked Slots */}
                {bookedSlots.length > 0 && (
                  <>
                    <Text style={styles.sectionTitle}>Booked ({bookedSlots.length})</Text>
                    {bookedSlots.map((slot) => (
                      <SlotCard key={slot.id} slot={slot} />
                    ))}
                  </>
                )}
              </>
            )}
          </>
        )}
      </ScrollView>

      {/* Modals */}
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
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  header: {
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontSize: FontSize.xxl,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  subtitle: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
  },
  tabContainer: {
    flexDirection: 'row',
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  tab: {
    flex: 1,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.md,
    borderBottomWidth: 2,
    borderBottomColor: 'transparent',
  },
  activeTab: {
    borderBottomColor: Colors.primary,
  },
  tabText: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.textSecondary,
    textAlign: 'center',
  },
  activeTabText: {
    color: Colors.primary,
  },
  content: {
    flex: 1,
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
  },
  addButton: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    marginBottom: Spacing.lg,
    alignItems: 'center',
  },
  addButtonText: {
    color: Colors.textLight,
    fontSize: FontSize.md,
    fontWeight: '700',
  },
  sectionTitle: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.md,
    marginTop: Spacing.lg,
  },
  emptyState: {
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyStateIcon: {
    fontSize: FontSize.hero,
    marginBottom: Spacing.md,
  },
  emptyStateText: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.sm,
  },
  emptyStateSubtext: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    maxWidth: 280,
    textAlign: 'center',
  },
  centerContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.surface,
  },
  loadingText: {
    fontSize: FontSize.md,
    color: Colors.textSecondary,
    marginTop: Spacing.md,
  },
  errorText: {
    fontSize: FontSize.md,
    color: Colors.error,
    marginBottom: Spacing.lg,
  },
  retryButton: {
    backgroundColor: Colors.primary,
    borderRadius: 8,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  retryText: {
    color: Colors.textLight,
    fontSize: FontSize.md,
    fontWeight: '600',
  },
});

export default MentorAvailabilityManager;