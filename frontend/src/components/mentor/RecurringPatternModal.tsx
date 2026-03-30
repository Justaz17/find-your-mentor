import React, { useState } from 'react';
import {
  View, Text, Modal, TouchableOpacity, StyleSheet,
  Alert, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, FontSize, Spacing } from '../../utils/constants';

interface RecurringPatternModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (day: string, startTime: string, endTime: string, generateUntil: string) => Promise<void>;
}

const DAYS = [
  { key: 'MONDAY', label: 'Mon', icon: 'alpha-m-circle-outline', color: '#6C3AED' },
  { key: 'TUESDAY', label: 'Tue', icon: 'alpha-t-circle-outline', color: '#3B82F6' },
  { key: 'WEDNESDAY', label: 'Wed', icon: 'alpha-w-circle-outline', color: '#10B981' },
  { key: 'THURSDAY', label: 'Thu', icon: 'alpha-t-circle-outline', color: '#F59E0B' },
  { key: 'FRIDAY', label: 'Fri', icon: 'alpha-f-circle-outline', color: '#EF4444' },
  { key: 'SATURDAY', label: 'Sat', icon: 'alpha-s-circle-outline', color: '#EC4899' },
  { key: 'SUNDAY', label: 'Sun', icon: 'alpha-s-circle-outline', color: '#8B5CF6' },
];

