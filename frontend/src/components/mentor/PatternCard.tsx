import React from 'react';
import { View, Text, TouchableOpacity, Switch } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing } from '../../utils/constants';
import { RecurringPattern } from '../../types/Availability';

interface PatternCardProps {
  pattern: RecurringPattern;
  onToggleActive: (isActive: boolean) => Promise<void>;
  onDelete: () => Promise<void>;
  isLoading?: boolean;
}

const DAY_SHORT: Record<string, string> = {
  MONDAY: 'Mon', TUESDAY: 'Tue', WEDNESDAY: 'Wed',
  THURSDAY: 'Thu', FRIDAY: 'Fri', SATURDAY: 'Sat', SUNDAY: 'Sun',
};

const PatternCard = ({ pattern, onToggleActive, onDelete, isLoading }: PatternCardProps) => {
  const generateUntilStr = new Date(pattern.generate_until).toLocaleDateString('en-IE', {
    month: 'short', day: 'numeric', year: 'numeric',
  });

  return (
    <View style={{
      backgroundColor: Colors.background, borderRadius: 16,
      padding: Spacing.md, borderWidth: 1, borderColor: Colors.border,
      gap: Spacing.sm, opacity: pattern.is_active ? 1 : 0.6,
    }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: Spacing.md }}>
        <View style={{
          width: 48, height: 48, borderRadius: 24,
          backgroundColor: pattern.is_active ? Colors.primaryLight : Colors.surface,
          justifyContent: 'center', alignItems: 'center',
          borderWidth: 1, borderColor: pattern.is_active ? Colors.primary + '40' : Colors.border,
        }}>
          <Text style={{
            fontSize: FontSize.xs, fontWeight: '900',
            color: pattern.is_active ? Colors.primary : Colors.textSecondary,
          }}>
            {DAY_SHORT[pattern.day_of_week] ?? pattern.day_of_week.slice(0, 3)}
          </Text>
        </View>

        <View style={{ flex: 1, gap: 2 }}>
          <Text style={{ fontSize: FontSize.md, fontWeight: '900', color: Colors.text }}>
            Every {pattern.day_of_week.charAt(0) + pattern.day_of_week.slice(1).toLowerCase()}
          </Text>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <MaterialCommunityIcons name="clock-outline" size={13} color={Colors.textSecondary} />
            <Text style={{ fontSize: FontSize.xs, fontWeight: '700', color: Colors.textSecondary }}>
              {pattern.start_time} — {pattern.end_time}
            </Text>
          </View>
          <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
            <MaterialCommunityIcons name="calendar-end" size={13} color={Colors.textSecondary} />
            <Text style={{ fontSize: FontSize.xs, fontWeight: '600', color: Colors.textSecondary }}>
              Until {generateUntilStr}
            </Text>
          </View>
        </View>

        <Switch
          value={pattern.is_active}
          onValueChange={onToggleActive}
          trackColor={{ false: Colors.border, true: Colors.primary }}
          thumbColor="#fff"
          disabled={isLoading}
        />
      </View>

      <TouchableOpacity
        style={{
          alignSelf: 'flex-end',
          flexDirection: 'row', alignItems: 'center', gap: 4,
          paddingHorizontal: 10, paddingVertical: 4,
          borderRadius: 8, borderWidth: 1, borderColor: Colors.error + '40',
          backgroundColor: Colors.error + '10',
        }}
        onPress={onDelete}
        disabled={isLoading}
        activeOpacity={0.7}
      >
        <MaterialCommunityIcons name="trash-can-outline" size={14} color={Colors.error} />
        <Text style={{ fontSize: FontSize.xs, fontWeight: '800', color: Colors.error }}>
          Delete
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default PatternCard;