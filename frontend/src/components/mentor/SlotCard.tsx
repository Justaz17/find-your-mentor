// frontend/src/components/Calendar/SlotCard.tsx

import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { Colors, FontSize, Spacing } from '../../utils/constants';
import { styles } from '../../styles/SlotCard.styles';
import { AvailabilitySlot } from '../../types/Availability';

interface SlotCardProps {
  slot: AvailabilitySlot;
  onPress?: () => void;
  onDelete?: () => void;
}

const SlotCard = ({ slot, onPress, onDelete }: SlotCardProps) => {
  const startTime = new Date(slot.start_time);
  const endTime = new Date(slot.end_time);
  
  const timeStr = `${startTime.getHours().toString().padStart(2, '0')}:${startTime
    .getMinutes()
    .toString()
    .padStart(2, '0')} - ${endTime.getHours().toString().padStart(2, '0')}:${endTime
    .getMinutes()
    .toString()
    .padStart(2, '0')}`;

  const dayStr = startTime.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });

  // Color based on status
  const getStatusColor = (): string => {
    switch (slot.status) {
      case 'available':
        return Colors.secondary; // Green
      case 'booked':
        return Colors.textSecondary; // Gray
      case 'cancelled':
        return Colors.error; // Red
      default:
        return Colors.border;
    }
  };

  const getStatusLabel = (): string => {
    switch (slot.status) {
      case 'available':
        return '✓ Available';
      case 'booked':
        return '✗ Booked';
      case 'cancelled':
        return '⚠ Cancelled';
      default:
        return slot.status;
    }
  };

  const statusColor = getStatusColor();
  const isAvailable = slot.status === 'available';

  return (
    <TouchableOpacity
      style={[
        styles.card,
        { borderLeftColor: statusColor, backgroundColor: isAvailable ? Colors.background : Colors.surface },
      ]}
      onPress={isAvailable ? onPress : undefined}
      disabled={!isAvailable}
      activeOpacity={0.7}
    >
      <View style={styles.header}>
        <Text style={styles.date}>{dayStr}</Text>
        <Text style={[styles.status, { color: statusColor }]}>{getStatusLabel()}</Text>
      </View>
      
      <Text style={styles.time}>{timeStr}</Text>

      {isAvailable && onDelete && (
        <TouchableOpacity style={styles.deleteButton} onPress={onDelete}>
          <Text style={styles.deleteText}>Delete</Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

export default SlotCard;