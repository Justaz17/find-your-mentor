import React, { useMemo, useState, useEffect } from 'react';
import {
  View, ScrollView, Text, TouchableOpacity,
  Dimensions, StyleSheet,
} from 'react-native';
import { Surface, Divider } from 'react-native-paper';
import { Colors, Spacing, FontSize } from '../../utils/constants';
import { AvailabilitySlot } from '../../types/Mentor';
import { styles } from '../../styles/TimeLinePicker.styles';

interface TimelinePickerProps {
  availabilitySlots: AvailabilitySlot[];
  selectedDate: string;
  serviceDurationMinutes: number;
  onTimeSelected: (startTime: string, endTime: string) => void;
  bookedTimes?: { start_time: string; end_time: string }[];
}

const PIXELS_PER_HOUR = 80;
const SNAP_MINUTES = 30;
const TOP_PADDING = 16;
const HOUR_LABEL_WIDTH = 48;

const toMins = (d: Date) => d.getHours() * 60 + d.getMinutes();
const minsToPixel = (mins: number, refMins: number) => ((mins - refMins) / 60) * PIXELS_PER_HOUR;
const fmt = (mins: number) => {
  const h = Math.floor(mins / 60);
  const m = mins % 60;
  return `${String(h).padStart(2, '0')}:${String(m).padStart(2, '0')}`;
};

