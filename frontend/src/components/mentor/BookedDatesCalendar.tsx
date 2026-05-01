import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Colours, Spacing, FontSize } from '../../utils/constants';
import { styles } from '../../styles/BookedDatesCalendar.styles';
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
            dotColor: Colours.primary,
            dots: [{ color: Colours.primary }],
          };
        }
      }
    });

    // Add selected date styling
    if (selectedDate && marked[selectedDate]) {
      marked[selectedDate] = {
        ...marked[selectedDate],
        selected: true,
        selectedColor: Colours.primary,
        selectedTextColor: Colours.textLight,
      };
    } else if (selectedDate) {
      marked[selectedDate] = {
        selected: true,
        selectedColor: Colours.primary,
        selectedTextColor: Colours.textLight,
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
              backgroundColor: Colours.background,
              calendarBackground: Colours.background,
              textSectionTitleColor: Colours.textSecondary,
              textSectionTitleDisabledColor: Colours.border,
              selectedDayBackgroundColor: Colours.primary,
              selectedDayTextColor: Colours.textLight,
              todayTextColor: Colours.primary,
              todayBackgroundColor: Colours.primaryLight,
              dayTextColor: Colours.text,
              textDisabledColor: Colours.border,
              dotColor: Colours.primary,
              selectedDotColor: Colours.textLight,
              arrowColor: Colours.primary,
              disabledArrowColor: Colours.border,
              monthTextColor: Colours.text,
              indicatorColor: Colours.primary,
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

export default BookedDatesCalendar;