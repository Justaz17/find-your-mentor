import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';
import { MaterialCommunityIcons } from '@expo/vector-icons';
import { Colors, FontSize, Spacing } from '../../utils/constants';
import { AvailabilitySlot } from '../../types/Availability';

interface SlotCardProps {
  slot: AvailabilitySlot;
  onPress?: () => void;
  onDelete?: () => void;
}

const SlotCard = ({ slot, onPress, onDelete }: SlotCardProps) => {
  const start = new Date(slot.start_time);
  const end = new Date(slot.end_time);

  const pad = (n: number) => String(n).padStart(2, '0');
  const timeStr = `${pad(start.getHours())}:${pad(start.getMinutes())} – ${pad(end.getHours())}:${pad(end.getMinutes())}`;
  const dayStr = start.toLocaleDateString('en-IE', { weekday: 'short', month: 'short', day: 'numeric' });

  const durationMins = Math.round((end.getTime() - start.getTime()) / 60000);
  const durationStr = durationMins >= 60
    ? `${Math.floor(durationMins / 60)}h${durationMins % 60 > 0 ? ` ${durationMins % 60}m` : ''}`
    : `${durationMins}m`;

  const isAvailable = slot.status === 'available';
  const isBooked = slot.status === 'booked';

  const statusIcon = isAvailable ? 'check-circle-outline' : isBooked ? 'lock-outline' : 'close-circle-outline';
  const statusColor = isAvailable ? Colors.secondary : isBooked ? Colors.textSecondary : Colors.error;
  const statusLabel = isAvailable ? 'Available' : isBooked ? 'Booked' : 'Cancelled';

  return (
    <TouchableOpacity
      style={[styles.card, { borderLeftColor: statusColor, opacity: isAvailable ? 1 : 0.7 }]}
      onPress={isAvailable ? onPress : undefined}
      disabled={!isAvailable}
      activeOpacity={0.8}
    >
      <View style={styles.top}>
        <View style={styles.left}>
          <Text style={styles.day}>{dayStr}</Text>
          <View style={styles.timeRow}>
            <MaterialCommunityIcons name="clock-outline" size={13} color={Colors.textSecondary} />
            <Text style={styles.time}>{timeStr}</Text>
            <Text style={styles.duration}>· {durationStr}</Text>
          </View>
        </View>
        <View style={styles.right}>
          <View style={[styles.statusBadge, { backgroundColor: statusColor + '18' }]}>
            <MaterialCommunityIcons name={statusIcon as any} size={13} color={statusColor} />
            <Text style={[styles.statusText, { color: statusColor }]}>{statusLabel}</Text>
          </View>
          {isAvailable && onDelete && (
            <TouchableOpacity
              onPress={onDelete}
              style={styles.deleteBtn}
              hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
              activeOpacity={0.7}
            >
              <MaterialCommunityIcons name="trash-can-outline" size={17} color={Colors.error} />
            </TouchableOpacity>
          )}
        </View>
      </View>
    </TouchableOpacity>
  );
};

const styles = StyleSheet.create({
  card: {
    backgroundColor: Colors.background,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderWidth: 1,
    borderColor: Colors.border,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.sm,
    marginBottom: Spacing.sm,
  },
  top: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  left: { flex: 1 },
  day: {
    fontSize: FontSize.sm,
    fontWeight: '800',
    color: Colors.text,
    marginBottom: 4,
  },
  timeRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  time: {
    fontSize: FontSize.sm,
    fontWeight: '700',
    color: Colors.text,
  },
  duration: {
    fontSize: FontSize.xs,
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  right: {
    alignItems: 'flex-end',
    gap: 6,
  },
  statusBadge: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 999,
  },
  statusText: {
    fontSize: 11,
    fontWeight: '800',
  },
  deleteBtn: {
    padding: 2,
  },
});

export default SlotCard;