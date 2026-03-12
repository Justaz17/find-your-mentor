// frontend/src/screens/BookingScreen.tsx

import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  StyleSheet,
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
import { getMyBookings } from '../../services/bookingService';
import { Colors, Spacing, FontSize } from '../../utils/constants';
import BookedDatesCalendar from '../../components/mentor/BookedDatesCalendar';

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
    if (newFilter !== 'all') {
      setSelectedDateFromCalendar(null);
    }
  };

  const handleCancelPending = async (bookingId: number) => {
    // TODO: wire up cancel API call
    // await cancelBooking(bookingId);
    // fetchBookings();
    console.log('Cancel pending booking', bookingId);
  };

  // Filter bookings
  const now = new Date();
  const filteredBookings = bookings.filter((booking) => {
    const slotEnd = new Date(booking.slot_end);
    const bookingDate = new Date(booking.slot_start).toISOString().split('T')[0];

    let passesStatusFilter = false;
    if (filter === 'upcoming')
      passesStatusFilter = slotEnd > now && booking.status === 'confirmed';
    if (filter === 'pending')
      passesStatusFilter = booking.status === 'pending';
    if (filter === 'past')
      passesStatusFilter = slotEnd <= now || booking.status === 'completed';
    if (filter === 'all')
      passesStatusFilter = true;

    if (selectedDateFromCalendar) {
      return passesStatusFilter && bookingDate === selectedDateFromCalendar;
    }

    return passesStatusFilter;
  });

  // Sort by date
  const sortedBookings = [...filteredBookings].sort((a, b) => {
    const dateA = new Date(a.slot_start);
    const dateB = new Date(b.slot_start);
    return dateB.getTime() - dateA.getTime();
  });

  const formatDateTime = (iso: string) => {
    const d = new Date(iso);
    return d.toLocaleDateString('en-IE', {
      weekday: 'short',
      month: 'short',
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

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed':
        return Colors.secondary;
      case 'completed':
        return Colors.secondary;
      case 'pending':
        return Colors.warning;
      case 'cancelled_by_learner':
        return Colors.error;
      default:
        return Colors.textSecondary;
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case 'confirmed':
        return 'Confirmed';
      case 'completed':
        return 'Completed';
      case 'pending':
        return 'Pending';
      case 'cancelled_by_learner':
        return 'Cancelled';
      default:
        return status;
    }
  };

  const getPaymentStatusColor = (status: string) => {
    switch (status) {
      case 'paid':
        return Colors.secondary;
      case 'pending':
        return Colors.warning;
      case 'refunded':
        return Colors.error;
      case 'partial_refund':
        return Colors.warning;
      default:
        return Colors.textSecondary;
    }
  };

  const getPaymentStatusLabel = (status: string) => {
    switch (status) {
      case 'paid':
        return 'Paid';
      case 'pending':
        return 'Pending';
      case 'refunded':
        return 'Refunded';
      case 'partial_refund':
        return 'Partial Refund';
      default:
        return status;
    }
  };

  // Count pending bookings for badge
  const pendingCount = bookings.filter((b) => b.status === 'pending').length;

  if (isLoading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator size="large" color={Colors.primary} />
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
                style={[
                  styles.filterButton,
                  filter === tab && styles.filterButtonActive,
                ]}
                labelStyle={[
                  styles.filterLabel,
                  filter === tab && styles.filterLabelActive,
                ]}
                compact
              >
                {tab.charAt(0).toUpperCase() + tab.slice(1)}
              </Button>
              {/* Badge for pending count */}
              {tab === 'pending' && pendingCount > 0 && (
                <View style={styles.badge}>
                  <Text style={styles.badgeText}>{pendingCount}</Text>
                </View>
              )}
            </View>
          ))}
        </View>
      </View>

      {/* Bookings List with Calendar Header */}
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

          return (
            <TouchableOpacity
              activeOpacity={0.7}
              onPress={() => setExpandedBookingId(isExpanded ? null : item.id)}
              style={styles.bookingTouchable}
            >
              <Card
                mode="outlined"
                style={[
                  styles.bookingCard,
                  isPending && styles.bookingCardPending,
                ]}
              >
                <Card.Content>
                  {/* Main Row - Always Visible */}
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

                  {/* Pending notice strip */}
                  {isPending && (
                    <View style={styles.pendingNotice}>
                      <Text style={styles.pendingNoticeText}>
                        ⏳ Awaiting mentor confirmation
                      </Text>
                    </View>
                  )}

                  {/* Expanded Details */}
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

                      {/* Action Buttons */}
                      <View style={styles.actions}>
                        <Button
                          mode="contained"
                          style={styles.primaryAction}
                          labelStyle={styles.actionButtonLabel}
                          onPress={() => {
                            // TODO: Get mentor_id from booking - need to add to Booking type
                            navigation.navigate('MentorProfile', { mentorId: 1 });
                          }}
                        >
                          Mentor Profile
                        </Button>

                        {/* Cancel pending - free of charge */}
                        {isPending && (
                          <Button
                            mode="outlined"
                            style={[styles.actionButton, styles.dangerAction]}
                            labelStyle={[styles.actionButtonLabel, styles.dangerActionLabel]}
                            onPress={() => handleCancelPending(item.id)}
                          >
                            Cancel (Free)
                          </Button>
                        )}

                        {/* Reschedule / Cancel for confirmed upcoming */}
                        {!isPast && item.status === 'confirmed' && (
                          <>
                            <Button
                              mode="outlined"
                              style={styles.actionButton}
                              labelStyle={styles.actionButtonLabel}
                              onPress={() => {
                                // TODO: Show reschedule modal
                              }}
                            >
                              Reschedule
                            </Button>
                            <Button
                              mode="outlined"
                              style={[styles.actionButton, styles.dangerAction]}
                              labelStyle={[styles.actionButtonLabel, styles.dangerActionLabel]}
                              onPress={() => {
                                // TODO: Show cancel confirmation
                              }}
                            >
                              Cancel
                            </Button>
                          </>
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
        scrollEnabled={true}
        refreshControl={
          <RefreshControl refreshing={isRefreshing} onRefresh={onRefresh} tintColor={Colors.primary} />
        }
        ListEmptyComponent={
          <View style={styles.emptyState}>
            <Text variant="titleMedium" style={styles.emptyStateTitle}>
              {filter === 'upcoming'
                ? 'No upcoming bookings'
                : filter === 'pending'
                ? 'No pending bookings'
                : 'No bookings yet'}
            </Text>
            <Text variant="bodyMedium" style={styles.emptyStateText}>
              {filter === 'upcoming'
                ? 'Book a mentor to get started'
                : filter === 'pending'
                ? 'Any bookings awaiting confirmation will appear here'
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

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: Colors.surface,
  },
  centered: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: Colors.surface,
    padding: Spacing.lg,
  },
  loadingText: {
    color: Colors.textSecondary,
    marginTop: Spacing.sm,
  },
  errorText: {
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
  },

  // Header
  header: {
    backgroundColor: Colors.background,
    paddingHorizontal: Spacing.lg,
    paddingBottom: Spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
  },
  title: {
    fontWeight: '800',
    color: Colors.text,
    marginBottom: Spacing.xs,
    letterSpacing: -0.3,
  },
  subtitle: {
    color: Colors.textSecondary,
  },

  // Filter Tabs
  filterContainer: {
    backgroundColor: Colors.background,
    borderBottomWidth: 1,
    borderBottomColor: Colors.border,
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.sm,
  },
  filterTabs: {
    flexDirection: 'row',
    gap: Spacing.sm,
  },
  filterButtonWrapper: {
    position: 'relative',
  },
  filterButton: {
    borderColor: Colors.border,
    borderWidth: 1,
  },
  filterButtonActive: {
    borderColor: Colors.primary,
    backgroundColor: Colors.primaryLight,
  },
  filterLabel: {
    fontSize: FontSize.sm,
    fontWeight: '600',
    color: Colors.textSecondary,
  },
  filterLabelActive: {
    color: Colors.primary,
    fontWeight: '700',
  },
  badge: {
    position: 'absolute',
    top: -4,
    right: -4,
    backgroundColor: Colors.warning,
    borderRadius: 8,
    minWidth: 16,
    height: 16,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 3,
  },
  badgeText: {
    color: Colors.textLight,
    fontSize: 10,
    fontWeight: '800',
  },

  // List
  listContent: {
    paddingHorizontal: Spacing.lg,
    paddingVertical: Spacing.md,
  },
  bookingTouchable: {
    marginBottom: Spacing.md,
  },
  bookingCard: {
    borderRadius: 16,
    borderColor: Colors.border,
  },
  bookingCardPending: {
    borderColor: Colors.warning,
    borderWidth: 1.5,
  },
  headerRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    gap: Spacing.md,
  },
  headerLeft: {
    flex: 1,
  },
  headerRight: {
    flexShrink: 1,
  },
  serviceName: {
    fontWeight: '800',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  dateText: {
    color: Colors.textSecondary,
    fontWeight: '500',
  },

  // Pending notice
  pendingNotice: {
    marginTop: Spacing.sm,
    backgroundColor: Colors.warning + '18',
    borderRadius: 8,
    paddingHorizontal: Spacing.md,
    paddingVertical: Spacing.xs,
  },
  pendingNoticeText: {
    fontSize: FontSize.xs,
    color: Colors.warning,
    fontWeight: '600',
  },

  divider: {
    backgroundColor: Colors.border,
    marginVertical: Spacing.md,
  },

  // Expanded Details
  detailSection: {
    marginBottom: Spacing.md,
  },
  sectionTitle: {
    color: Colors.textSecondary,
    fontWeight: '700',
    marginBottom: Spacing.xs,
    textTransform: 'uppercase',
    fontSize: FontSize.xs,
    letterSpacing: 0.5,
  },
  detailText: {
    color: Colors.text,
    fontWeight: '600',
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priceText: {
    color: Colors.primary,
    fontWeight: '900',
  },
  noteText: {
    color: Colors.text,
    lineHeight: 18,
    fontStyle: 'italic',
  },

  // Actions
  actions: {
    gap: Spacing.sm,
    marginTop: Spacing.md,
  },
  actionButton: {
    borderColor: Colors.border,
    borderRadius: 12,
  },
  primaryAction: {
    backgroundColor: Colors.primary,
    borderRadius: 12,
  },
  actionButtonLabel: {
    fontSize: FontSize.sm,
    fontWeight: '700',
  },
  dangerAction: {
    borderColor: Colors.error,
  },
  dangerActionLabel: {
    color: Colors.error,
  },

  // Empty State
  emptyState: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingVertical: Spacing.xxl,
  },
  emptyStateTitle: {
    fontWeight: '700',
    color: Colors.text,
    marginBottom: Spacing.xs,
  },
  emptyStateText: {
    color: Colors.textSecondary,
    textAlign: 'center',
    marginBottom: Spacing.lg,
    maxWidth: 280,
  },
  exploreButton: {
    borderRadius: 12,
  },
});

export default BookingScreen;