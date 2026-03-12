// frontend/src/components/Booking/TimeLinePicker.tsx
//
// Visual timeline grid for selecting a booking time.
// - Y axis: hours spanning only the mentor's earliest start → latest end
// - Available windows shown in green, gaps between slots shown greyed out
// - Draggable purple service block snaps to valid 30-min positions within green zones
// - Block height = exact service duration in pixels (no minimums, no hardcoding)
// - Impossible to place block outside mentor availability

import React, { useMemo, useState, useRef, useEffect } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
  PanResponder,
  Animated,
  Text,
  Dimensions,
  TouchableOpacity,
} from 'react-native';
import { Surface, Divider } from 'react-native-paper';
import { Colors, Spacing, FontSize } from '../../utils/constants';
import { AvailabilitySlot } from '../../types/Mentor';

interface TimelinePickerProps {
  availabilitySlots: AvailabilitySlot[];
  selectedDate: string;
  serviceDurationMinutes: number;
  onTimeSelected: (startTime: string, endTime: string) => void;
}

const PIXELS_PER_HOUR = 80;
const SNAP_MINUTES = 30;
const TOP_PADDING = 16;
const HOUR_LABEL_WIDTH = 56;

/** Minutes since midnight */
const toMins = (d: Date) => d.getHours() * 60 + d.getMinutes();

/** Pixel offset from a reference minute value */
const minsToPixel = (mins: number, refMins: number) =>
  ((mins - refMins) / 60) * PIXELS_PER_HOUR;

