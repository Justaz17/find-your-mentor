// frontend/src/components/Calendar/PatternCard.tsx

import React from 'react';
import { View, Text, TouchableOpacity, Switch, Alert } from 'react-native';
import { Colors, FontSize, Spacing } from '../../utils/constants';
import { styles } from '../../styles/PatternCard.styles';
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

export default PatternCard;