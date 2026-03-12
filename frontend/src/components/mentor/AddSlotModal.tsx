// frontend/src/components/AvailabilityModals/AddSlotModal.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  StyleSheet,
  Alert,
  TextInput,
  ScrollView,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors, FontSize, Spacing } from '../../utils/constants';

interface AddSlotModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (startTime: string, endTime: string) => Promise<void>;
}

const AddSlotModal = ({ visible, onClose, onAdd }: AddSlotModalProps) => {
  const [startDate, setStartDate] = useState(new Date());
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date(new Date().getTime() + 60 * 60 * 1000)); // +1 hour
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleStartDateChange = (event: any, selectedDate?: Date) => {
    setShowStartDatePicker(false);
    if (selectedDate) {
      setStartDate(selectedDate);
    }
  };

  const handleStartTimeChange = (event: any, selectedTime?: Date) => {
    setShowStartTimePicker(false);
    if (selectedTime) {
      setStartTime(selectedTime);
    }
  };

  const handleEndTimeChange = (event: any, selectedTime?: Date) => {
    setShowEndTimePicker(false);
    if (selectedTime) {
      setEndTime(selectedTime);
    }
  };

  const handleAddSlot = async () => {
    // Combine date and time
    const startDateTime = new Date(
      startDate.getFullYear(),
      startDate.getMonth(),
      startDate.getDate(),
      startTime.getHours(),
      startTime.getMinutes()
    );

    const endDateTime = new Date(
      startDate.getFullYear(),
      startDate.getMonth(),
      startDate.getDate(),
      endTime.getHours(),
      endTime.getMinutes()
    );

    // Validate
    if (startDateTime >= endDateTime) {
      Alert.alert('Invalid Time', 'End time must be after start time');
      return;
    }

    if (startDateTime < new Date()) {
      Alert.alert('Invalid Date', 'Cannot create slots in the past');
      return;
    }

    try {
      setIsLoading(true);
      await onAdd(startDateTime.toISOString(), endDateTime.toISOString());
    } finally {
      setIsLoading(false);
    }
  };

  const formatDateTime = (date: Date, time: Date): string => {
    const dateStr = date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
    const timeStr = time.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' });
    return `${dateStr} ${timeStr}`;
  };

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancelButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Add Slot</Text>
          <TouchableOpacity
            onPress={handleAddSlot}
            disabled={isLoading}
          >
            <Text style={[styles.saveButton, isLoading && styles.disabledButton]}>
              {isLoading ? 'Adding...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {/* Date Picker */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>📅 Date</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowStartDatePicker(true)}
            >
              <Text style={styles.pickerButtonText}>
                {startDate.toLocaleDateString('en-US', {
                  weekday: 'long',
                  month: 'long',
                  day: 'numeric',
                })}
              </Text>
            </TouchableOpacity>

            {showStartDatePicker && (
              <DateTimePicker
                value={startDate}
                mode="date"
                display="spinner"
                onChange={handleStartDateChange}
                minimumDate={new Date()}
              />
            )}
          </View>

          {/* Start Time Picker */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>⏰ Start Time</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowStartTimePicker(true)}
            >
              <Text style={styles.pickerButtonText}>
                {startTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </TouchableOpacity>

            {showStartTimePicker && (
              <DateTimePicker
                value={startTime}
                mode="time"
                display="spinner"
                onChange={handleStartTimeChange}
              />
            )}
          </View>

          {/* End Time Picker */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>⏱ End Time</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowEndTimePicker(true)}
            >
              <Text style={styles.pickerButtonText}>
                {endTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
              </Text>
            </TouchableOpacity>

            {showEndTimePicker && (
              <DateTimePicker
                value={endTime}
                mode="time"
                display="spinner"
                onChange={handleEndTimeChange}
              />
            )}
          </View>

          {/* Summary */}
          <View style={styles.summary}>
            <Text style={styles.summaryLabel}>Summary</Text>
            <Text style={styles.summaryText}>
              {formatDateTime(startDate, startTime)} - {endTime.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit' })}
            </Text>
          </View>
        </View>
      </ScrollView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.xl,
    paddingBottom: Spacing.lg,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  cancelButton: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.error,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  saveButton: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.primary,
  },
  disabledButton: {
    opacity: 0.5,
  },
  content: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.xl,
  },
  section: {
    marginBottom: Spacing.xl,
  },
  sectionLabel: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.md,
  },
  pickerButton: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingVertical: Spacing.md,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
  },
  pickerButtonText: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
  },
  summary: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 12,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    marginTop: Spacing.xl,
  },
  summaryLabel: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.primary,
    marginBottom: Spacing.sm,
  },
  summaryText: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.text,
  },
});

export default AddSlotModal;