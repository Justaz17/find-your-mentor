import React, { useState } from 'react';
import {
  View, Text, Modal, TouchableOpacity,
  ScrollView, ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colours, FontSize, Spacing } from '../../utils/constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';

interface RecurringPatternModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (day: string, startTime: string, endTime: string, generateUntil: string) => Promise<void>;
}

const DAYS = ['MONDAY', 'TUESDAY', 'WEDNESDAY', 'THURSDAY', 'FRIDAY', 'SATURDAY', 'SUNDAY'];
const DAY_SHORT: Record<string, string> = {
  MONDAY: 'Mon', TUESDAY: 'Tue', WEDNESDAY: 'Wed',
  THURSDAY: 'Thu', FRIDAY: 'Fri', SATURDAY: 'Sat', SUNDAY: 'Sun',
};
const MIN_DURATION_MINUTES = 30;
const MAX_DURATION_MINUTES = 720;

const defaultStart = () => { const d = new Date(); d.setHours(9, 0, 0, 0); return d; };
const defaultEnd = () => { const d = new Date(); d.setHours(10, 0, 0, 0); return d; };

const RecurringPatternModal = ({ visible, onClose, onAdd }: RecurringPatternModalProps) => {
  const insets = useSafeAreaInsets();

  const [step, setStep] = useState<'day' | 'start' | 'end' | 'until' | 'summary'>('day');
  const [selectedDay, setSelectedDay] = useState('MONDAY');
  const [startTime, setStartTime] = useState(defaultStart());
  const [endTime, setEndTime] = useState(defaultEnd());
  const [generateUntil, setGenerateUntil] = useState(
    new Date(Date.now() + 90 * 24 * 60 * 60 * 1000)
  );
  const [isLoading, setIsLoading] = useState(false);
  const [cameFromFreeAllDay, setCameFromFreeAllDay] = useState(false);

  const durationMinutes = Math.round((endTime.getTime() - startTime.getTime()) / 60000);
  const durationValid = durationMinutes >= MIN_DURATION_MINUTES && durationMinutes <= MAX_DURATION_MINUTES;

  const formatDuration = (mins: number) => {
    if (mins < 60) return `${mins} min`;
    const h = Math.floor(mins / 60);
    const m = mins % 60;
    return m > 0 ? `${h}h ${m}min` : `${h}h`;
  };

  const durationError = durationMinutes < MIN_DURATION_MINUTES
    ? `Minimum ${MIN_DURATION_MINUTES} min required`
    : durationMinutes > MAX_DURATION_MINUTES
      ? 'Maximum 12 hours'
      : null;

  const handleFreeAllDay = () => {
    const start = new Date(); start.setHours(8, 0, 0, 0);
    const end = new Date(); end.setHours(20, 0, 0, 0);
    setStartTime(start);
    setEndTime(end);
    setCameFromFreeAllDay(true);
    setStep('until');
  };

  const handleBack = () => {
    if (step === 'day') onClose();
    else if (step === 'start') setStep('day');
    else if (step === 'end') setStep('start');
    else if (step === 'until') setStep(cameFromFreeAllDay ? 'start' : 'end');
    else if (step === 'summary') setStep('until');
  };

  const handleAdd = async () => {
    if (!durationValid) return;
    try {
      setIsLoading(true);
      const startStr = `${startTime.getHours().toString().padStart(2, '0')}:${startTime.getMinutes().toString().padStart(2, '0')}`;
      const endStr = `${endTime.getHours().toString().padStart(2, '0')}:${endTime.getMinutes().toString().padStart(2, '0')}`;
      const untilStr = generateUntil.toISOString().split('T')[0];
      await onAdd(selectedDay, startStr, endStr, untilStr);
      // Reset
      setStep('day');
      setSelectedDay('MONDAY');
      setStartTime(defaultStart());
      setEndTime(defaultEnd());
      setCameFromFreeAllDay(false);
    } finally {
      setIsLoading(false);
    }
  };

  const stepTitle = {
    day: 'Which day repeats?',
    start: 'What time does it start?',
    end: 'What time does it end?',
    until: 'Generate slots until?',
    summary: 'Review your pattern',
  }[step];

  const stepSubtitle = {
    day: 'Pick the day of the week for this recurring slot',
    start: selectedDay.charAt(0) + selectedDay.slice(1).toLowerCase() + 's',
    end: `${selectedDay.charAt(0) + selectedDay.slice(1).toLowerCase()}s, from ${startTime.toLocaleTimeString('en-IE', { hour: '2-digit', minute: '2-digit' })}`,
    until: '',
    summary: '',
  }[step];

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View style={{ flex: 1, backgroundColor: Colours.background }}>

        {/* Header */}
        <View style={{
          paddingTop: insets.top + Spacing.md,
          paddingHorizontal: Spacing.lg,
          paddingBottom: Spacing.md,
          borderBottomWidth: 1, borderBottomColor: Colours.border,
          flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
        }}>
          <TouchableOpacity onPress={handleBack} activeOpacity={0.7}>
            <MaterialCommunityIcons
              name={step === 'day' ? 'close' : 'arrow-left'}
              size={24} color={Colours.text}
            />
          </TouchableOpacity>
          <View style={{ flex: 1 }}>
            <Text style={{ fontSize: FontSize.md, fontWeight: '900', color: Colours.text }}>
              {stepTitle}
            </Text>
            {stepSubtitle ? (
              <Text style={{ fontSize: FontSize.xs, color: Colours.textSecondary, fontWeight: '600', marginTop: 1 }}>
                {stepSubtitle}
              </Text>
            ) : null}
          </View>

          {/* Step dots */}
          <View style={{ flexDirection: 'row', gap: 4 }}>
            {(['day', 'start', 'end', 'until', 'summary'] as const).map(s => (
              <View key={s} style={{
                width: 6, height: 6, borderRadius: 3,
                backgroundColor: s === step ? Colours.primary : Colours.border,
              }} />
            ))}
          </View>
        </View>

        <ScrollView
          contentContainerStyle={{ padding: Spacing.lg, gap: Spacing.lg, paddingBottom: insets.bottom + 40 }}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >

          {/* ── STEP: DAY ── */}
          {step === 'day' && (
            <>
              <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
                {DAYS.map(day => (
                  <TouchableOpacity
                    key={day}
                    style={{
                      flex: 1, minWidth: '13%', paddingVertical: 12,
                      borderRadius: 12, alignItems: 'center',
                      backgroundColor: selectedDay === day ? Colours.primary : Colours.surface,
                      borderWidth: 1,
                      borderColor: selectedDay === day ? Colours.primary : Colours.border,
                    }}
                    onPress={() => setSelectedDay(day)}
                    activeOpacity={0.85}
                  >
                    <Text style={{
                      fontSize: FontSize.sm, fontWeight: '800',
                      color: selectedDay === day ? '#fff' : Colours.textSecondary,
                    }}>
                      {DAY_SHORT[day]}
                    </Text>
                  </TouchableOpacity>
                ))}
              </View>

              <TouchableOpacity
                style={{
                  backgroundColor: Colours.primary, borderRadius: 14,
                  paddingVertical: 16, flexDirection: 'row',
                  justifyContent: 'center', alignItems: 'center', gap: 8,
                }}
                onPress={() => {
                  const newStart = new Date();
                  newStart.setHours(9, 0, 0, 0);
                  const newEnd = new Date();
                  newEnd.setHours(9, 30, 0, 0);
                  setStartTime(newStart);
                  setEndTime(newEnd);
                  setStep('start');
                }}
                activeOpacity={0.88}
              >
                <Text style={{ color: '#fff', fontSize: FontSize.sm, fontWeight: '800' }}>
                  Next — Set start time
                </Text>
                <MaterialCommunityIcons name="arrow-right" size={20} color="#fff" />
              </TouchableOpacity>
            </>
          )}

          {/* ── STEP: START TIME ── */}
          {step === 'start' && (
            <>
              <TouchableOpacity
                style={{
                  backgroundColor: Colours.primaryLight, borderRadius: 14,
                  padding: Spacing.md, borderWidth: 1, borderColor: Colours.primary + '30',
                  flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
                }}
                onPress={handleFreeAllDay}
                activeOpacity={0.85}
              >
                <MaterialCommunityIcons name="weather-sunny" size={20} color={Colours.primary} />
                <View style={{ flex: 1 }}>
                  <Text style={{ fontSize: FontSize.sm, fontWeight: '800', color: Colours.primary }}>
                    Free all day
                  </Text>
                  <Text style={{ fontSize: FontSize.xs, color: Colours.textSecondary, fontWeight: '600' }}>
                    Sets 8:00 AM — 8:00 PM automatically
                  </Text>
                </View>
                <MaterialCommunityIcons name="chevron-right" size={18} color={Colours.primary} />
              </TouchableOpacity>

              <View style={{ alignItems: 'center' }}>
                <Text style={{ fontSize: FontSize.xs, color: Colours.textSecondary, fontWeight: '700', textTransform: 'uppercase', letterSpacing: 0.5 }}>
                  Or pick a start time
                </Text>
              </View>

              <View style={{ backgroundColor: '#ffffff', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: Colours.border }}>
                <DateTimePicker
                  value={startTime}
                  mode="time"
                  display="spinner"
                  onChange={(_, t) => { if (t) setStartTime(t); }}
                  style={{ backgroundColor: '#ffffff', height: 180 }}
                  textColor="#000000"
                  themeVariant="light"
                />
              </View>

              <View style={{
                backgroundColor: Colours.surface, borderRadius: 14,
                padding: Spacing.md, borderWidth: 1, borderColor: Colours.border,
                flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
              }}>
                <MaterialCommunityIcons name="clock-outline" size={18} color={Colours.primary} />
                <Text style={{ fontSize: FontSize.md, fontWeight: '800', color: Colours.text }}>
                  Starts at {startTime.toLocaleTimeString('en-IE', { hour: '2-digit', minute: '2-digit' })}
                </Text>
              </View>

              <TouchableOpacity
                style={{
                  backgroundColor: Colours.primary, borderRadius: 14,
                  paddingVertical: 16, flexDirection: 'row',
                  justifyContent: 'center', alignItems: 'center', gap: 8,
                }}
                onPress={() => {
                  const minEnd = new Date(startTime.getTime() + MIN_DURATION_MINUTES * 60000);
                  setEndTime(minEnd);
                  setStep('end');
                }}
                activeOpacity={0.88}
              >
                <Text style={{ color: '#fff', fontSize: FontSize.sm, fontWeight: '800' }}>
                  Next — Set end time
                </Text>
                <MaterialCommunityIcons name="arrow-right" size={20} color="#fff" />
              </TouchableOpacity>
            </>
          )}

          {/* ── STEP: END TIME ── */}
          {step === 'end' && (
            <>
              <View style={{ backgroundColor: '#ffffff', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: Colours.border }}>
                <DateTimePicker
                  value={endTime}
                  mode="time"
                  display="spinner"
                  onChange={(_, t) => {
                    if (t) {
                      const minEnd = new Date(startTime.getTime() + MIN_DURATION_MINUTES * 60000);
                      setEndTime(t < minEnd ? minEnd : t);
                    }
                  }}
                  style={{ backgroundColor: '#ffffff', height: 180 }}
                  textColor="#000000"
                  themeVariant="light"
                />
              </View>

              <View style={{
                backgroundColor: durationValid ? Colours.primaryLight : Colours.error + '15',
                borderRadius: 12, padding: Spacing.md,
                borderWidth: 1, borderColor: durationValid ? Colours.primary + '30' : Colours.error + '30',
                flexDirection: 'row', alignItems: 'center', gap: 8,
              }}>
                <MaterialCommunityIcons
                  name={durationValid ? 'clock-check-outline' : 'clock-alert-outline'}
                  size={18}
                  color={durationValid ? Colours.primary : Colours.error}
                />
                <Text style={{
                  fontSize: FontSize.sm, fontWeight: '800',
                  color: durationValid ? Colours.primary : Colours.error,
                }}>
                  {durationError ?? `${formatDuration(durationMinutes)} slot`}
                </Text>
              </View>

              <TouchableOpacity
                style={{
                  backgroundColor: durationValid ? Colours.primary : Colours.border,
                  borderRadius: 14, paddingVertical: 16,
                  flexDirection: 'row', justifyContent: 'center', alignItems: 'center', gap: 8,
                }}
                onPress={() => { if (durationValid) setStep('until'); }}
                disabled={!durationValid}
                activeOpacity={0.88}
              >
                <Text style={{ color: '#fff', fontSize: FontSize.sm, fontWeight: '800' }}>
                  Next — Set end date
                </Text>
                <MaterialCommunityIcons name="arrow-right" size={20} color="#fff" />
              </TouchableOpacity>
            </>
          )}

          {/* ── STEP: UNTIL ── */}
          {step === 'until' && (
            <>
              <Text style={{
                fontSize: FontSize.sm, color: Colours.textSecondary,
                fontWeight: '600', lineHeight: 20,
              }}>
                Slots will be auto-generated every {selectedDay.charAt(0) + selectedDay.slice(1).toLowerCase()} until this date.
              </Text>

              <View style={{ backgroundColor: '#ffffff', borderRadius: 12, overflow: 'hidden', borderWidth: 1, borderColor: Colours.border }}>
                <DateTimePicker
                  value={generateUntil}
                  mode="date"
                  display="spinner"
                  onChange={(_, d) => { if (d) setGenerateUntil(d); }}
                  minimumDate={new Date(Date.now() + 24 * 60 * 60 * 1000)}
                  maximumDate={new Date(new Date().getFullYear(), new Date().getMonth() + 6, new Date().getDate())}
                  style={{ backgroundColor: '#ffffff', height: 180 }}
                  textColor="#000000"
                  themeVariant="light"
                />
              </View>

              <View style={{
                backgroundColor: Colours.surface, borderRadius: 14,
                padding: Spacing.md, borderWidth: 1, borderColor: Colours.border,
                flexDirection: 'row', alignItems: 'center', gap: Spacing.sm,
              }}>
                <MaterialCommunityIcons name="calendar-end" size={18} color={Colours.primary} />
                <Text style={{ fontSize: FontSize.md, fontWeight: '800', color: Colours.text }}>
                  Until {generateUntil.toLocaleDateString('en-IE', { weekday: 'short', month: 'long', day: 'numeric', year: 'numeric' })}
                </Text>
              </View>

              <TouchableOpacity
                style={{
                  backgroundColor: Colours.primary, borderRadius: 14,
                  paddingVertical: 16, flexDirection: 'row',
                  justifyContent: 'center', alignItems: 'center', gap: 8,
                }}
                onPress={() => setStep('summary')}
                activeOpacity={0.88}
              >
                <Text style={{ color: '#fff', fontSize: FontSize.sm, fontWeight: '800' }}>
                  Review pattern
                </Text>
                <MaterialCommunityIcons name="check" size={20} color="#fff" />
              </TouchableOpacity>
            </>
          )}

          {/* ── STEP: SUMMARY ── */}
          {step === 'summary' && (
            <>
              <View style={{
                backgroundColor: Colours.surface, borderRadius: 16,
                borderWidth: 1, borderColor: Colours.border, overflow: 'hidden',
              }}>
                {/* Day row */}
                <View style={{
                  flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
                  padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colours.border,
                }}>
                  <View style={{
                    width: 40, height: 40, borderRadius: 20,
                    backgroundColor: Colours.primaryLight,
                    justifyContent: 'center', alignItems: 'center',
                  }}>
                    <MaterialCommunityIcons name="calendar-repeat" size={20} color={Colours.primary} />
                  </View>
                  <View>
                    <Text style={{ fontSize: FontSize.xs, fontWeight: '700', color: Colours.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Repeats
                    </Text>
                    <Text style={{ fontSize: FontSize.md, fontWeight: '800', color: Colours.text }}>
                      Every {selectedDay.charAt(0) + selectedDay.slice(1).toLowerCase()}
                    </Text>
                  </View>
                </View>

                {/* Time row */}
                <View style={{
                  flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
                  padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colours.border,
                }}>
                  <View style={{
                    width: 40, height: 40, borderRadius: 20,
                    backgroundColor: Colours.primaryLight,
                    justifyContent: 'center', alignItems: 'center',
                  }}>
                    <MaterialCommunityIcons name="clock-outline" size={20} color={Colours.primary} />
                  </View>
                  <View>
                    <Text style={{ fontSize: FontSize.xs, fontWeight: '700', color: Colours.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Time
                    </Text>
                    <Text style={{ fontSize: FontSize.md, fontWeight: '800', color: Colours.text }}>
                      {startTime.toLocaleTimeString('en-IE', { hour: '2-digit', minute: '2-digit' })}
                      {' — '}
                      {endTime.toLocaleTimeString('en-IE', { hour: '2-digit', minute: '2-digit' })}
                      {' · '}
                      {formatDuration(durationMinutes)}
                    </Text>
                  </View>
                </View>

                {/* Until row */}
                <View style={{
                  flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
                  padding: Spacing.md,
                }}>
                  <View style={{
                    width: 40, height: 40, borderRadius: 20,
                    backgroundColor: Colours.primaryLight,
                    justifyContent: 'center', alignItems: 'center',
                  }}>
                    <MaterialCommunityIcons name="calendar-end" size={20} color={Colours.primary} />
                  </View>
                  <View>
                    <Text style={{ fontSize: FontSize.xs, fontWeight: '700', color: Colours.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Until
                    </Text>
                    <Text style={{ fontSize: FontSize.md, fontWeight: '800', color: Colours.text }}>
                      {generateUntil.toLocaleDateString('en-IE', { month: 'long', day: 'numeric', year: 'numeric' })}
                    </Text>
                  </View>
                </View>
              </View>

              {/* Info */}
              <View style={{
                flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start',
                backgroundColor: Colours.surface, borderRadius: 12,
                padding: Spacing.md, borderWidth: 1, borderColor: Colours.border,
              }}>
                <MaterialCommunityIcons name="information-outline" size={16} color={Colours.textSecondary} />
                <Text style={{ flex: 1, fontSize: FontSize.xs, color: Colours.textSecondary, fontWeight: '600', lineHeight: 18 }}>
                  1-hour slots will be auto-generated every {selectedDay.charAt(0) + selectedDay.slice(1).toLowerCase()} within your time window. Learners book individual slots and you approve each one.
                </Text>
              </View>

              <TouchableOpacity
                style={{
                  backgroundColor: Colours.primary, borderRadius: 14,
                  paddingVertical: 16, flexDirection: 'row',
                  justifyContent: 'center', alignItems: 'center', gap: 8,
                }}
                onPress={handleAdd}
                disabled={isLoading}
                activeOpacity={0.88}
              >
                {isLoading ? (
                  <ActivityIndicator color="#fff" />
                ) : (
                  <>
                    <MaterialCommunityIcons name="check-circle-outline" size={20} color="#fff" />
                    <Text style={{ color: '#fff', fontSize: FontSize.sm, fontWeight: '800' }}>
                      Confirm pattern
                    </Text>
                  </>
                )}
              </TouchableOpacity>
            </>
          )}
        </ScrollView>
      </View>
    </Modal>
  );
};

export default RecurringPatternModal;