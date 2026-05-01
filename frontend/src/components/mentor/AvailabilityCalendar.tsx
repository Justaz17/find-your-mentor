// frontend/src/components/Calendar/AvailabilityCalendar.tsx

import React, { useMemo } from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Calendar } from 'react-native-calendars';
import { Colours, Spacing, FontSize } from '../../utils/constants';
import { styles } from '../../styles/AvailabilityCalendar.styles';
import { AvailabilitySlot } from '../../types/Mentor';

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
            dotColor: Colours.secondary,
            dots: [{ color: Colours.secondary }],
          };
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
              dotColor: Colours.secondary,
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
          <Text style={styles.selectedLabel}>Selected:</Text>
          <Text style={styles.selectedDate}>{formatDate(selectedDate)}</Text>
        </View>
      )}
    </View>
  );
};

export default AvailabilityCalendar;