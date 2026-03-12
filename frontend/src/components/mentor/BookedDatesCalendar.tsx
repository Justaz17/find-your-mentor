// frontend/src/components/Calendar/BookedDatesCalendar.tsx

import React, { useMemo } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Colors, Spacing, FontSize } from '../../utils/constants';
import { Booking } from '../../types/Booking';

interface BookedDatesCalendarProps {
  bookings: Booking[];
  selectedDate?: string;
  onDateSelect: (date: string | null) => void;
  filter: 'all' | 'upcoming' | 'past';
}

const BookedDatesCalendar = ({ bookings, selectedDate, onDateSelect, filter }: BookedDatesCalendarProps) => {
  const today = new Date();
  today.setHours(0, 0, 0, 0);

  // Mark booked dates
  const markedDates = useMemo(() => {
    const marked: Record<string, any> = {};
    const now = new Date();

    bookings.forEach((booking) => {
      const slotEnd = new Date(booking.slot_end);
      
      // Filter based on current filter
      let include = false;
      if (filter === 'all') {
        include = true;
      } else if (filter === 'upcoming') {
        include = slotEnd > now && booking.status === 'confirmed';
      } else if (filter === 'past') {
        include = slotEnd <= now || booking.status === 'completed';
      }

      if (include) {
        const date = new Date(booking.slot_start).toISOString().split('T')[0];
        
        if (!marked[date]) {
          marked[date] = {
            marked: true,
            dotColor: Colors.primary,
            dots: [{ color: Colors.primary }],
          };
        }
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
  }, [bookings, selectedDate, filter]);

  const hasBookings = Object.keys(markedDates).length > 0;

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Your bookings</Text>
        {hasBookings && (
          <Text style={styles.hint}>Booked dates highlighted</Text>
        )}
      </View>

      {!hasBookings ? (
        <View style={styles.emptyState}>
          <Text style={styles.emptyStateText}>No bookings on this filter</Text>
        </View>
      ) : (
        <View style={styles.calendarWrapper}>
          <Calendar
            minDate={today.toISOString().split('T')[0]}
            markingType="dot"
            markedDates={markedDates}
            onDayPress={(day) => {
              const dateStr = day.dateString;
              if (selectedDate === dateStr) {
                onDateSelect(null); // Toggle off
              } else if (markedDates[dateStr]?.marked || markedDates[dateStr]?.selected) {
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
              dotColor: Colors.primary,
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
          <Text style={styles.selectedLabel}>Filtering by:</Text>
          <Text style={styles.selectedDate}>
            {new Date(selectedDate).toLocaleDateString('en-IE', {
              weekday: 'short',
              month: 'short',
              day: 'numeric',
            })}
          </Text>
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
    paddingVertical: Spacing.lg,
    paddingHorizontal: Spacing.lg,
    alignItems: 'center',
  },
  emptyStateText: {
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

export default BookedDatesCalendar;