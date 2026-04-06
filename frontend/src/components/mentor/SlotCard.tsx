import React from 'react';
import { View, Text, TouchableOpacity } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing } from '../../utils/constants';
import { AvailabilitySlot } from '../../types/Availability';

interface SlotCardProps {
  slot: AvailabilitySlot;
  onPress?: () => void;
  onDelete?: () => void;
}

const SlotCard = ({ slot, onPress, onDelete }: SlotCardProps) => {
  const startTime = new Date(slot.start_time);
  const endTime = new Date(slot.end_time);

  const timeStr = startTime.toLocaleTimeString('en-IE', {
    hour: '2-digit', minute: '2-digit',
  }) + ' — ' + endTime.toLocaleTimeString('en-IE', {
    hour: '2-digit', minute: '2-digit',
  });

  const dayStr = startTime.toLocaleDateString('en-IE', {
    weekday: 'short', month: 'short', day: 'numeric',
  });

  const isAvailable = slot.status === 'available';
  const isBooked = slot.status === 'booked';

  const statusColor = isAvailable
    ? Colors.secondary
    : isBooked ? Colors.warning : Colors.error;

  const statusLabel = isAvailable ? 'Available' : isBooked ? 'Booked' : 'Cancelled';
  const statusIcon = isAvailable
    ? 'check-circle-outline'
    : isBooked ? 'clock-outline' : 'close-circle-outline';

  return (
    <TouchableOpacity
      style={{
        backgroundColor: Colors.background,
        borderRadius: 14, padding: Spacing.md,
        borderWidth: 1, borderColor: Colors.border,
        borderLeftWidth: 3, borderLeftColor: statusColor,
        gap: 6,
      }}
      onPress={isAvailable ? onPress : undefined}
      disabled={!isAvailable}
      activeOpacity={0.7}
    >
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text style={{ fontSize: FontSize.sm, fontWeight: '800', color: Colors.text }}>
          {dayStr}
        </Text>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4 }}>
          <MaterialCommunityIcons name={statusIcon as any} size={14} color={statusColor} />
          <Text style={{ fontSize: FontSize.xs, fontWeight: '700', color: statusColor }}>
            {statusLabel}
          </Text>
        </View>
      </View>

      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 6 }}>
        <MaterialCommunityIcons name="clock-outline" size={14} color={Colors.textSecondary} />
        <Text style={{ fontSize: FontSize.sm, fontWeight: '700', color: Colors.textSecondary }}>
          {timeStr}
        </Text>
      </View>

      {isAvailable && onDelete && (
        <TouchableOpacity
          onPress={onDelete}
          style={{
            alignSelf: 'flex-end',
            flexDirection: 'row', alignItems: 'center', gap: 4,
            paddingHorizontal: 10, paddingVertical: 4,
            borderRadius: 8, borderWidth: 1, borderColor: Colors.error + '40',
            backgroundColor: Colors.error + '10',
          }}
          activeOpacity={0.7}
        >
          <MaterialCommunityIcons name="trash-can-outline" size={14} color={Colors.error} />
          <Text style={{ fontSize: FontSize.xs, fontWeight: '800', color: Colors.error }}>
            Delete
          </Text>
        </TouchableOpacity>
      )}
    </TouchableOpacity>
  );
};

export default SlotCard;