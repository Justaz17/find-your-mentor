import React, { useState } from 'react';
import {
  View,
  ScrollView,
  StyleSheet,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  TextInput,
  Surface,
  Divider,
} from 'react-native-paper';
import { RouteProp, useRoute, useNavigation } from '@react-navigation/native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { createBooking } from '../../services/bookingService';
import { Colors, Spacing } from '../../utils/constants';

type ConfirmRouteProp = RouteProp<RootStackParamList, 'BookingConfirmation'>;

const BookingConfirmationScreen = () => {
  const route = useRoute<ConfirmRouteProp>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();
  const { mentorId, serviceId, serviceName, price, slotStart, slotEnd } = route.params;

  const [learnerNote, setLearnerNote] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isBooked, setIsBooked] = useState(false);

  const formatDateTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-IE', {
      weekday: 'long',
      month: 'long',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const formatTime = (iso: string) => {
    return new Date(iso).toLocaleTimeString('en-IE', {
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  const getDurationMinutes = () => {
    const start = new Date(slotStart);
    const end = new Date(slotEnd);
    return Math.round((end.getTime() - start.getTime()) / 60000);
  };

  const getCancellationRefund = () => {
    const now = new Date();
    const bookingTime = new Date(slotStart);
    const hoursUntilBooking = (bookingTime.getTime() - now.getTime()) / (1000 * 60 * 60);

    if (hoursUntilBooking >= 24) {
      return 'Full refund';
    } else if (hoursUntilBooking >= 2) {
      return '70% refund';
    } else {
      return 'No refund';
    }
  };

  const handleConfirmBooking = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      // TODO: Backend needs to be updated to accept start_time/end_time instead of slot_id
      // For now, we'll need to find the slot that matches these times
      await createBooking({
        mentor_service_id: serviceId,
        availability_slot_id: 0, // Placeholder - backend will need to handle start/end times
        learner_note: learnerNote.trim() || undefined,
        start_time: slotStart,
        end_time: slotEnd,
      });
      setIsBooked(true);
    } catch (err: any) {
      setError(err.message || 'Failed to create booking');
    } finally {
      setIsSubmitting(false);
    }
  };

  const durationMinutes = getDurationMinutes();
  const cancellationRefund = getCancellationRefund();

  // Success state
  if (isBooked) {
    return (
      <View style={styles.successContainer}>
        <Text style={styles.successEmoji}>✓</Text>
        <Text variant="headlineSmall" style={styles.successTitle}>
          Session Booked!
        </Text>
        <Text variant="bodyLarge" style={styles.successText}>
          Your {serviceName} session is confirmed. Pending mentor approval.
        </Text>

        <Card mode="outlined" style={styles.successCard}>
          <Card.Content>
            <View style={styles.detailRow}>
              <Text variant="bodyMedium" style={styles.detailLabel}>Service</Text>
              <Text variant="bodyMedium" style={styles.detailValue}>{serviceName}</Text>
            </View>
            <Divider style={styles.divider} />
            <View style={styles.detailRow}>
              <Text variant="bodyMedium" style={styles.detailLabel}>When</Text>
              <Text variant="bodyMedium" style={styles.detailValue}>
                {formatDateTime(slotStart)}
              </Text>
            </View>
            <Divider style={styles.divider} />
            <View style={styles.detailRow}>
              <Text variant="bodyMedium" style={styles.detailLabel}>Duration</Text>
              <Text variant="bodyMedium" style={styles.detailValue}>
                {durationMinutes} minutes
              </Text>
            </View>
            <Divider style={styles.divider} />
            <View style={styles.detailRow}>
              <Text variant="bodyMedium" style={styles.detailLabel}>Total</Text>
              <Text variant="titleMedium" style={styles.detailPrice}>
                {price === 0 ? 'Free' : `€${price}`}
              </Text>
            </View>
          </Card.Content>
        </Card>

        <Button
          mode="contained"
          onPress={() => navigation.navigate('Main' as never)}
          style={styles.homeButton}
          contentStyle={styles.homeButtonContent}
          labelStyle={styles.homeButtonLabel}
        >
          Back to Home
        </Button>

        <Text variant="bodySmall" style={styles.cancelNote}>
          Free cancellation up to 24 hours before your session.{'\n'}
          70% refund if cancelled 2–24 hours before.{'\n'}
          No refund within 2 hours of the session.
        </Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
      showsVerticalScrollIndicator={false}
    >
      <Text variant="headlineSmall" style={styles.pageTitle}>
        Confirm your booking
      </Text>

      {/* Booking Summary */}
      <Card mode="outlined" style={styles.sectionCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>Session Details</Text>

          <View style={styles.detailRow}>
            <Text variant="bodyMedium" style={styles.detailLabel}>Service</Text>
            <Text variant="bodyMedium" style={styles.detailValue}>{serviceName}</Text>
          </View>
          <Divider style={styles.divider} />
          <View style={styles.detailRow}>
            <Text variant="bodyMedium" style={styles.detailLabel}>Date</Text>
            <Text variant="bodyMedium" style={styles.detailValue}>
              {formatDateTime(slotStart)}
            </Text>
          </View>
          <Divider style={styles.divider} />
          <View style={styles.detailRow}>
            <Text variant="bodyMedium" style={styles.detailLabel}>Time</Text>
            <Text variant="bodyMedium" style={styles.detailValue}>
              {formatTime(slotStart)} – {formatTime(slotEnd)}
            </Text>
          </View>
          <Divider style={styles.divider} />
          <View style={styles.detailRow}>
            <Text variant="bodyMedium" style={styles.detailLabel}>Duration</Text>
            <Text variant="bodyMedium" style={styles.detailValue}>
              {durationMinutes} minutes
            </Text>
          </View>
          <Divider style={styles.divider} />
          <View style={styles.detailRow}>
            <Text variant="bodyMedium" style={styles.detailLabel}>Total</Text>
            <Text variant="headlineSmall" style={styles.detailPrice}>
              {price === 0 ? 'Free' : `€${price}`}
            </Text>
          </View>
        </Card.Content>
      </Card>

      {/* Learner Note */}
      <Card mode="outlined" style={styles.sectionCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Help your mentor prepare
          </Text>
          <Text variant="bodySmall" style={styles.noteHint}>
            Share your skill level, what you'd like to focus on, or any questions you have. This helps your mentor tailor the session to you.
          </Text>
          <TextInput
            mode="outlined"
            label="Your note to the mentor"
            value={learnerNote}
            onChangeText={setLearnerNote}
            multiline
            numberOfLines={4}
            maxLength={1000}
            style={styles.noteInput}
            outlineColor={Colors.border}
            activeOutlineColor={Colors.primary}
            placeholder="e.g., I'm a beginner in Python and struggling with functions..."
          />
          <Text variant="bodySmall" style={styles.charCount}>
            {learnerNote.length}/1000
          </Text>
        </Card.Content>
      </Card>

      {/* Payment Status */}
      <Card mode="outlined" style={styles.sectionCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>Payment Status</Text>
          <Surface style={styles.paymentStatus} elevation={0}>
            <Text variant="bodyMedium" style={styles.paymentStatusText}>
              Status: Pending
            </Text>
            <Text variant="bodySmall" style={styles.paymentStatusHint}>
              Payment will be processed once your mentor accepts the booking.
            </Text>
          </Surface>
        </Card.Content>
      </Card>

      {/* Cancellation Policy */}
      <Card mode="outlined" style={styles.sectionCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>Cancellation Policy</Text>
          <View style={styles.policyRow}>
            <Text variant="bodyMedium" style={styles.policyGreen}>✓ 24+ hours before</Text>
            <Text variant="bodyMedium" style={styles.policyValue}>Full refund</Text>
          </View>
          <View style={styles.policyRow}>
            <Text variant="bodyMedium" style={styles.policyAmber}>⚠ 2–24 hours before</Text>
            <Text variant="bodyMedium" style={styles.policyValue}>70% refund</Text>
          </View>
          <View style={styles.policyRow}>
            <Text variant="bodyMedium" style={styles.policyRed}>✗ Under 2 hours</Text>
            <Text variant="bodyMedium" style={styles.policyValue}>No refund</Text>
          </View>
        </Card.Content>
      </Card>

      {error && (
        <Text variant="bodyMedium" style={styles.errorText}>{error}</Text>
      )}

      {/* Confirm Button */}
      <View style={styles.confirmSection}>
        <Button
          mode="contained"
          onPress={handleConfirmBooking}
          loading={isSubmitting}
          disabled={isSubmitting}
          style={styles.confirmButton}
          contentStyle={styles.confirmButtonContent}
          labelStyle={styles.confirmButtonLabel}
        >
          Confirm Booking
        </Button>
      </View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
    paddingHorizontal: Spacing.lg,
  },
  pageTitle: {
    fontWeight: '800',
    color: Colors.text,
    marginTop: Spacing.md,
    marginBottom: Spacing.md,
    letterSpacing: -0.3,
  },

  sectionCard: {
    marginBottom: Spacing.md,
    borderRadius: 18,
    borderColor: Colors.border,
  },
  sectionTitle: {
    fontWeight: '800',
    color: Colors.text,
    marginBottom: Spacing.sm,
    letterSpacing: -0.2,
  },

  detailRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingVertical: 8,
  },
  detailLabel: {
    color: Colors.textSecondary,
    fontWeight: '600',
  },
  detailValue: {
    color: Colors.text,
    fontWeight: '700',
    flex: 1,
    textAlign: 'right',
  },
  detailPrice: {
    color: Colors.primary,
    fontWeight: '900',
  },
  divider: {
    backgroundColor: Colors.border,
  },

  // Learner note
  noteHint: {
    color: Colors.textSecondary,
    marginBottom: Spacing.sm,
    lineHeight: 18,
  },
  noteInput: {
    backgroundColor: Colors.background,
  },
  charCount: {
    color: Colors.textSecondary,
    textAlign: 'right',
    marginTop: 4,
  },

  // Payment status
  paymentStatus: {
    backgroundColor: Colors.primaryLight,
    borderRadius: 12,
    padding: Spacing.md,
  },
  paymentStatusText: {
    fontWeight: '700',
    color: Colors.text,
    marginBottom: 4,
  },
  paymentStatusHint: {
    color: Colors.textSecondary,
  },

  // Cancellation policy
  policyRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 6,
  },
  policyGreen: {
    color: '#059669',
    fontWeight: '600',
  },
  policyAmber: {
    color: '#D97706',
    fontWeight: '600',
  },
  policyRed: {
    color: Colors.error,
    fontWeight: '600',
  },
  policyValue: {
    color: Colors.text,
    fontWeight: '700',
  },

  errorText: {
    color: Colors.error,
    textAlign: 'center',
    marginBottom: Spacing.md,
    fontWeight: '700',
  },

  confirmSection: {
    marginBottom: Spacing.lg,
  },
  confirmButton: {
    borderRadius: 14,
  },
  confirmButtonContent: {
    paddingVertical: 8,
  },
  confirmButtonLabel: {
    fontSize: 16,
    fontWeight: '800',
    letterSpacing: -0.2,
  },

  // Success
  successContainer: {
    flex: 1,
    backgroundColor: Colors.surface,
    justifyContent: 'center',
    alignItems: 'center',
    padding: Spacing.lg,
  },
  successEmoji: {
    fontSize: 64,
    marginBottom: Spacing.md,
  },
  successTitle: {
    fontWeight: '900',
    color: Colors.text,
    marginBottom: Spacing.sm,
    letterSpacing: -0.3,
  },
  successText: {
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    lineHeight: 24,
  },
  successCard: {
    width: '100%',
    borderRadius: 18,
    borderColor: Colors.border,
    marginBottom: Spacing.lg,
  },
  homeButton: {
    borderRadius: 14,
    width: '100%',
    marginBottom: Spacing.md,
  },
  homeButtonContent: {
    paddingVertical: 8,
  },
  homeButtonLabel: {
    fontSize: 16,
    fontWeight: '800',
  },
  cancelNote: {
    color: Colors.textSecondary,
    textAlign: 'center',
    lineHeight: 20,
  },
});

export default BookingConfirmationScreen;