/** Format HH:MM */
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
}: TimelinePickerProps) => {
  const screenWidth = Dimensions.get('window').width;
  const trackWidth = screenWidth - Spacing.lg * 2 - HOUR_LABEL_WIDTH - 2;

  // ── Filter slots for this date ──────────────────────────────────────────
  const slotsForDate = useMemo(
    () =>
      availabilitySlots
        .filter((s) => {
          const d = new Date(s.start_time).toISOString().split('T')[0];
          return d === selectedDate && s.status === 'available';
        })
        .sort(
          (a, b) =>
            new Date(a.start_time).getTime() - new Date(b.start_time).getTime()
        ),
    [availabilitySlots, selectedDate]
  );

  // ── Timeline bounds — kept for validPositions calculation ───────────────
  const bounds = useMemo(() => {
    if (!slotsForDate.length) return null;
    const starts = slotsForDate.map((s) => toMins(new Date(s.start_time)));
    const ends = slotsForDate.map((s) => toMins(new Date(s.end_time)));
    const minMins = Math.floor(Math.min(...starts) / 60) * 60;
    const maxMins = Math.ceil(Math.max(...ends) / 60) * 60;
    return { minMins, maxMins };
  }, [slotsForDate]);

  const [activeSlotIdx, setActiveSlotIdx] = useState(0);

  // ── Active slot bounds — drives the grid display ─────────────────────────
  const activeBounds = useMemo(() => {
    const slot = slotsForDate[activeSlotIdx];
    if (!slot) return bounds;
    const minMins = Math.floor(toMins(new Date(slot.start_time)) / 60) * 60;
    const maxMins = Math.ceil(toMins(new Date(slot.end_time)) / 60) * 60;
    return { minMins, maxMins };
  }, [slotsForDate, activeSlotIdx, bounds]);

  // ── All valid draggable positions ───────────────────────────────────────
  const validPositions = useMemo(() => {
    if (!bounds) return [];
    const results: { startMins: number; endMins: number; pixelTop: number }[] = [];

    for (const slot of slotsForDate) {
      const slotStartMins = toMins(new Date(slot.start_time));
      const slotEndMins = toMins(new Date(slot.end_time));

      // Start cursor at slot start (must be on a SNAP_MINUTES boundary)
      let cursor =
        slotStartMins % SNAP_MINUTES === 0
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


  // ── State ───────────────────────────────────────────────────────────────
  const [selectedIdx, setSelectedIdx] = useState(0);
  const dragOffset = useRef(new Animated.Value(0)).current;

  // Refs so PanResponder never has stale closures
  const selectedIdxRef = useRef(0);
  const validPositionsRef = useRef(validPositions);
  const activePositionsRef = useRef<{startMins:number;endMins:number;pixelTop:number}[]>([]);
  const isLockedRef = useRef(false);
  const onTimeSelectedRef = useRef(onTimeSelected);
  const selectedDateRef = useRef(selectedDate);

  useEffect(() => { validPositionsRef.current = validPositions; }, [validPositions]);
  useEffect(() => { onTimeSelectedRef.current = onTimeSelected; }, [onTimeSelected]);
  useEffect(() => { selectedDateRef.current = selectedDate; }, [selectedDate]);

  // Reset selection when date / service changes
  useEffect(() => {
    setSelectedIdx(0);
    selectedIdxRef.current = 0;
    dragOffset.setValue(0);
    if (validPositions.length > 0) {
      const { startMins, endMins } = validPositions[0];
      fireCallback(startMins, endMins, selectedDate);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedDate, serviceDurationMinutes, validPositions.length]);

  const fireCallback = (startMins: number, endMins: number, date: string) => {
    const base = new Date(date + 'T00:00:00');
    const start = new Date(base.getTime() + startMins * 60000);
    const end = new Date(base.getTime() + endMins * 60000);
    onTimeSelectedRef.current(start.toISOString(), end.toISOString());
  };

  // ── PanResponder ────────────────────────────────────────────────────────
  const panResponder = useRef(
    PanResponder.create({
      onStartShouldSetPanResponder: () => !isLockedRef.current,
      onMoveShouldSetPanResponder: () => !isLockedRef.current,
      onPanResponderMove: (_e, { dy }) => {
        dragOffset.setValue(dy);
      },
      onPanResponderRelease: (_e, { dy }) => {
        const positions = activePositionsRef.current;
        const currentIdx = selectedIdxRef.current;
        if (!positions.length) return;

        const targetPixel = positions[currentIdx]?.pixelTop + dy;

        // Snap to nearest valid position within the active slot window
        let bestIdx = 0;
        let bestDist = Infinity;
        positions.forEach((pos, i) => {
          const dist = Math.abs(pos.pixelTop - targetPixel);
          if (dist < bestDist) { bestDist = dist; bestIdx = i; }
        });

        selectedIdxRef.current = bestIdx;
        setSelectedIdx(bestIdx);
        fireCallback(
          positions[bestIdx].startMins,
          positions[bestIdx].endMins,
          selectedDateRef.current
        );

        Animated.spring(dragOffset, {
          toValue: 0,
          useNativeDriver: false,
          tension: 140,
          friction: 12,
        }).start();
      },
    })
  ).current;

  // ── Early returns ───────────────────────────────────────────────────────
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

  // ── Layout calculations ─────────────────────────────────────────────────
  const gridHeight =
    minsToPixel(activeBounds?.maxMins ?? 0, activeBounds?.minMins ?? 0) + TOP_PADDING * 2;

  const hourMarks: number[] = [];
  for (let m = activeBounds?.minMins ?? 0; m <= (activeBounds?.maxMins ?? 0); m += 60) hourMarks.push(m);

  const halfHourMarks: number[] = [];
  for (let m = (activeBounds?.minMins ?? 0) + 30; m < (activeBounds?.maxMins ?? 0); m += 60) halfHourMarks.push(m);

  // Positions within the currently active slot window only
  const activeSlot = slotsForDate[activeSlotIdx];
  const activeSlotStartMins = activeSlot ? toMins(new Date(activeSlot.start_time)) : 0;
  const activeSlotEndMins = activeSlot ? toMins(new Date(activeSlot.end_time)) : 0;
  const activePositions = (validPositions ?? [])
    .filter((p) => p.startMins >= activeSlotStartMins && p.endMins <= activeSlotEndMins)
    .map((p) => ({
      ...p,
      pixelTop: minsToPixel(p.startMins, activeBounds?.minMins ?? 0) + TOP_PADDING,
    }));

  // Keep ref in sync so PanResponder always snaps within the active window
  activePositionsRef.current = activePositions;

  // Locked if only one (or zero) positions exist in the current window
  const isLocked = activePositions.length <= 1;
  isLockedRef.current = isLocked;

  const selected = activePositions[selectedIdx] ?? activePositions[0] ?? validPositions[0];
  const serviceBlockHeight = (serviceDurationMinutes / 60) * PIXELS_PER_HOUR;

  return (
    <Surface style={styles.container} elevation={0}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.title}>Select Time</Text>
        <View style={styles.selectedBadge}>
          <Text style={styles.selectedBadgeText}>
            {fmt(activeBounds?.minMins ?? 0)} – {fmt(activeBounds?.maxMins ?? 0)}
          </Text>
        </View>
      </View>

      <Divider style={styles.divider} />

      {/* Info strip */}
      <View style={styles.infoRow}>
        <Text style={styles.durationLabel}>⏱ {serviceDurationMinutes} min session</Text>
        <Text style={styles.slotsLabel}>
          {validPositions.length} slot{validPositions.length !== 1 ? 's' : ''} available
        </Text>
      </View>

      {/* Slot window tabs — only shown when mentor has multiple windows */}
      {slotsForDate.length > 1 && (
        <ScrollView
          horizontal
          showsHorizontalScrollIndicator={false}
          contentContainerStyle={styles.slotTabsRow}
          style={styles.slotTabsScroll}
        >
          {slotsForDate.map((slot, i) => {
            const startM = toMins(new Date(slot.start_time));
            const endM = toMins(new Date(slot.end_time));
            const isActive = activeSlotIdx === i;
            return (
              <TouchableOpacity
                key={i}
                onPress={() => {
                  setActiveSlotIdx(i);
                  setSelectedIdx(0);
                  selectedIdxRef.current = 0;
                  dragOffset.setValue(0);
                  const positions = validPositions.filter(
                    (p) => p.startMins >= startM && p.endMins <= endM
                  );
                  if (positions.length > 0) {
                    fireCallback(positions[0].startMins, positions[0].endMins, selectedDateRef.current);
                  }
                }}
                style={[styles.slotTab, isActive && styles.slotTabActive]}
              >
                <Text style={[styles.slotTabText, isActive && styles.slotTabTextActive]}>
                  {fmt(startM)} – {fmt(endM)}
                </Text>
              </TouchableOpacity>
            );
          })}
        </ScrollView>
      )}

      {/* Grid */}
      <ScrollView
        style={styles.scrollView}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.gridRow}>

          {/* Hour label column */}
          <View style={[styles.labelsCol, { height: gridHeight }]}>
            {hourMarks.map((mins) => (
              <View
                key={mins}
                style={[
                  styles.hourLabelWrap,
                  { top: minsToPixel(mins, activeBounds?.minMins ?? 0) + TOP_PADDING - 9 },
                ]}
              >
                <Text style={styles.hourLabel}>{fmt(mins)}</Text>
              </View>
            ))}
          </View>

          {/* Track */}
          <View style={[styles.track, { width: trackWidth, height: gridHeight }]}>

            {/* ① Grey base = unavailable (full height) */}
            <View style={[StyleSheet.absoluteFill, styles.unavailableBase]} />

            {/* ② Green band = active slot only */}
            {[slotsForDate[activeSlotIdx]].filter(Boolean).map((slot, i) => {
              const slotStartMins = toMins(new Date(slot.start_time));
              const slotEndMins = toMins(new Date(slot.end_time));
              const top = minsToPixel(slotStartMins, activeBounds?.minMins ?? 0) + TOP_PADDING;
              const height = ((slotEndMins - slotStartMins) / 60) * PIXELS_PER_HOUR;
              return (
                <View key={i} style={[styles.availBand, { top, height }]} />
              );
            })}

            {/* ③ Hour grid lines */}
            {hourMarks.map((mins) => (
              <View
                key={`h-${mins}`}
                style={[
                  styles.gridLineHour,
                  { top: minsToPixel(mins, activeBounds?.minMins ?? 0) + TOP_PADDING },
                ]}
              />
            ))}

            {/* ④ Half-hour grid lines */}
            {halfHourMarks.map((mins) => (
              <View
                key={`hh-${mins}`}
                style={[
                  styles.gridLineHalf,
                  { top: minsToPixel(mins, activeBounds?.minMins ?? 0) + TOP_PADDING },
                ]}
              />
            ))}

            {/* ⑤ Snap-point dots (left edge, inside available bands) */}
            {!isLocked &&
              validPositions.map((pos, i) => (
                <View
                  key={`snap-${i}`}
                  style={[
                    styles.snapDot,
                    { top: pos.pixelTop + serviceBlockHeight / 2 - 3 },
                  ]}
                />
              ))}

            {/* ⑥ Draggable service block */}
            <View
              {...(isLocked ? {} : panResponder.panHandlers)}
              style={StyleSheet.absoluteFill}
              pointerEvents="box-none"
            >
              <Animated.View
                style={[
                  styles.serviceBlock,
                  {
                    top: selected.pixelTop,
                    height: serviceBlockHeight,
                    transform: [{ translateY: dragOffset }],
                  },
                ]}
              >
                {/* Top time */}
                <Text style={styles.blockTimeLabelTop}>{fmt(selected.startMins)}</Text>

                {/* Centre */}
                <View style={styles.blockCentre}>
                  <Text style={styles.blockDuration}>{serviceDurationMinutes} min</Text>
                  {!isLocked && <Text style={styles.blockHint}>↕ drag</Text>}
                  {isLocked && <Text style={styles.blockHint}>Fixed</Text>}
                </View>

                {/* Bottom time */}
                <Text style={styles.blockTimeLabelBottom}>{fmt(selected.endMins)}</Text>
              </Animated.View>
            </View>

          </View>
        </View>
      </ScrollView>

      {/* Footer */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>
          {isLocked
            ? 'This service fills the entire available slot'
            : 'Drag the block up or down · snaps to 30-min intervals'}
        </Text>
      </View>
    </Surface>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: Spacing.lg,
    marginVertical: Spacing.md,
    borderRadius: 16,
    backgroundColor: Colors.background,
    overflow: 'hidden',
    borderWidth: 1,
    borderColor: Colors.border,
  },

  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
  },
  selectedBadge: {
    backgroundColor: Colors.primary,
    paddingHorizontal: Spacing.md,
    paddingVertical: 4,
    borderRadius: 20,
  },
  selectedBadgeText: {
    color: Colors.textLight,
    fontWeight: '700',
    fontSize: FontSize.sm,
  },

  divider: {
    backgroundColor: Colors.border,
    marginHorizontal: Spacing.lg,
  },

  infoRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    backgroundColor: Colors.primaryLight,
  },
  durationLabel: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.primary,
  },
  slotsLabel: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
  },

  scrollView: {
    maxHeight: 420,
  },
  gridRow: {
    flexDirection: 'row',
  },

  // Labels column
  labelsCol: {
    width: HOUR_LABEL_WIDTH,
    position: 'relative',
    backgroundColor: Colors.surface,
    borderRightWidth: 1,
    borderRightColor: Colors.border,
  },
  hourLabelWrap: {
    position: 'absolute',
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  hourLabel: {
    fontSize: 10,
    fontWeight: '600',
    color: Colors.textSecondary,
  },

  // Track
  track: {
    position: 'relative',
  },

  // Layers
  unavailableBase: {
    backgroundColor: '#F5F5F5', // light grey = unavailable
  },
  availBand: {
    position: 'absolute',
    left: 0,
    right: 0,
    backgroundColor: '#E8F5E9', // light green = available
    borderTopWidth: 1,
    borderBottomWidth: 1,
    borderColor: '#A5D6A7',
  },
  gridLineHour: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 1,
    backgroundColor: '#D0D0D0',
  },
  gridLineHalf: {
    position: 'absolute',
    left: 8,
    right: 0,
    height: 1,
    backgroundColor: '#E8E8E8',
  },
  snapDot: {
    position: 'absolute',
    left: 3,
    width: 5,
    height: 5,
    borderRadius: 3,
    backgroundColor: Colors.primary,
    opacity: 0.4,
  },

  // Service block
  serviceBlock: {
    position: 'absolute',
    left: Spacing.md,
    right: Spacing.md,
    backgroundColor: Colors.primary,
    borderRadius: 10,
    zIndex: 20,
    elevation: 6,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 3 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    paddingHorizontal: Spacing.sm,
    paddingVertical: 4,
    justifyContent: 'space-between',
  },
  blockTimeLabelTop: {
    color: Colors.textLight,
    fontSize: 11,
    fontWeight: '700',
    opacity: 0.9,
  },
  blockCentre: {
    alignItems: 'center',
    flex: 1,
    justifyContent: 'center',
  },
  blockDuration: {
    color: Colors.textLight,
    fontWeight: '800',
    fontSize: FontSize.md,
  },
  blockHint: {
    color: Colors.textLight,
    fontSize: 10,
    opacity: 0.7,
    marginTop: 2,
  },
  blockTimeLabelBottom: {
    color: Colors.textLight,
    fontSize: 11,
    fontWeight: '700',
    opacity: 0.9,
    textAlign: 'right',
  },

  footer: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.primaryLight,
  },
  footerText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontStyle: 'italic',
    textAlign: 'center',
  },

  slotTabsScroll: {
    backgroundColor: Colors.background,
  },
  slotTabsRow: {
    flexDirection: 'row',
    gap: Spacing.sm,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  slotTab: {
    paddingHorizontal: Spacing.md,
    paddingVertical: 6,
    borderRadius: 20,
    borderWidth: 1.5,
    borderColor: Colors.border,
    backgroundColor: Colors.surface,
  },
  slotTabActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primary,
  },
  slotTabText: {
    fontSize: FontSize.xs,
    fontWeight: '700',
    color: Colors.textSecondary,
  },
  slotTabTextActive: {
    color: Colors.textLight,
  },
  emptyText: {
    padding: Spacing.lg,
    textAlign: 'center',
    color: Colors.textSecondary,
    fontSize: FontSize.sm,
  },
});

export default TimeLinePicker;