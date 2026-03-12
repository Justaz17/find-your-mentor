// frontend/src/components/Calendar/AvailabilityCalendar.tsx

import React, { useMemo } from 'react';
import { View, Text, StyleSheet, TouchableOpacity } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Colors, Spacing, FontSize } from '../../utils/constants';
import { AvailabilitySlot } from '../../types/Availability';

interface AvailabilityCalendarProps {
  slots: AvailabilitySlot[];
  onDateSelect: (date: string) => void;
  selectedDate?: string;
}

const AvailabilityCalendar = ({ slots, onDateSelect, selectedDate }: AvailabilityCalendarProps) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Get all dates with available slots
  const markedDates = useMemo(() => {
    const marked: Record<string, any> = {};
    
    slots
      .filter((s) => s.status === 'available' && new Date(s.start_time) > today)
      .forEach((slot) => {
        const date = new Date(slot.start_time).toISOString().split('T')[0];
        
        if (!marked[date]) {
          marked[date] = {
            marked: true,
            dotColor: Colors.secondary,
            dots: [{ color: Colors.secondary }],
          };
        }
      });

    // Add selected date styling
    if (selectedDate && marked[selectedDate]) {
      marked[selectedDate] = {
        ...marked[selectedDate],
        selected: true,
        selectedColor: Colors.primary,
        selectedTextColor: Colors.textLight,
      };
    } else if (selectedDate) {
      marked[selectedDate] = {
        selected: true,
        selectedColor: Colors.primary,
        selectedTextColor: Colors.textLight,
      };
    }

    return marked;
  }, [slots, selectedDate]);

  const formatDate = (dateStr: string) => {
    const [year, month, day] = dateStr.split('-');
    return `${day}/${month}/${year}`;
  };

  const hasAvailability = Object.keys(markedDates).length > 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Select a date</Text>
        {hasAvailability && (
          <Text style={styles.hint}>Available dates highlighted</Text>
        )}
      </View>

      {!hasAvailability ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No availability available</Text>
          <Text style={styles.emptyStateSubtext}>Check back later</Text>
        </View>
      ) : (
        <View style={styles.calendarWrapper}>
          <Calendar
            minDate={today.toISOString().split('T')[0]}
            markingType="dot"
            markedDates={markedDates}
            onDayPress={(day) => {
              const dateStr = day.dateString;
              if (markedDates[dateStr]?.marked || markedDates[dateStr]?.selected) {
                onDateSelect(dateStr);
              }
            }}
            theme={{
              backgroundColor: Colors.background,
              calendarBackground: Colors.background,
              textSectionTitleColor: Colors.textSecondary,
              textSectionTitleDisabledColor: Colors.border,
              selectedDayBackgroundColor: Colors.primary,
              selectedDayTextColor: Colors.textLight,
              todayTextColor: Colors.primary,
              todayBackgroundColor: Colors.primaryLight,
              dayTextColor: Colors.text,
              textDisabledColor: Colors.border,
              dotColor: Colors.secondary,
              selectedDotColor: Colors.textLight,
              arrowColor: Colors.primary,
              disabledArrowColor: Colors.border,
              monthTextColor: Colors.text,
              indicatorColor: Colors.primary,
              textDayFontFamily: 'System',
              textMonthFontSize: FontSize.lg,
              textMonthFontWeight: '700',
              textDayHeaderFontSize: FontSize.xs,
              textDayFontSize: FontSize.md,
              textDayHeaderFontWeight: '600',
            }}
            style={styles.calendar}
          />
        </View>
      )}

      {selectedDate && markedDates[selectedDate] && (
        <View style={styles.selectedInfo}>
          <Text style={styles.selectedLabel}>Selected:</Text>
          <Text style={styles.selectedDate}>{formatDate(selectedDate)}</Text>
        </View>
      )}
    </View>
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
    paddingHorizontal: Spacing.lg,
    paddingTop: Spacing.lg,
    paddingBottom: Spacing.sm,
  },
  title: {
    fontSize: FontSize.lg,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  hint: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  calendarWrapper: {
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
  },
  calendar: {
    borderRadius: 12,
  },
  emptyState: {
    paddingVertical: Spacing.xl,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
  },
  emptyStateText: {
    fontSize: FontSize.md,
    fontWeight: '600',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  emptyStateSubtext: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  selectedInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    backgroundColor: Colors.primaryLight,
  },
  selectedLabel: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  selectedDate: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.primary,
  },
});

export default AvailabilityCalendar;