const TimeLinePicker = ({
  availabilitySlots,
  selectedDate,
  serviceDurationMinutes,
  onTimeSelected,
  bookedTimes = [],
}: TimelinePickerProps) => {
  const screenWidth = Dimensions.get('window').width;
  const trackWidth = screenWidth - Spacing.lg * 2 - HOUR_LABEL_WIDTH - 2;

  // ── Filter slots for this date ────────────────────────────────────────
  const slotsForDate = useMemo(
    () =>
      availabilitySlots
        .filter(s => {
          const d = new Date(s.start_time);
          const dateKey = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;
          return dateKey === selectedDate && s.status === 'available';
        })
        .sort((a, b) => new Date(a.start_time).getTime() - new Date(b.start_time).getTime()),
    [availabilitySlots, selectedDate]
  );

  // ── Bounds — full grid reference, never changes with active slot ──────
  const bounds = useMemo(() => {
    if (!slotsForDate.length) return null;
    const starts = slotsForDate.map(s => toMins(new Date(s.start_time)));
    const ends = slotsForDate.map(s => toMins(new Date(s.end_time)));
    return {
      minMins: Math.floor(Math.min(...starts) / 60) * 60,
      maxMins: Math.ceil(Math.max(...ends) / 60) * 60,
    };
  }, [slotsForDate]);

  const [activeSlotIdx, setActiveSlotIdx] = useState(0);

  // ── Valid tappable positions ──────────────────────────────────────────
  const validPositions = useMemo(() => {
    if (!bounds) return [];
    const results: { startMins: number; endMins: number; pixelTop: number }[] = [];

    for (const slot of slotsForDate) {
      const slotStartMins = toMins(new Date(slot.start_time));
      const slotEndMins = toMins(new Date(slot.end_time));

      let cursor = slotStartMins % SNAP_MINUTES === 0
        ? slotStartMins
        : Math.ceil(slotStartMins / SNAP_MINUTES) * SNAP_MINUTES;

      while (cursor + serviceDurationMinutes <= slotEndMins) {
        results.push({
          startMins: cursor,
          endMins: cursor + serviceDurationMinutes,
          pixelTop: minsToPixel(cursor, bounds.minMins) + TOP_PADDING,
        });
        cursor += SNAP_MINUTES;
      }
    }
    return results;
  }, [slotsForDate, serviceDurationMinutes, bounds]);

  const [selectedIdx, setSelectedIdx] = useState(0);

  useEffect(() => {
    setSelectedIdx(0);
    if (validPositions.length > 0) {
      const { startMins, endMins } = validPositions[0];
      fireCallback(startMins, endMins);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, serviceDurationMinutes, validPositions.length]);

  const fireCallback = (startMins: number, endMins: number) => {
    const base = new Date(selectedDate + 'T00:00:00');
    const start = new Date(base.getTime() + startMins * 60000);
    const end = new Date(base.getTime() + endMins * 60000);
    onTimeSelected(start.toISOString(), end.toISOString());
  };

  const handleTap = (idx: number) => {
    setSelectedIdx(idx);
    fireCallback(validPositions[idx].startMins, validPositions[idx].endMins);
  };

  // ── Early returns ─────────────────────────────────────────────────────
  if (!bounds || !slotsForDate.length) {
    return (
      <Surface style={styles.container} elevation={0}>
        <Text style={styles.emptyText}>No availability for this date</Text>
      </Surface>
    );
  }

  if (!validPositions.length) {
    return (
      <Surface style={styles.container} elevation={0}>
        <View style={styles.header}>
          <Text style={styles.title}>Select Time</Text>
        </View>
        <Text style={styles.emptyText}>
          No slot long enough for a {serviceDurationMinutes}-min session on this date.
        </Text>
      </Surface>
    );
  }

  // ── Active slot filter for tabs ───────────────────────────────────────
  const activeSlot = slotsForDate[activeSlotIdx];
  const activeSlotStartMins = activeSlot ? toMins(new Date(activeSlot.start_time)) : 0;
  const activeSlotEndMins = activeSlot ? toMins(new Date(activeSlot.end_time)) : 0;
  const activePositions = validPositions.filter(
    p => p.startMins >= activeSlotStartMins && p.endMins <= activeSlotEndMins
  );

  // ── Layout — always use bounds, never activeBounds ────────────────────
  const gridHeight = minsToPixel(bounds.maxMins, bounds.minMins) + TOP_PADDING * 2;

  const hourMarks: number[] = [];
  for (let m = bounds.minMins; m <= bounds.maxMins; m += 60) hourMarks.push(m);

  const halfHourMarks: number[] = [];
  for (let m = bounds.minMins + 30; m < bounds.maxMins; m += 60) halfHourMarks.push(m);

  const selected = validPositions[selectedIdx] ?? activePositions[0] ?? validPositions[0];
  const serviceBlockHeight = (serviceDurationMinutes / 60) * PIXELS_PER_HOUR;

  // ── Render ────────────────────────────────────────────────────────────
  return (
    <Surface style={styles.container} elevation={0}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Select Time</Text>
        <View style={styles.selectedBadge}>
          <Text style={styles.selectedBadgeText}>
            {fmt(bounds.minMins)} – {fmt(bounds.maxMins)}
          </Text>
        </View>
      </View>

      <Divider style={styles.divider} />

      {/* Info strip */}
      <View style={styles.infoRow}>
        <Text style={styles.durationLabel}>⏱ {serviceDurationMinutes} min session</Text>
        <Text style={styles.slotsLabel}>
          {validPositions.length} time{validPositions.length !== 1 ? 's' : ''} available
        </Text>
      </View>

      {/* Grid */}
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <View style={styles.gridRow}>

          {/* Hour labels */}
          <View style={[styles.labelsCol, { height: gridHeight }]}>
            {hourMarks.map(mins => (
              <View
                key={mins}
                style={[
                  styles.hourLabelWrap,
                  { top: minsToPixel(mins, bounds.minMins) + TOP_PADDING - 9 },
                ]}
              >
                <Text style={styles.hourLabel}>{fmt(mins)}</Text>
              </View>
            ))}
          </View>

          {/* Track */}
          <View style={[styles.track, { width: trackWidth, height: gridHeight }]}>

            {/* ① Grey base */}
            <View style={[StyleSheet.absoluteFill, { backgroundColor: '#F5F5F5' }]} />

            {/* ② Green available bands — all slots, not just active */}
            {slotsForDate.map((slot, i) => {
              const slotStartMins = toMins(new Date(slot.start_time));
              const slotEndMins = toMins(new Date(slot.end_time));
              const top = minsToPixel(slotStartMins, bounds.minMins) + TOP_PADDING;
              const height = ((slotEndMins - slotStartMins) / 60) * PIXELS_PER_HOUR;
              return <View key={i} style={[styles.availBand, { top, height }]} />;
            })}

            {/* ③ Hour grid lines */}
            {hourMarks.map(mins => (
              <View
                key={`h-${mins}`}
                style={[
                  styles.gridLineHour,
                  { top: minsToPixel(mins, bounds.minMins) + TOP_PADDING },
                ]}
              />
            ))}

            {/* ④ Half-hour grid lines */}
            {halfHourMarks.map(mins => (
              <View
                key={`hh-${mins}`}
                style={[
                  styles.gridLineHalf,
                  { top: minsToPixel(mins, bounds.minMins) + TOP_PADDING },
                ]}
              />
            ))}

            {/* ⑤ Tappable time slots */}
            {validPositions.map((pos, i) => {
            const isSelected = selected && pos.startMins === selected.startMins;
            return (
              <TouchableOpacity
                key={`pos-${i}`}
                style={{
                  position: 'absolute',
                  top: pos.pixelTop + 2,
                  left: Spacing.sm,
                  right: Spacing.sm,
                  height: 35,
                  borderRadius: 6,
                  backgroundColor: isSelected ? Colors.primary : Colors.primary + '25',
                  borderWidth: 1,
                  borderColor: isSelected ? Colors.primary : Colors.primary + '50',
                  flexDirection: 'row',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  paddingHorizontal: Spacing.sm,
                  zIndex: isSelected ? 20 : 10,
                }}
                onPress={() => handleTap(i)}
                activeOpacity={0.7}
              >
                <Text style={{ fontSize: 10, fontWeight: '700', color: isSelected ? '#fff' : Colors.primary }}>
                  {fmt(pos.startMins)}
                </Text>
                <Text style={{ fontSize: 10, fontWeight: '700', color: isSelected ? '#fff' : Colors.primary }}>
                  {isSelected ? ` ${fmt(pos.endMins)}` : ''}
                </Text>
              </TouchableOpacity>
            );
          })}
          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          Tap a time slot to select it
        </Text>
      </View>
    </Surface>
  );
};

export default TimeLinePicker;