// frontend/src/components/Calendar/PatternCard.tsx

import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Switch, Alert } from 'react-native';
import { Colors, FontSize, Spacing } from '../../utils/constants';
import { RecurringPattern } from '../../types/Availability';

interface PatternCardProps {
  pattern: RecurringPattern;
  onToggleActive: (isActive: boolean) => Promise<void>;
  onDelete: () => Promise<void>;
  isLoading?: boolean;
}

const PatternCard = ({ pattern, onToggleActive, onDelete, isLoading }: PatternCardProps) => {
  const dayEmoji = getDayEmoji(pattern.day_of_week);
  const generateUntilDate = new Date(pattern.generate_until);
  const generateUntilStr = generateUntilDate.toLocaleDateString('en-US', {
    month: 'short',
    day: 'numeric',
    year: '2-digit',
  });

  const handleDelete = () => {
    Alert.alert(
      'Delete Pattern',
      `Remove ${pattern.day_of_week} ${pattern.start_time}-${pattern.end_time}?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await onDelete();
            } catch (err) {
              Alert.alert('Error', 'Failed to delete pattern');
            }
          },
        },
      ]
    );
  };

  const handleToggle = async (value: boolean) => {
    try {
      await onToggleActive(value);
    } catch (err) {
      Alert.alert('Error', 'Failed to update pattern');
    }
  };

  return (
    <View style={styles.card}>
      <View style={styles.header}>
        <View style={styles.daySection}>
          <Text style={styles.dayEmoji}>{dayEmoji}</Text>
          <View>
            <Text style={styles.dayName}>{pattern.day_of_week}</Text>
            <Text style={styles.time}>
              {pattern.start_time} - {pattern.end_time}
            </Text>
          </View>
        </View>
        <Switch
          value={pattern.is_active}
          onValueChange={handleToggle}
          trackColor={{ false: Colors.border, true: Colors.secondary }}
          thumbColor={pattern.is_active ? Colors.secondary : Colors.textSecondary}
          disabled={isLoading}
        />
      </View>

      <View style={styles.footer}>
        <Text style={styles.generateUntil}>Until {generateUntilStr}</Text>
        <TouchableOpacity
          style={styles.deleteButton}
          onPress={handleDelete}
          disabled={isLoading}
        >
          <Text style={styles.deleteText}>🗑</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
};

function getDayEmoji(day: string): string {
  const dayEmojis: { [key: string]: string } = {
    MONDAY: '🌟',
    TUESDAY: '📅',
    WEDNESDAY: '⚡',
    THURSDAY: '🎯',
    FRIDAY: '🚀',
    SATURDAY: '☀️',
    SUNDAY: '🌙',
  };
  return dayEmojis[day] || '📅';
}

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.md,
    marginBottom: Spacing.md,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: Spacing.md,
  },
  daySection: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  dayEmoji: {
    fontSize: FontSize.xl,
    marginRight: Spacing.md,
  },
  dayName: {
    fontSize: FontSize.md,
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  time: {
    fontSize: FontSize.sm,
    color: Colors.textSecondary,
  },
  footer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  generateUntil: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: '500',
  },
  deleteButton: {
    width: 32,
    height: 32,
    borderRadius: 8,
    backgroundColor: Colors.error,
    justifyContent: 'center',
    alignItems: 'center',
  },
  deleteText: {
    fontSize: FontSize.lg,
  },
});

export default PatternCard;