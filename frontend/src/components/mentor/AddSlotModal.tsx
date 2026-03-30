import React, { useState } from 'react';
import {
  View, Text, Modal, TouchableOpacity, StyleSheet,
  Alert, ScrollView, KeyboardAvoidingView, Platform,
} from 'react-native';
import DateTimePicker from '@react-native-community/datetimepicker';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { Colors, FontSize, Spacing } from '../../utils/constants';

interface AddSlotModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (startTime: string, endTime: string) => Promise<void>;
}

const AddSlotModal = ({ visible, onClose, onAdd }: AddSlotModalProps) => {
  const insets = useSafeAreaInsets();
  const [startDate, setStartDate] = useState(new Date());
  const [startTime, setStartTime] = useState(new Date());
  const [endTime, setEndTime] = useState(new Date(Date.now() + 60 * 60 * 1000));
  const [showStartDatePicker, setShowStartDatePicker] = useState(false);
  const [showStartTimePicker, setShowStartTimePicker] = useState(false);
  const [showEndTimePicker, setShowEndTimePicker] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  const handleAdd = async () => {
    const start = new Date(
      startDate.getFullYear(), startDate.getMonth(), startDate.getDate(),
      startTime.getHours(), startTime.getMinutes()
    );
    const end = new Date(
      startDate.getFullYear(), startDate.getMonth(), startDate.getDate(),
      endTime.getHours(), endTime.getMinutes()
    );

    if (start >= end) { Alert.alert('Invalid time', 'End time must be after start time'); return; }
    if (start < new Date()) { Alert.alert('Invalid date', 'Cannot create slots in the past'); return; }

    setIsLoading(true);
    try { await onAdd(start.toISOString(), end.toISOString()); }
    finally { setIsLoading(false); }
  };

  const durationMins = Math.round((endTime.getTime() - startTime.getTime()) / 60000);
  const durationStr = durationMins > 0
    ? (durationMins >= 60 ? `${Math.floor(durationMins / 60)}h${durationMins % 60 > 0 ? ` ${durationMins % 60}m` : ''}` : `${durationMins}m`)
    : '—';

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet" onRequestClose={onClose}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Header */}
        <View style={[styles.header, { paddingTop: insets.top + Spacing.sm }]}>
          <TouchableOpacity onPress={onClose} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={styles.cancelBtn}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>Add slot</Text>
          <TouchableOpacity onPress={handleAdd} disabled={isLoading} hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}>
            <Text style={[styles.saveBtn, isLoading && styles.disabled]}>
              {isLoading ? 'Saving...' : 'Save'}
            </Text>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={[styles.content, { paddingBottom: insets.bottom + Spacing.xl }]} showsVerticalScrollIndicator={false}>

          {/* Date */}
          <View style={styles.section}>
            <View style={styles.labelRow}>
              <MaterialCommunityIcons name="calendar-outline" size={16} color={Colors.primary} />
              <Text style={styles.label}>Date</Text>
            </View>
            <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowStartDatePicker(true)} activeOpacity={0.8}>
              <Text style={styles.pickerText}>
                {startDate.toLocaleDateString('en-IE', { weekday: 'long', month: 'long', day: 'numeric' })}
              </Text>
              <MaterialCommunityIcons name="chevron-right" size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
            {showStartDatePicker && (
              <View style={styles.pickerWrap}>
                <DateTimePicker
                  value={startDate}
                  mode="date"
                  display="spinner"
                  onChange={(_, d) => { if (d) setStartDate(d); }}
                  minimumDate={new Date()}
                  style={styles.picker}
                  textColor={Colors.text}
                />
                <TouchableOpacity style={styles.pickerDone} onPress={() => setShowStartDatePicker(false)} activeOpacity={0.8}>
                  <Text style={styles.pickerDoneText}>Done</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Start time */}
          <View style={styles.section}>
            <View style={styles.labelRow}>
              <MaterialCommunityIcons name="clock-outline" size={16} color={Colors.primary} />
              <Text style={styles.label}>Start time</Text>
            </View>
            <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowStartTimePicker(true)} activeOpacity={0.8}>
              <Text style={styles.pickerText}>
                {startTime.toLocaleTimeString('en-IE', { hour: '2-digit', minute: '2-digit' })}
              </Text>
              <MaterialCommunityIcons name="chevron-right" size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
            {showStartTimePicker && (
              <View style={styles.pickerWrap}>
                <DateTimePicker
                  value={startTime}
                  mode="time"
                  display="spinner"
                  onChange={(_, t) => { if (t) setStartTime(t); }}
                  style={styles.picker}
                  textColor={Colors.text}
                />
                <TouchableOpacity style={styles.pickerDone} onPress={() => setShowStartTimePicker(false)} activeOpacity={0.8}>
                  <Text style={styles.pickerDoneText}>Done</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* End time */}
          <View style={styles.section}>
            <View style={styles.labelRow}>
              <MaterialCommunityIcons name="clock-check-outline" size={16} color={Colors.primary} />
              <Text style={styles.label}>End time</Text>
            </View>
            <TouchableOpacity style={styles.pickerBtn} onPress={() => setShowEndTimePicker(true)} activeOpacity={0.8}>
              <Text style={styles.pickerText}>
                {endTime.toLocaleTimeString('en-IE', { hour: '2-digit', minute: '2-digit' })}
              </Text>
              <MaterialCommunityIcons name="chevron-right" size={18} color={Colors.textSecondary} />
            </TouchableOpacity>
            {showEndTimePicker && (
              <View style={styles.pickerWrap}>
                <DateTimePicker
                  value={endTime}
                  mode="time"
                  display="spinner"
                  onChange={(_, t) => { if (t) setEndTime(t); }}
                  style={styles.picker}
                  textColor={Colors.text}
                />
                <TouchableOpacity style={styles.pickerDone} onPress={() => setShowEndTimePicker(false)} activeOpacity={0.8}>
                  <Text style={styles.pickerDoneText}>Done</Text>
                </TouchableOpacity>
              </View>
            )}
          </View>

          {/* Summary */}
          <View style={styles.summary}>
            <View style={styles.summaryRow}>
              <MaterialCommunityIcons name="calendar-clock" size={18} color={Colors.primary} />
              <Text style={styles.summaryTitle}>Summary</Text>
            </View>
            <Text style={styles.summaryDate}>
              {startDate.toLocaleDateString('en-IE', { weekday: 'short', month: 'short', day: 'numeric' })}
            </Text>
            <Text style={styles.summaryTime}>
              {startTime.toLocaleTimeString('en-IE', { hour: '2-digit', minute: '2-digit' })}
              {' – '}
              {endTime.toLocaleTimeString('en-IE', { hour: '2-digit', minute: '2-digit' })}
              {durationMins > 0 && <Text style={styles.summaryDuration}> · {durationStr}</Text>}
            </Text>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  cancelBtn: { fontSize: FontSize.md, fontWeight: '700', color: Colors.textSecondary },
  title: { fontSize: FontSize.lg, fontWeight: '900', color: Colors.text },
  saveBtn: { fontSize: FontSize.md, fontWeight: '900', color: Colors.primary },
  disabled: { opacity: 0.4 },
  content: { padding: Spacing.lg, gap: Spacing.md },
  section: { gap: Spacing.sm },
  labelRow: { flexDirection: 'row', alignItems: 'center', gap: 6 },
  label: { fontSize: FontSize.sm, fontWeight: '800', color: Colors.text },
  pickerBtn: {
    flexDirection: 'row', justifyContent: 'space-between', alignItems: 'center',
    backgroundColor: Colors.background, borderRadius: 12,
    borderWidth: 1, borderColor: Colors.border,
    paddingHorizontal: Spacing.md, paddingVertical: 14,
  },
  pickerText: { fontSize: FontSize.md, fontWeight: '600', color: Colors.text },
  summary: {
    backgroundColor: Colors.primaryLight, borderRadius: 14,
    padding: Spacing.md, gap: 4, marginTop: Spacing.sm,
    borderWidth: 1, borderColor: Colors.primary + '30',
  },
  summaryRow: { flexDirection: 'row', alignItems: 'center', gap: 6, marginBottom: 4 },
  summaryTitle: { fontSize: FontSize.sm, fontWeight: '800', color: Colors.primary },
  summaryDate: { fontSize: FontSize.md, fontWeight: '900', color: Colors.text },
  summaryTime: { fontSize: FontSize.md, fontWeight: '700', color: Colors.text },
  summaryDuration: { fontSize: FontSize.sm, color: Colors.textSecondary, fontWeight: '600' },
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

export default AddSlotModal;