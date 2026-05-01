import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  ActivityIndicator,
  RefreshControl,
  FlatList,
  TouchableOpacity,
} from 'react-native';
import {
  Text,
  Card,
  Button,
  Chip,
  Surface,
  Divider,
} from 'react-native-paper';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { useNavigation } from '@react-navigation/native';
import { NativeStackNavigationProp } from '@react-navigation/native-stack';
import { RootStackParamList } from '../../navigation/types';
import { Booking } from '../../types/Booking';
import { getMyBookings, cancelBooking, learnerConfirmBooking } from '../../services/bookingService';
import { Colours, Spacing, FontSize } from '../../utils/constants';
import BookedDatesCalendar from '../../components/mentor/BookedDatesCalendar';
import { styles } from '../../styles/BookingScreen.styles';

type BookingScreenNavProp = NativeStackNavigationProp<RootStackParamList>;

const BookingScreen = () => {
  const insets = useSafeAreaInsets();
  const navigation = useNavigation<BookingScreenNavProp>();

  const [bookings, setBookings] = useState<Booking[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [filter, setFilter] = useState<'upcoming' | 'pending' | 'past' | 'all'>('upcoming');
  const [expandedBookingId, setExpandedBookingId] = useState<number | null>(null);
  const [selectedDateFromCalendar, setSelectedDateFromCalendar] = useState<string | null>(null);
  const [cancellingId, setCancellingId] = useState<number | null>(null);
  const [attendingId, setAttendingId] = useState<number | null>(null);
  
  const fetchBookings = useCallback(async () => {
    try {
      setError(null);
      const data = await getMyBookings();
      setBookings(data);
    } catch (err: any) {
      setError(err.message || 'Failed to load bookings');
    } finally {
      setIsLoading(false);
      setIsRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchBookings();
  }, [fetchBookings]);

  const onRefresh = () => {
    setIsRefreshing(true);
    fetchBookings();
  };

  const handleFilterChange = (newFilter: typeof filter) => {
    setFilter(newFilter);
    if (newFilter !== 'all') setSelectedDateFromCalendar(null);
  };

  const handleCancel = async (bookingId: number) => {
    setCancellingId(bookingId);
    try {
      await cancelBooking(bookingId);
      await fetchBookings();
    } catch (err: any) {
      setError(err.message || 'Failed to cancel booking');
    } finally {
      setCancellingId(null);
    }
  };

  const handleLearnerConfirm = async (bookingId: number) => {
    setAttendingId(bookingId);
    try {
      await learnerConfirmBooking(bookingId);
      await fetchBookings();
    } catch (err: any) {
      setError(err.message || 'Failed to confirm attendance');
    } finally {
      setAttendingId(null);
    }
};

  // Filter bookings
  const now = new Date();
  const filteredBookings = bookings.filter((booking) => {
    const slotEnd = new Date(booking.slot_end);
    const bookingDate = new Date(booking.slot_start).toISOString().split('T')[0];

    let passesStatusFilter = false;
    if (filter === 'upcoming') passesStatusFilter = slotEnd > now && booking.status === 'confirmed';
    if (filter === 'pending') passesStatusFilter = booking.status === 'pending';
    if (filter === 'past') passesStatusFilter = slotEnd <= now || booking.status === 'completed';
    if (filter === 'all') passesStatusFilter = true;

    if (selectedDateFromCalendar) {
      return passesStatusFilter && bookingDate === selectedDateFromCalendar;
    }
    return passesStatusFilter;
  });

  const sortedBookings = [...filteredBookings].sort((a, b) =>
    new Date(b.slot_start).getTime() - new Date(a.slot_start).getTime()
  );

  const formatDateTime = (iso: string) => {
    return new Date(iso).toLocaleDateString('en-IE', {
      weekday: 'short', month: 'short', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });
  };

  const formatTime = (iso: string) =>
    new Date(iso).toLocaleTimeString('en-IE', { hour: '2-digit', minute: '2-digit' });

  const getStatusColor = (s: string) => {
    switch (s) {
      case 'confirmed': case 'completed': return Colours.secondary;
      case 'pending': return Colours.warning;
      case 'cancelled_by_learner': case 'cancelled_by_mentor': return Colours.error;
      default: return Colours.textSecondary;
    }
  };

  const getStatusLabel = (s: string) => {
    switch (s) {
      case 'confirmed': return 'Confirmed';
      case 'completed': return 'Completed';
      case 'pending': return 'Pending';
      case 'cancelled_by_learner': return 'Cancelled';
      case 'cancelled_by_mentor': return 'Declined';
      default: return s;
    }
  };

  const getPaymentStatusColor = (s: string) => {
    switch (s) {
      case 'paid': return Colours.secondary;
      case 'pending': return Colours.warning;
      case 'refunded': case 'partial_refund': return Colours.error;
      default: return Colours.textSecondary;
    }
  };

  const getPaymentStatusLabel = (s: string) => {
    switch (s) {
      case 'paid': return 'Paid';
      case 'pending': return 'Pending';
      case 'refunded': return 'Refunded';
      case 'partial_refund': return 'Partial Refund';
      default: return s;
    }
  };

  const pendingCount = bookings.filter((b) => b.status === 'pending').length;

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colours.primary} />
        <Text variant="bodyMedium" style={styles.loadingText}>Loading bookings...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centered}>
        <Text variant="bodyLarge" style={styles.errorText}>{error}</Text>
        <Button mode="contained" onPress={() => { setIsLoading(true); fetchBookings(); }}>
          Try Again
        </Button>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <Surface style={[styles.header, { paddingTop: insets.top + Spacing.lg }]} elevation={0}>
        <Text variant="headlineSmall" style={styles.title}>Your Bookings</Text>
        <Text variant="bodyMedium" style={styles.subtitle}>Manage your mentoring sessions</Text>
      </Surface>

      {/* Filter Tabs */}
      <View style={styles.filterContainer}>
        <View style={styles.filterTabs}>
          {(['upcoming', 'pending', 'past', 'all'] as const).map((tab) => (
            <View key={tab} style={styles.filterButtonWrapper}>
              <Button
                mode={filter === tab ? 'outlined' : 'text'}
                onPress={() => handleFilterChange(tab)}
                style={[styles.filterButton, filter === tab && styles.filterButtonActive]}
                labelStyle={[styles.filterLabel, filter === tab && styles.filterLabelActive]}
                compact
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Button>
              {tab === 'pending' && pendingCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{pendingCount}</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      </View>

      {/* Bookings List */}
      <FlatList
        data={sortedBookings}
        keyExtractor={(item) => String(item.id)}
        ListHeaderComponent={
          filter === 'all' ? (
            <BookedDatesCalendar
              bookings={bookings}
              selectedDate={selectedDateFromCalendar}
              onDateSelect={setSelectedDateFromCalendar}
              filter={filter}
            />
          ) : null
        }
        renderItem={({ item }) => {
          const slotEnd = new Date(item.slot_end);
          const isPast = slotEnd <= now;
          const isExpanded = expandedBookingId === item.id;
          const isPending = item.status === 'pending';
          const isCancelling = cancellingId === item.id;

          return (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setExpandedBookingId(isExpanded ? null : item.id)}
              style={styles.bookingTouchable}
            >
              <Card
                mode="outlined"
                style={[styles.bookingCard, isPending && styles.bookingCardPending]}
              >
                <Card.Content>
                  <View style={styles.headerRow}>
                    <View style={styles.headerLeft}>
                      <Text variant="titleSmall" style={styles.serviceName}>
                        {item.service_title}
                      </Text>
                      <Text variant="bodySmall" style={styles.dateText}>
                        {formatDateTime(item.slot_start)}
                      </Text>
                    </View>
                    <View style={styles.headerRight}>
                      <Chip
                        mode="flat"
                        style={{ backgroundColor: getStatusColor(item.status) + '25' }}
                        textStyle={{ color: getStatusColor(item.status), fontWeight: '700', fontSize: FontSize.xs }}
                        compact
                      >
                        {getStatusLabel(item.status)}
                      </Chip>
                    </View>
                  </View>

                  {isPending && (
                    <View style={styles.pendingNotice}>
                      <Text style={styles.pendingNoticeText}>
                        Awaiting mentor confirmation
                      </Text>
                    </View>
                  )}

                  {isExpanded && (
                    <>
                      <Divider style={styles.divider} />

                      <View style={styles.detailSection}>
                        <Text variant="labelMedium" style={styles.sectionTitle}>Session Time</Text>
                        <Text variant="bodySmall" style={styles.detailText}>
                          {formatTime(item.slot_start)} – {formatTime(item.slot_end)}
                        </Text>
                      </View>

                      <View style={styles.detailSection}>
                        <Text variant="labelMedium" style={styles.sectionTitle}>Payment</Text>
                        <View style={styles.paymentRow}>
                          <Chip
                            mode="flat"
                            style={{ backgroundColor: getPaymentStatusColor(item.payment_status) + '25' }}
                            textStyle={{ color: getPaymentStatusColor(item.payment_status), fontWeight: '700', fontSize: FontSize.xs }}
                            compact
                          >
                            {getPaymentStatusLabel(item.payment_status)}
                          </Chip>
                          <Text variant="titleSmall" style={styles.priceText}>
                            {item.amount_paid === 0 ? 'Free' : `€${item.amount_paid}`}
                          </Text>
                        </View>
                      </View>

                      {item.learner_note && (
                        <View style={styles.detailSection}>
                          <Text variant="labelMedium" style={styles.sectionTitle}>Your Note</Text>
                          <Text variant="bodySmall" style={styles.noteText}>
                            {item.learner_note}
                          </Text>
                        </View>
                      )}

                      <View style={styles.actions}>
                        {/* Mentor Profile */}
                        <Button
                        mode="contained"
                        style={styles.primaryAction}
                        labelStyle={styles.actionButtonLabel}
                        onPress={() => {
                          console.log(' Item object:', item);
                          console.log(' mentor_profile_id:', item.mentor_profile_id);
                          console.log(' Type:', typeof item.mentor_profile_id);
                          navigation.navigate('MentorProfile', { mentorId: item.mentor_profile_id });
                        }}
                      >
                        Mentor Profile
                      </Button>
                        
                        {/* Cancel pending - free */}
                        {isPending && (
                          <Button
                            mode="outlined"
                            style={[styles.actionButton, styles.dangerAction]}
                            labelStyle={[styles.actionButtonLabel, styles.dangerActionLabel]}
                            loading={isCancelling}
                            disabled={isCancelling}
                            onPress={() => handleCancel(item.id)}
                          >
                            Cancel (Free)
                          </Button>
                        )}

                        {/* Cancel confirmed upcoming */}
                        {!isPast && item.status === 'confirmed' && (
                          <Button
                            mode="outlined"
                            style={[styles.actionButton, styles.dangerAction]}
                            labelStyle={[styles.actionButtonLabel, styles.dangerActionLabel]}
                            loading={isCancelling}
                            disabled={isCancelling}
                            onPress={() => handleCancel(item.id)}
                          >
                            Cancel Session
                          </Button>
                        )}
                      {/* Confirm attendance — past confirmed sessions */}
                      {isPast && item.status === 'confirmed' && !item.learner_confirmed && (
                        <Button
                          mode="contained"
                          style={{ backgroundColor: Colours.secondary, borderRadius: 12 }}
                          labelStyle={styles.actionButtonLabel}
                          loading={attendingId === item.id}
                          disabled={attendingId === item.id}
                          onPress={() => handleLearnerConfirm(item.id)}
                        >
                          Confirm I attended
                        </Button>
                      )}

                      {isPast && item.status === 'confirmed' && item.learner_confirmed && (
                        <Button
                          mode="outlined"
                          style={styles.actionButton}
                          labelStyle={[styles.actionButtonLabel, { color: Colours.secondary }]}
                          disabled
                        >
                          Attendance confirmed.
                        </Button>
                      )}
                      </View>
                    </>
                  )}
                </Card.Content>
              </Card>
            </TouchableOpacity>
          );
        }}
        contentContainerStyle={styles.listContent}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={Colours.primary} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text variant="titleMedium" style={styles.emptyStateTitle}>
              {filter === 'upcoming' ? 'No upcoming bookings'
                : filter === 'pending' ? 'No pending bookings'
                : 'No bookings yet'}
            </Text>
            <Text variant="bodyMedium" style={styles.emptyStateText}>
              {filter === 'upcoming' ? 'Book a mentor to get started'
                : filter === 'pending' ? 'Any bookings awaiting confirmation will appear here'
                : 'Your past sessions will appear here'}
            </Text>
            {(filter === 'upcoming' || filter === 'pending') && (
              <Button
                mode="contained"
                onPress={() => navigation.navigate('Search' as never)}
                style={styles.exploreButton}
              >
                Explore Mentors
              </Button>
            )}
          </View>
        }
      />
    </View>
  );
};

export default BookingScreen;