import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Switch, Alert } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing } from '../../utils/constants';
import { RecurringPattern } from '../../types/Availability';

interface PatternCardProps {
  pattern: RecurringPattern;
  onToggleActive: (isActive: boolean) => Promise<void>;
  onDelete: () => Promise<void>;
  isLoading?: boolean;
}

const DAY_ICONS: Record<string, string> = {
  MONDAY: 'alpha-m-circle-outline',
  TUESDAY: 'alpha-t-circle-outline',
  WEDNESDAY: 'alpha-w-circle-outline',
  THURSDAY: 'alpha-t-circle-outline',
  FRIDAY: 'alpha-f-circle-outline',
  SATURDAY: 'alpha-s-circle-outline',
  SUNDAY: 'alpha-s-circle-outline',
};

const DAY_COLORS: Record<string, string> = {
  MONDAY: '#6C3AED',
  TUESDAY: '#3B82F6',
  WEDNESDAY: '#10B981',
  THURSDAY: '#F59E0B',
  FRIDAY: '#EF4444',
  SATURDAY: '#EC4899',
  SUNDAY: '#8B5CF6',
};

const PatternCard = ({ pattern, onToggleActive, onDelete, isLoading }: PatternCardProps) => {
  const dayColor = DAY_COLORS[pattern.day_of_week] ?? Colors.primary;
  const dayIcon = DAY_ICONS[pattern.day_of_week] ?? 'calendar-outline';

  const generateUntilStr = new Date(pattern.generate_until).toLocaleDateString('en-IE', {
    month: 'short', day: 'numeric', year: '2-digit',
  });

  const handleDelete = () => {
    Alert.alert(
      'Delete pattern',
      `Remove ${pattern.day_of_week} ${pattern.start_time}–${pattern.end_time}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete', style: 'destructive',
          onPress: async () => {
            try { await onDelete(); }
            catch { Alert.alert('Error', 'Failed to delete pattern'); }
          },
        },
      ]
    );
  };

  return (
    <View style={styles.card}>
      <View style={styles.top}>
        <View style={[styles.dayIconWrap, { backgroundColor: dayColor + '18' }]}>
          <MaterialCommunityIcons name={dayIcon as any} size={22} color={dayColor} />
        </View>
        <View style={styles.info}>
          <Text style={styles.dayName}>
            {pattern.day_of_week.charAt(0) + pattern.day_of_week.slice(1).toLowerCase()}
          </Text>
          <View style={styles.timeRow}>
            <MaterialCommunityIcons name="clock-outline" size={13} color={Colors.textSecondary} />
            <Text style={styles.time}>{pattern.start_time} – {pattern.end_time}</Text>
          </View>
        </View>
        <Switch
          value={pattern.is_active}
          onValueChange={async v => {
            try { await onToggleActive(v); }
            catch { Alert.alert('Error', 'Failed to update pattern'); }
          }}
          trackColor={{ false: Colors.border, true: Colors.secondary + '80' }}
          thumbColor={pattern.is_active ? Colors.secondary : Colors.textSecondary}
          disabled={isLoading}
        />
      </View>

      <View style={styles.footer}>
        <View style={styles.untilRow}>
          <MaterialCommunityIcons name="calendar-end" size={13} color={Colors.textSecondary} />
          <Text style={styles.untilText}>Until {generateUntilStr}</Text>
        </View>
        <TouchableOpacity
          style={styles.deleteBtn}
          onPress={handleDelete}
          disabled={isLoading}
          activeOpacity={0.8}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <MaterialCommunityIcons name="trash-can-outline" size={18} color={Colors.error} />
        </TouchableOpacity>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.background,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.border,
    padding: Spacing.md,
    marginBottom: Spacing.sm,
    gap: Spacing.sm,
  },
  top: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: Spacing.sm,
  },
  dayIconWrap: {
    width: 42,
    height: 42,
    borderRadius: 12,
    justifyContent: 'center',
    alignItems: 'center',
    borderWidth: 1,
    borderColor: Colors.border,
  },
  info: { flex: 1 },
  dayName: {
    fontSize: FontSize.md,
    fontWeight: '900',
    color: Colors.text,
    marginBottom: 2,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  time: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    borderTopWidth: 1,
    borderTopColor: Colors.border,
    paddingTop: Spacing.sm,
  },
  untilRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  untilText: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  deleteBtn: {
    padding: 4,
  },
});

export default PatternCard;