const RecurringPatternModal = ({ visible, onClose, onAdd }: RecurringPatternModalProps) => {
  const insets = useSafeAreaInsets();
  const [selectedDay, setSelectedDay] = useState('MONDAY');
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [generateUntil, setGenerateUntil] = useState(new Date(Date.now() + 90 * 24 * 60 * 60 * 1000));
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const adjustHour = (time: string, delta: number) => {
    const [h, m] = time.split(':').map(Number);
    const newH = ((h + delta) + 24) % 24;
    return `${String(newH).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
  };

  const adjustMinute = (time: string, delta: number) => {
    const [h, m] = time.split(':').map(Number);
    const totalMins = h * 60 + m + delta;
    const newH = Math.floor(((totalMins % 1440) + 1440) % 1440 / 60);
    const newM = ((totalMins % 60) + 60) % 60;
    return `${String(newH).padStart(2, '0')}:${String(newM).padStart(2, '0')}`;
  };

  const handleAdd = async () => {
    const [sh, sm] = startTime.split(':').map(Number);
    const [eh, em] = endTime.split(':').map(Number);
    if (sh * 60 + sm >= eh * 60 + em) {
      Alert.alert('Invalid time', 'End time must be after start time');
      return;
    }
    if (generateUntil <= new Date()) {
      Alert.alert('Invalid date', 'Generate until must be in the future');
      return;
    }
    setIsLoading(true);
    try {
      await onAdd(selectedDay, startTime, endTime, generateUntil.toISOString().split('T')[0]);
    } finally {
      setIsLoading(false); }
  };

  const selectedDayData = DAYS.find(d => d.key === selectedDay)!;

  const TimeControl = ({ label, time, onChange }: { label: string; time: string; onChange: (t: string) => void }) => (
    <View style={styles.timeControl}>
      <Text style={styles.timeControlLabel}>{label}</Text>
      <View style={styles.timeRow}>
        <View style={styles.timeUnit}>
          <TouchableOpacity style={styles.timeBtn} onPress={() => onChange(adjustHour(time, 1))} activeOpacity={0.7}>
            <MaterialCommunityIcons name="chevron-up" size={20} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={styles.timeValue}>{time.split(':')[0]}</Text>
          <TouchableOpacity style={styles.timeBtn} onPress={() => onChange(adjustHour(time, -1))} activeOpacity={0.7}>
            <MaterialCommunityIcons name="chevron-down" size={20} color={Colors.primary} />
          </TouchableOpacity>
        </View>
        <Text style={styles.timeSep}>:</Text>
        <View style={styles.timeUnit}>
          <TouchableOpacity style={styles.timeBtn} onPress={() => onChange(adjustMinute(time, 15))} activeOpacity={0.7}>
            <MaterialCommunityIcons name="chevron-up" size={20} color={Colors.primary} />
          </TouchableOpacity>
          <Text style={styles.timeValue}>{time.split(':')[1]}</Text>
          <TouchableOpacity style={styles.timeBtn} onPress={() => onChange(adjustMinute(time, -15))} activeOpacity={0.7}>
            <MaterialCommunityIcons name="chevron-down" size={20} color={Colors.primary} />
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : 'height'}>
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.cancelBtn}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Recurring pattern</Text>
          <TouchableOpacity onPress={handleAdd} disabled={isLoading} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={[styles.saveBtn, isLoading && styles.disabled]}>
              {isLoading ? 'Creating...' : 'Create'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.xl }]} showsVerticalScrollIndicator={false}>

          {/* Day selector */}
          <View style={styles.section}>
            <View style={styles.labelRow}>
              <MaterialCommunityIcons name="calendar-week-outline" size={16} color={Colors.primary} />
              <Text style={styles.label}>Day of the week</Text>
            </View>
            <View style={styles.dayGrid}>
              {DAYS.map(day => {
                const active = selectedDay === day.key;
                return (
                  <TouchableOpacity
                    key={day.key}
                    style={[styles.dayBtn, active && { borderColor: day.color, backgroundColor: day.color + '18' }]}
                    onPress={() => setSelectedDay(day.key)}
                    activeOpacity={0.8}
                  >
                    <MaterialCommunityIcons
                      name={day.icon as any}
                      size={20}
                      color={active ? day.color : Colors.textSecondary}
                    />
                    <Text style={[styles.dayBtnText, active && { color: day.color, fontWeight: '900' }]}>
                      {day.label}
                    </Text>
                  </TouchableOpacity>
                );
              })}
            </View>
          </View>

          {/* Time controls */}
          <View style={styles.section}>
            <View style={styles.labelRow}>
              <MaterialCommunityIcons name="clock-outline" size={16} color={Colors.primary} />
              <Text style={styles.label}>Time window</Text>
            </View>
            <View style={styles.timeControls}>
              <TimeControl label="Start" time={startTime} onChange={setStartTime} />
              <MaterialCommunityIcons name="arrow-right" size={20} color={Colors.textSecondary} style={{ marginTop: 24 }} />
              <TimeControl label="End" time={endTime} onChange={setEndTime} />
            </View>
          </View>

          {/* Generate until */}
          <View style={styles.section}>
            <View style={styles.labelRow}>
              <MaterialCommunityIcons name="calendar-end" size={16} color={Colors.primary} />
              <Text style={styles.label}>Generate until</Text>
            </View>
            <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowDatePicker(true)} activeOpacity={0.8}>
              <Text style={styles.pickerText}>
                {generateUntil.toLocaleDateString('en-IE', { day: 'numeric', month: 'long', year: 'numeric' })}
              </Text>
              <MaterialCommunityIcons name="chevron-right" size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
            {showDatePicker && (
              <View style={styles.pickerWrap}>
                <DateTimePicker
                  value={generateUntil}
                  mode="date"
                  display="spinner"
                  onChange={(_, d) => { if (d) setGenerateUntil(d); }}
                  minimumDate={new Date(Date.now() + 24 * 60 * 60 * 1000)}
                  style={styles.picker}
                  textColor={Colors.text}
                />
                <TouchableOpacity style={styles.pickerDone} onPress={() => setShowDatePicker(false)} activeOpacity={0.8}>
                  <Text style={styles.pickerDoneText}>Done</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Summary */}
          <View style={styles.summary}>
            <View style={styles.summaryRow}>
              <MaterialCommunityIcons name="repeat" size={16} color={Colors.primary} />
              <Text style={styles.summaryTitle}>Summary</Text>
            </View>
            <Text style={styles.summaryText}>
              Every{' '}
              <Text style={{ color: selectedDayData.color, fontWeight: '900' }}>
                {selectedDay.charAt(0) + selectedDay.slice(1).toLowerCase()}
              </Text>
              {' '}from {startTime} to {endTime}
            </Text>
            <Text style={styles.summarySub}>
              until {generateUntil.toLocaleDateString('en-IE', { month: 'short', day: 'numeric', year: 'numeric' })}
            </Text>
          </View>

          {/* Info */}
          <View style={styles.infoBox}>
            <MaterialCommunityIcons name="information-outline" size={15} color={Colors.primary} />
            <Text style={styles.infoText}>
              Slots will be auto-generated in 1-hour blocks for each {selectedDay.charAt(0) + selectedDay.slice(1).toLowerCase()}.
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    paddingHorizontal: Spacing.lg, paddingBottom: Spacing.md,
    backgroundColor: Colors.background,
    borderBottomWidth: 1, borderBottomColor: Colors.border,
  },
  cancelBtn: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textSecondary },
  title: { fontSize: FontSize.lg, fontWeight: '900', color: Colors.text },
  saveBtn: { fontSize: FontSize.md, fontWeight: '900', color: Colors.primary },
  disabled: { opacity: 0.4 },
  content: { padding: Spacing.lg, gap: Spacing.lg },
  section: { gap: Spacing.sm },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  label: { fontSize: FontSize.sm, fontWeight: '800', color: Colors.text },
  dayGrid: { flexDirection: 'row', flexWrap: 'wrap', gap: 8 },
  dayBtn: {
    flexDirection: 'row', alignItems: 'center', gap: 5,
    paddingHorizontal: 12, paddingVertical: 8,
    borderRadius: 10, borderWidth: 1.5, borderColor: Colors.border,
    backgroundColor: Colors.background,
  },
  dayBtnText: { fontSize: FontSize.sm, fontWeight: '700', color: Colors.textSecondary },
  timeControls: { flexDirection: 'row', alignItems: 'flex-start', gap: Spacing.md },
  timeControl: { flex: 1, alignItems: 'center', gap: 4 },
  timeControlLabel: { fontSize: FontSize.xs, fontWeight: '700', color: Colors.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 },
  timeRow: { flexDirection: 'row', alignItems: 'center', gap: 4 },
  timeUnit: { alignItems: 'center', gap: 2 },
  timeBtn: {
    width: 36, height: 32, borderRadius: 8,
    backgroundColor: Colors.primaryLight,
    justifyContent: 'center', alignItems: 'center',
  },
  timeValue: { fontSize: FontSize.xl, fontWeight: '900', color: Colors.text, minWidth: 36, textAlign: 'center' },
  timeSep: { fontSize: FontSize.xl, fontWeight: '900', color: Colors.text, marginTop: 32 },
  pickerBtn: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Colors.background, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.md, paddingVertical: 14,
  },
  pickerText: { fontSize: FontSize.md, fontWeight: '600', color: Colors.text },
  summary: {
    backgroundColor: Colors.primaryLight, borderRadius: 14,
    padding: Spacing.md, gap: 4,
    borderWidth: 1, borderColor: Colors.primary + '30',
  },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 2 },
  summaryTitle: { fontSize: FontSize.sm, fontWeight: '800', color: Colors.primary },
  summaryText: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text },
  summarySub: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '600' },
  infoBox: {
    flexDirection: 'row', alignItems: 'flex-start', gap: 8,
    backgroundColor: Colors.surface, borderRadius: 12,
    padding: Spacing.md, borderWidth: 1, borderColor: Colors.border,
  },
  infoText: { flex: 1, fontSize: FontSize.xs, color: Colors.text, fontWeight: '600', lineHeight: 18 },
  pickerWrap: {
    backgroundColor: Colors.surface,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    overflow: 'hidden',
    marginTop: 4,
  },
  picker: {
    height: 180,
    backgroundColor: Colors.surface,
  },
  pickerDone: {
    backgroundColor: Colors.primary,
    paddingVertical: 12,
    alignItems: 'center',
  },
  pickerDoneText: {
    color: '#fff',
    fontWeight: '900',
    fontSize: FontSize.md,
  },
});

export default RecurringPatternModal;