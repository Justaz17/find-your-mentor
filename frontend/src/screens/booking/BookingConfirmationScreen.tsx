import React, { useState } from 'react';
import {
  View,
  ScrollView,
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
import { styles } from '../../styles/BookingConfirmationScreen.styles';

type ConfirmRouteProp = RouteProp<RootStackParamList, 'BookingConfirmation'>;

const BookingConfirmationScreen = () => {
  const route = useRoute<ConfirmRouteProp>();
  const navigation = useNavigation<NativeStackNavigationProp<RootStackParamList>>();
  const insets = useSafeAreaInsets();

  // slotId is now used as the primary identifier — avoids timezone mismatch issues
  const { mentorId, serviceId, slotId, serviceName, price, slotStart, slotEnd } = route.params;

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
    const hoursUntilBooking = (new Date(slotStart).getTime() - now.getTime()) / (1000 * 60 * 60);
    if (hoursUntilBooking >= 24) return 'Full refund';
    if (hoursUntilBooking >= 2) return '70% refund';
    return 'No refund';
  };

  const handleConfirmBooking = async () => {
    setIsSubmitting(true);
    setError(null);
    try {
      // Use slotId directly — most reliable, no timezone matching issues
      await createBooking({
        mentor_service_id: serviceId,
        availability_slot_id: slotId,
        start_time: slotStart,
        end_time: slotEnd,
        learner_note: learnerNote.trim() || undefined,
      });
      setIsBooked(true);
    } catch (err: any) {
      setError(err.message || 'Failed to create booking. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const durationMinutes = getDurationMinutes();

  // ── Success state ─────────────────────────────────────────────────────
  if (isBooked) {
    return (
      <View style={styles.successContainer}>
        <View style={styles.successIcon}>
          <Text style={styles.successCheck}>✓</Text>
        </View>
        <Text variant="headlineSmall" style={styles.successTitle}>
          Session Requested!
        </Text>
        <Text variant="bodyLarge" style={styles.successText}>
          Your {serviceName} session is pending mentor approval.
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

  // ── Confirmation form ─────────────────────────────────────────────────
  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={{ paddingBottom: insets.bottom + 40 }}
      showsVerticalScrollIndicator={false}
    >
      <Text variant="headlineSmall" style={styles.pageTitle}>
        Confirm your booking
      </Text>

      {/* Session details */}
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

      {/* Learner note */}
      <Card mode="outlined" style={styles.sectionCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>
            Help your mentor prepare
          </Text>
          <Text variant="bodySmall" style={styles.noteHint}>
            Share your skill level, what you'd like to focus on, or any questions you have.
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

      {/* Payment */}
      <Card mode="outlined" style={styles.sectionCard}>
        <Card.Content>
          <Text variant="titleMedium" style={styles.sectionTitle}>Payment</Text>
          <Surface style={styles.paymentStatus} elevation={0}>
            <Text variant="bodyMedium" style={styles.paymentStatusText}>
              Status: Pending
            </Text>
            <Text variant="bodySmall" style={styles.paymentStatusHint}>
              Payment is processed once your mentor confirms the booking.
            </Text>
          </Surface>
        </Card.Content>
      </Card>

      {/* Cancellation policy */}
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
        <View style={styles.errorContainer}>
          <Text variant="bodyMedium" style={styles.errorText}>{error}</Text>
        </View>
      )}

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

export default BookingConfirmationScreen;