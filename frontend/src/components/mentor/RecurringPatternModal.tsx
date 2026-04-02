// frontend/src/components/AvailabilityModals/RecurringPatternModal.tsx

import React, { useState } from 'react';
import {
  View,
  Text,
  Modal,
  TouchableOpacity,
  Alert,
  ScrollView,
  FlatList,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { Colors, FontSize, Spacing } from '../../utils/constants';
import { styles } from '../../styles/RecurringPatternModal.styles';

interface RecurringPatternModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (day: string, startTime: string, endTime: string, generateUntil: string) => Promise<void>;
}

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];

const RecurringPatternModal = ({ visible, onClose, onAdd }: RecurringPatternModalProps) => {
  const [selectedDay, setSelectedDay] = useState('MONDAY');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [generateUntil, setGenerateUntil] = useState(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)); // +90 days
  const [showGenerateUntilPicker, setShowGenerateUntilPicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleGenerateUntilChange = (event: any, selectedDate?: Date) => {
    setShowGenerateUntilPicker(false);
    if (selectedDate) {
      setGenerateUntil(selectedDate);
    }
  };

  const parseTime = (timeStr: string): { hours: number; minutes: number } => {
    const [h, m] = timeStr.split(':').map(Number);
    return { hours: h, minutes: m };
  };

  const handleAddPattern = async () => {
    // Validate
    const startParsed = parseTime(startTime);
    const endParsed = parseTime(endTime);

    const startMinutes = startParsed.hours * 60 + startParsed.minutes;
    const endMinutes = endParsed.hours * 60 + endParsed.minutes;

    if (startMinutes >= endMinutes) {
      Alert.alert('Invalid Time', 'End time must be after start time');
      return;
    }

    if (generateUntil <= new Date()) {
      Alert.alert('Invalid Date', 'Generate until must be in the future');
      return;
    }

    try {
      setIsLoading(true);
      const generateUntilStr = generateUntil.toISOString().split('T')[0]; // YYYY-MM-DD
      await onAdd(selectedDay, startTime, endTime, generateUntilStr);
    } finally {
      setIsLoading(false);
    }
  };

  const dayEmojis: { [key: string]: string } = {
    MONDAY: '🌟',
    TUESDAY: '📅',
    WEDNESDAY: '⚡',
    THURSDAY: '🎯',
    FRIDAY: '🚀',
    SATURDAY: '☀️',
    SUNDAY: '🌙',
  };

  const timeOptions = [];
  for (let h = 0; h < 24; h++) {
    for (let m = 0; m < 60; m += 15) {
      const time = `${h.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`;
      timeOptions.push(time);
    }
  }

  return (
    <Modal visible={visible} animationType="slide" transparent={false}>
      <ScrollView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity onPress={onClose}>
            <Text style={styles.cancelButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Add Pattern</Text>
          <TouchableOpacity
            onPress={handleAddPattern}
            disabled={isLoading}
          >
            <Text style={[styles.saveButton, isLoading && styles.disabledButton]}>
              {isLoading ? 'Creating...' : 'Create'}
            </Text>
          </TouchableOpacity>
        </View>

        <View style={styles.content}>
          {/* Day Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>📅 Which day?</Text>
            <View style={styles.dayGrid}>
              {DAYS.map((day) => (
                <TouchableOpacity
                  key={day}
                  style={[
                    styles.dayButton,
                    selectedDay === day && styles.dayButtonActive,
                  ]}
                  onPress={() => setSelectedDay(day)}
                >
                  <Text style={styles.dayEmoji}>{dayEmojis[day]}</Text>
                  <Text
                    style={[
                      styles.dayButtonText,
                      selectedDay === day && styles.dayButtonTextActive,
                    ]}
                  >
                    {day.slice(0, 3)}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Start Time */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>⏰ Start Time</Text>
            <View style={styles.timeInputContainer}>
              <Text style={styles.timeDisplay}>{startTime}</Text>
              <View style={styles.timeButtons}>
                <TouchableOpacity
                  style={styles.timeAdjustButton}
                  onPress={() => {
                    const [h, m] = startTime.split(':').map(Number);
                    const newH = (h - 1 + 24) % 24;
                    setStartTime(`${newH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
                  }}
                >
                  <Text style={styles.timeAdjustText}>−</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.timeAdjustButton}
                  onPress={() => {
                    const [h, m] = startTime.split(':').map(Number);
                    const newH = (h + 1) % 24;
                    setStartTime(`${newH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
                  }}
                >
                  <Text style={styles.timeAdjustText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* End Time */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>⏱ End Time</Text>
            <View style={styles.timeInputContainer}>
              <Text style={styles.timeDisplay}>{endTime}</Text>
              <View style={styles.timeButtons}>
                <TouchableOpacity
                  style={styles.timeAdjustButton}
                  onPress={() => {
                    const [h, m] = endTime.split(':').map(Number);
                    const newH = (h - 1 + 24) % 24;
                    setEndTime(`${newH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
                  }}
                >
                  <Text style={styles.timeAdjustText}>−</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.timeAdjustButton}
                  onPress={() => {
                    const [h, m] = endTime.split(':').map(Number);
                    const newH = (h + 1) % 24;
                    setEndTime(`${newH.toString().padStart(2, '0')}:${m.toString().padStart(2, '0')}`);
                  }}
                >
                  <Text style={styles.timeAdjustText}>+</Text>
                </TouchableOpacity>
              </View>
            </View>
          </View>

          {/* Generate Until */}
          <View style={styles.section}>
            <Text style={styles.sectionLabel}>📆 Generate Until</Text>
            <TouchableOpacity
              style={styles.pickerButton}
              onPress={() => setShowGenerateUntilPicker(true)}
            >
              <Text style={styles.pickerButtonText}>
                {generateUntil.toLocaleDateString('en-US', {
                  month: 'long',
                  day: 'numeric',
                  year: 'numeric',
                })}
              </Text>
            </TouchableOpacity>

            {showGenerateUntilPicker && (
              <DateTimePicker
                value={generateUntil}
                mode="date"
                display="spinner"
                onChange={handleGenerateUntilChange}
                minimumDate={new Date(Date.now() + 24 * 60 * 60 * 1000)}
              />
            )}
          </View>

          {/* Summary */}
          <View style={styles.summary}>
            <Text style={styles.summaryLabel}>Summary</Text>
            <Text style={styles.summaryText}>
              Every {selectedDay.toLowerCase()} from {startTime} to {endTime}
            </Text>
            <Text style={styles.summarySubtext}>
              until {generateUntil.toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
            </Text>
          </View>

          {/* Info */}
          <View style={styles.infoBox}>
            <Text style={styles.infoText}>
              💡 Slots will be auto-generated in 1-hour blocks for each {selectedDay.toLowerCase()}.
            </Text>
          </View>
        </View>
      </ScrollView>
    </Modal>
  );
};

export default RecurringPatternModal;