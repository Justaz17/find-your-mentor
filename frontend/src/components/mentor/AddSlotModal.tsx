import React, { useState, useMemo } from 'react';
import {
  View, Text, Modal, TouchableOpacity,
  Alert, ScrollView, ActivityIndicator,
} from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colours, FontSize, Spacing } from '../../utils/constants';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import DateTimePicker from '@react-native-community/datetimepicker';

interface AddSlotModalProps {
  visible: boolean;
  onClose: () => void;
  onAdd: (startTime: string, endTime: string) => Promise<void>;
}

const DAYS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
const MONTHS = ['January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'];
const MIN_DURATION_MINUTES = 30;
const MAX_DURATION_MINUTES = 720;

const defaultStart = () => { const d = new Date(); d.setHours(9, 0, 0, 0); return d; };
const defaultEnd = () => { const d = new Date(); d.setHours(10, 0, 0, 0); return d; };

const AddSlotModal = ({ visible, onClose, onAdd }: AddSlotModalProps) => {
  const insets = useSafeAreaInsets();
  const today = new Date();
  today.setHours(0, 0, 0, 0);
  const maxDate = new Date(today.getFullYear(), today.getMonth() + 3, today.getDate());

  const [step, setStep] = useState<'date' | 'start' | 'end' | 'summary'>('date');
  const [selectedDate, setSelectedDate] = useState<Date | null>(null);
  const [calendarMonth, setCalendarMonth] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [startTime, setStartTime] = useState(defaultStart());
  const [endTime, setEndTime] = useState(defaultEnd());
  const [isLoading, setIsLoading] = useState(false);
  const [cameFromFreeAllDay, setCameFromFreeAllDay] = useState(false);

  const calendarDays = useMemo(() => {
    const year = calendarMonth.getFullYear();
    const month = calendarMonth.getMonth();
    const firstDay = new Date(year, month, 1).getDay();
    const daysInMonth = new Date(year, month + 1, 0).getDate();
    const days: (Date | null)[] = [];
    for (let i = 0; i < firstDay; i++) days.push(null);
    for (let d = 1; d <= daysInMonth; d++) days.push(new Date(year, month, d));
    return days;
  }, [calendarMonth]);

  const prevMonth = () => {
    const prev = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() - 1, 1);
    if (prev >= new Date(today.getFullYear(), today.getMonth(), 1)) setCalendarMonth(prev);
  };

  const nextMonth = () => {
    const next = new Date(calendarMonth.getFullYear(), calendarMonth.getMonth() + 1, 1);
    if (next <= new Date(maxDate.getFullYear(), maxDate.getMonth(), 1)) setCalendarMonth(next);
  };

  const isPast = (d: Date) => d < today;
  const isBeyondMax = (d: Date) => d > maxDate;
  const isSelected = (d: Date) => selectedDate?.toDateString() === d.toDateString();
  const isToday = (d: Date) => d.toDateString() === today.toDateString();

  const durationMinutes = useMemo(() => {
    return Math.round((endTime.getTime() - startTime.getTime()) / 60000);
  }, [startTime, endTime]);

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
      ? 'Maximum slot is 12 hours'
      : null;

  const handleAdd = async () => {
    if (!selectedDate || !durationValid) return;
    const startDateTime = new Date(
      selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(),
      startTime.getHours(), startTime.getMinutes()
    );
    const endDateTime = new Date(
      selectedDate.getFullYear(), selectedDate.getMonth(), selectedDate.getDate(),
      endTime.getHours(), endTime.getMinutes()
    );
    if (startDateTime < new Date()) {
      Alert.alert('Invalid', 'Cannot create slots in the past');
      return;
    }
    try {
      setIsLoading(true);
      await onAdd(startDateTime.toISOString(), endDateTime.toISOString());
      setStep('date');
      setSelectedDate(null);
      setStartTime(defaultStart());
      setEndTime(defaultEnd());
    } finally {
      setIsLoading(false);
    }
  };

  const handleFreeAllDay = () => {
    const start = new Date(); start.setHours(8, 0, 0, 0);
    const end = new Date(); end.setHours(20, 0, 0, 0);
    setStartTime(start);
    setEndTime(end);
    setCameFromFreeAllDay(true);
    setStep('summary');
  };

  const handleBack = () => {
    if (step === 'date') onClose();
    else if (step === 'start') setStep('date');
    else if (step === 'end') setStep('start');
    else if (step === 'summary') {
      setCameFromFreeAllDay(false);
      setStep(cameFromFreeAllDay ? 'start' : 'end');
    }
  };

  const stepTitle = {
    date: 'Pick a day',
    start: 'What time does your slot start?',
    end: 'What time does your slot end?',
    summary: 'Review your slot',
  }[step];

  const stepSubtitle = {
    date: 'Select the day you want to be available',
    start: selectedDate?.toLocaleDateString('en-IE', { weekday: 'long', month: 'long', day: 'numeric' }) ?? '',
    end: selectedDate
      ? `${selectedDate.toLocaleDateString('en-IE', { weekday: 'long', month: 'long', day: 'numeric' })}, from ${startTime.toLocaleTimeString('en-IE', { hour: '2-digit', minute: '2-digit' })}`
      : '',
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
              name={step === 'date' ? 'close' : 'arrow-left'}
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
          <View style={{ flexDirection: 'row', gap: 4 }}>
            {(['date', 'start', 'end', 'summary'] as const).map(s => (
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
          {/* ── STEP: DATE ── */}
          {step === 'date' && (
            <>
              <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
                <TouchableOpacity onPress={prevMonth} activeOpacity={0.7} style={{ padding: 8 }}>
                  <MaterialCommunityIcons name="chevron-left" size={24} color={Colours.text} />
                </TouchableOpacity>
                <Text style={{ fontSize: FontSize.md, fontWeight: '900', color: Colours.text }}>
                  {MONTHS[calendarMonth.getMonth()]} {calendarMonth.getFullYear()}
                </Text>
                <TouchableOpacity onPress={nextMonth} activeOpacity={0.7} style={{ padding: 8 }}>
                  <MaterialCommunityIcons name="chevron-right" size={24} color={Colours.text} />
                </TouchableOpacity>
              </View>

              <View style={{ flexDirection: 'row' }}>
                {DAYS.map(d => (
                  <View key={d} style={{ flex: 1, alignItems: 'center', paddingBottom: 8 }}>
                    <Text style={{ fontSize: FontSize.xs, fontWeight: '800', color: Colours.textSecondary }}>
                      {d}
                    </Text>
                  </View>
                ))}
              </View>

              <View style={{ flexDirection: 'row', flexWrap: 'wrap' }}>
                {calendarDays.map((day, i) => {
                  if (!day) return <View key={`e-${i}`} style={{ width: '14.28%', aspectRatio: 1 }} />;
                  const disabled = isPast(day) || isBeyondMax(day);
                  const selected = isSelected(day);
                  const todayDay = isToday(day);
                  return (
                    <TouchableOpacity
                      key={day.toISOString()}
                      style={{ width: '14.28%', aspectRatio: 1, alignItems: 'center', justifyContent: 'center' }}
                      onPress={() => {
                        if (!disabled) {
                          setSelectedDate(day);
                          const newStart = new Date(day);
                          newStart.setHours(9, 0, 0, 0);
                          const newEnd = new Date(day);
                          newEnd.setHours(9, 30, 0, 0);
                          setStartTime(newStart);
                          setEndTime(newEnd);
                          setStep('start');
                        }
                      }}
                      disabled={disabled}
                      activeOpacity={0.7}
                    >
                      <View style={{
                        width: 36, height: 36, borderRadius: 18,
                        alignItems: 'center', justifyContent: 'center',
                        backgroundColor: selected ? Colours.primary : todayDay ? Colours.primaryLight : 'transparent',
                        borderWidth: todayDay && !selected ? 1 : 0,
                        borderColor: Colours.primary,
                      }}>
                        <Text style={{
                          fontSize: FontSize.sm, fontWeight: selected ? '900' : '600',
                          color: selected ? '#fff' : disabled ? Colours.border : todayDay ? Colours.primary : Colours.text,
                        }}>
                          {day.getDate()}
                        </Text>
                      </View>
                    </TouchableOpacity>
                  );
                })}
              </View>
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
                  style={{ backgroundColor: '#ffffff', height: 200 }}
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
                  Slot starts at {startTime.toLocaleTimeString('en-IE', { hour: '2-digit', minute: '2-digit' })}
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
                  style={{ backgroundColor: '#ffffff', height: 200 }}
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
                onPress={() => { if (durationValid) setStep('summary'); }}
                disabled={!durationValid}
                activeOpacity={0.88}
              >
                <Text style={{ color: '#fff', fontSize: FontSize.sm, fontWeight: '800' }}>
                  Review slot
                </Text>
                <MaterialCommunityIcons name="check" size={20} color="#fff" />
              </TouchableOpacity>
            </>
          )}

          {/* ── STEP: SUMMARY ── */}
          {step === 'summary' && selectedDate && (
            <>
              <View style={{
                backgroundColor: Colours.surface, borderRadius: 16,
                borderWidth: 1, borderColor: Colours.border, overflow: 'hidden',
              }}>
                <View style={{
                  flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
                  padding: Spacing.md, borderBottomWidth: 1, borderBottomColor: Colours.border,
                }}>
                  <View style={{
                    width: 40, height: 40, borderRadius: 20,
                    backgroundColor: Colours.primaryLight,
                    justifyContent: 'center', alignItems: 'center',
                  }}>
                    <MaterialCommunityIcons name="calendar" size={20} color={Colours.primary} />
                  </View>
                  <View>
                    <Text style={{ fontSize: FontSize.xs, fontWeight: '700', color: Colours.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Date
                    </Text>
                    <Text style={{ fontSize: FontSize.md, fontWeight: '800', color: Colours.text }}>
                      {selectedDate.toLocaleDateString('en-IE', { weekday: 'long', month: 'long', day: 'numeric' })}
                    </Text>
                  </View>
                </View>

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
                    </Text>
                  </View>
                </View>

                <View style={{
                  flexDirection: 'row', alignItems: 'center', gap: Spacing.md,
                  padding: Spacing.md,
                }}>
                  <View style={{
                    width: 40, height: 40, borderRadius: 20,
                    backgroundColor: Colours.primaryLight,
                    justifyContent: 'center', alignItems: 'center',
                  }}>
                    <MaterialCommunityIcons name="timer-outline" size={20} color={Colours.primary} />
                  </View>
                  <View>
                    <Text style={{ fontSize: FontSize.xs, fontWeight: '700', color: Colours.textSecondary, textTransform: 'uppercase', letterSpacing: 0.5 }}>
                      Duration
                    </Text>
                    <Text style={{ fontSize: FontSize.md, fontWeight: '800', color: Colours.text }}>
                      {formatDuration(durationMinutes)}
                    </Text>
                  </View>
                </View>
              </View>

              <View style={{
                flexDirection: 'row', gap: Spacing.sm, alignItems: 'flex-start',
                backgroundColor: Colours.surface, borderRadius: 12,
                padding: Spacing.md, borderWidth: 1, borderColor: Colours.border,
              }}>
                <MaterialCommunityIcons name="information-outline" size={16} color={Colours.textSecondary} />
                <Text style={{ flex: 1, fontSize: FontSize.xs, color: Colours.textSecondary, fontWeight: '600', lineHeight: 18 }}>
                  Learners will see this slot and can book sessions within it. You approve every booking.
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
                      Confirm slot
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

export default AddSlotModal;